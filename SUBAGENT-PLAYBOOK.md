# Subagent Playbook — Completing the Remaining Work

**Companion to [`HANDOFF-2026-07-31.md`](HANDOFF-2026-07-31.md).** Read that first for
verified state. This document is *how to execute* the remaining tasks with subagents: which
agent, what context it needs, what "done" means, and what must not run in parallel.

Task IDs (T3–T12) match the inventory in `~/.claude/plans/what-are-the-remaining-fancy-wand.md`
and the handoff docs. T1, T2 and T6 are closed.

---

## Rules that apply to every dispatch

These exist because this project has repeatedly shipped regressions and false conclusions.
Put them in the prompt of every agent you dispatch — subagents start cold and will not infer them.

1. **A status code is not a result.** A prior session concluded `.assetsignore` "did not work"
   from 200s that were the SPA index fallback. Assert on **response bodies and rendered DOM**.
   A 200 may be the fallback; a 404 may be a deleted site rather than a missing file.
2. **Never serve this project with a plain static server.** `python3 -m http.server` / `npx serve`
   cannot execute Pages Functions, so `/api/*` 404s and the site looks broken in ways that are
   not real. Pointed at the repo root, that is also what published the original credential leak.
   Use `npm run dev` (wraps `wrangler pages dev public --local`).
3. **Scope discipline.** `~/Desktop/portfolio-astro/` and `~/Desktop/Portfolio/` are *different
   projects*. Do not read, edit, or report findings about them.
4. **Never record the admin PIN**, and never ask the operator for it. Rotation happens through
   CMS Settings. The seeded hash and salt in `migrations/001_schema.sql` are not secret; the
   plaintext exists only outside this repo, by design.
5. **Verify before declaring done.** Invoke `superpowers:verification-before-completion` before
   any completion claim. This discipline caught two false conclusions in the 2026-07-30 session
   (an empty container read as "safely escaped"; a stale Playwright route read as a regression).
6. **Prefix every wrangler call with `CLOUDFLARE_API_TOKEN=`.** A narrow token is exported in the
   shell and shadows the working OAuth login. Without the prefix you get
   *"Failed to automatically retrieve account IDs"* and will waste time believing you are logged out.
7. **Remote D1 writes are blocked by the permission classifier.** An agent cannot run
   `wrangler d1 execute --remote` with `--file` or any mutation. Produce the exact command and
   have the operator run it with the `!` prefix. Reads (`SELECT`) work fine.

---

## Dispatch order

```
   ┌─ OWNER GATE: enable R2 in dashboard ─┐
   │                                       │
   ▼                                       │
 T3 deploy ──► T4 exposure ──► T5 WAF      │   (strictly serial, all depend on a live site)
                                           │
   ┌───────────────────────────────────────┘
   │
   ├─ T7 integration tests ────┐
   ├─ T12 housekeeping ────────┤  (parallel-safe: disjoint files)
   └─ T9 SEO ──► T10 a11y ─────┘  (SERIAL with each other — both edit public/index.html)
```

**Do not parallelise T9 and T10.** Both rewrite `<head>` and body markup in
`public/index.html`; concurrent agents will clobber each other. T7 writes new test files and
T12 touches repo-root artifacts, so both are safe alongside anything.

T3–T5 cannot start until the owner enables R2. Everything in the lower group can start *now*,
against local dev, without waiting for deploy.

---

## T3 — Deploy

**Do not delegate this.** It is four commands, it is gated on an owner action, and a
subagent adds only the risk of it guessing at a failure. Run it in the main session.

Blocked on exactly one thing: **R2 is not enabled on the account** (API refuses with code
10042, *"Please enable R2 through the Cloudflare Dashboard"*). This is an account-level opt-in
requiring the owner to accept R2 terms with billing configured. No token scope or CLI flag
substitutes.

The `[[r2_buckets]]` binding in `wrangler.toml` is resolved when the Functions bundle is
published, so a missing bucket **fails the entire deploy** — not just gallery routes. The
2026-07-30 attempt failed exactly here (deployment `c71666f8`, status `Failure`).

Once the owner has enabled R2:

```bash
CLOUDFLARE_API_TOKEN= npx wrangler r2 bucket create dr-sumya-gallery
CLOUDFLARE_API_TOKEN= npx wrangler pages deploy
```

**Done when:** `wrangler pages deployment list --project-name dr-sumya-pervin-portfolio` shows
a `Success` row, and `https://dr-sumya-pervin-portfolio.pages.dev/` returns 200 with the real
page body — not a 522, and not an empty shell.

---

## T4 — Post-deploy exposure re-check

**Agent:** `ecc:security-reviewer` — or do it inline; it is a short loop.

**Why it matters:** the repo root was once published as the site root, serving the admin PIN
hash, `SITE_SECRET`, and every internal document as public assets. `wrangler.toml` now sets
`pages_build_output_dir = "public"`, and this check is what proves it holds in production.

**Context the agent needs:** the live URL; the fact that a 200 may be the SPA index fallback
rather than a real file, so **grep the body**, not just the status.

```bash
for u in /migrations/001_schema.sql /wrangler.toml /agent.md /context.md \
         /functions/lib/auth.js /.dev.vars /package.json /HANDOFF-2026-07-31.md; do
  code=$(curl -s -o /tmp/body.$$ -w "%{http_code}" "https://dr-sumya-pervin-portfolio.pages.dev$u")
  echo "$u $code $(grep -cE 'pin_hash|SITE_SECRET|JWT_SECRET|d1_databases' /tmp/body.$$)"
done
```

**Done when:** every path is 404 **or** returns the index fallback, and the secret-marker
count is `0` on every response body. A non-zero count on any line is a live exposure — stop
and escalate to the owner immediately.

---

## T5 — WAF rate limit on login

**Owner action, dashboard-only.** There is deliberately no application-level throttle on
`POST /api/auth/login`, so brute-force protection is entirely the WAF's job. A subagent cannot
do this. Document the requirement, hand it to the owner: a rate-limiting rule on
`POST /api/auth/login`, keyed by IP.

---

## T7 — Integration tests **(highest leverage — do this first of the unblocked group)**

**Agent:** `ecc:e2e-runner`. **Skill:** `e2e-testing` (Playwright patterns, Page Object Model,
CI wiring).

**Why it is the top priority:** the Cloudflare migration shipped three regressions — G06, G09,
G10 — that a smoke test would have caught. G09 survived a full audit only because testing
happened while logged in, so **the suite must exercise the anonymous path explicitly.**

**Spec:** the 24 checks in `AUDIT-ROUND-3.md` §Verification Performed. The ad-hoc Playwright
flows in the 2026-07-30 and 2026-07-31 sessions are a working starting point but are
`run_code_unsafe` snippets, not a suite.

**Context the agent must be given** — it will otherwise rediscover these the expensive way:

- **`.open-booking` matches 7 elements**, and the first in DOM order is the nav CTA, which is
  `display: none` below 820px. `page.click('.open-booking')` therefore fails with "element is
  not visible" at mobile widths — a harness error that reads exactly like a broken CTA. Scope
  it to `.hero-cta a.open-booking`.
- **`requestSubmit()` is not a user click.** It bypasses hit-testing. Useful to isolate harness
  problems from code problems, but never evidence that a control is reachable.
- **`page.route()` persists across navigations.** A stale route abort made a known-good success
  path look broken. Call `page.unrouteAll()` between phases.
- **The booking submit button sits below `.modal-box`'s internal scroll fold**
  (`max-height: 90vh; overflow-y: auto`). An un-scrolled `elementFromPoint` at its centre
  returns the overlay backdrop. `page.click()` scrolls it in first — this is expected, not a bug.
- **`.modal-overlay` is `opacity: 0; pointer-events: none` until `.active`.** While the modal is
  closed the submit button still has a non-empty box, so Playwright rates it *visible* and
  hit-tests straight through onto page content. **A `[data-r]` hit on that button means the
  modal is closed**, not that something is covering it.
- **Local D1 is not production.** It lives in `.wrangler/` (gitignored) and holds a throwaway
  PIN plus probe bookings, one carrying stored XSS payloads. Reset by deleting `.wrangler/`.

**Coverage the suite must include:**

| Flow | Assertion |
|---|---|
| Booking happy path, **anonymous** | 201 + server-generated id rendered in the DOM |
| Booking API failure | UI states the appointment was *not* recorded, keeps fields populated, offers direct-contact fallback |
| XSS render path (G03/G08) | Payloads stored directly in D1, bypassing API validation; CMS shows zero injected elements, payload visible as literal text |
| Contact gating (G09), **anonymous** | CTAs hidden when `whatsapp=''`; correct `wa.me` href once set; never a dead `wa.me/?` |
| Pre-hydration submit guard | Submit before `main.js` attaches causes no navigation — test click, Enter-in-field, and forced `requestSubmit` |
| CMS login | Wrong PIN rejected; no token minted |

**Done when:** the suite runs green from a clean `.wrangler/`, fails loudly if any of G06/G09/G10
is reintroduced, and runs against `npm run dev` rather than a static server.

---

## T9 — SEO and document head

**Agent:** `ecc:seo-specialist`. **Skill:** `seo`.

`public/index.html` has `title` and `description` and nothing else. Missing: Open Graph tags,
canonical URL, JSON-LD, favicon (the only console error on the site).

**Weight the OG tags highest.** WhatsApp is the practice's primary patient channel, and link
previews there fail without them — this is the single most visible defect on the list.

JSON-LD should use `MedicalBusiness` / `Physician` with the two real chamber locations
(Alliance Hospital Shyamoli; DCIMCH Shyamoli) and their stated hours, which are already in
`public/index.html`.

**Constraint:** canonical and OG URLs must point at the final production domain. `[vars]
ALLOWED_ORIGIN` is `https://drsumyapervin.com`, but the site currently deploys to
`dr-sumya-pervin-portfolio.pages.dev` and the custom domain is **not yet connected**. Decide
deliberately and say which you used — do not silently emit a canonical to a domain that does
not resolve.

**Done when:** tags render in the served HTML (check via `npm run dev`, not the source file),
the favicon request stops erroring, and JSON-LD validates.

---

## T10 — Accessibility

**Agent:** `ecc:a11y-architect`. **Skill:** `frontend-a11y` / `accessibility-wcag`. Target WCAG 2.2 AA.

Never audited — Round 2 was visual UX only. The audience is patients, including elderly and
low-vision users, so this is closer to a requirement than a polish item.

**Known specifics to check first:**

- `.svc` cards are `<article tabindex="0" role="button">` — need keyboard activation
  (Enter/Space), not just click handlers.
- `.ba-container` is `<div data-r tabindex="0">` — a focusable before/after slider with no
  stated keyboard interaction model.
- The modal system has no visible focus trap, no `aria-modal`, no `role="dialog"`, and no
  documented focus restore on close.
- `[data-r]` elements start at `opacity: 0` and reveal on scroll. Content that never
  intersects the viewport never reveals — confirm it is still reachable by screen reader and
  that `prefers-reduced-motion` is honoured (it is, at `style.css:1576`).
- Form inputs have `<label for>` — verify error states are announced, not just coloured.

**Done when:** an automated pass (axe) is clean at AA, plus a manual keyboard-only run of the
booking flow end to end, and a documented list of anything deliberately deferred.

---

## T11 — Product backlog

**Agent:** `ecc:planner` to size and sequence; do not implement blind.

Items, roughly by patient impact:

1. **Booking notification.** Today the doctor must remember to open the CMS to discover a new
   appointment. Nothing pushes. This is the highest-value item on the list.
2. **Confirmation page instead of a modal flash.**
3. **Bengali language toggle** — significant for the actual patient base.
4. Analytics; service worker.

---

## T12 — Housekeeping

**Agent:** `ecc:refactor-cleaner`, or inline — it is small.

- `screencapture-drsumyapervin-netlify-app-2026-07-28-07_47_45.png` is **11 MB in the repo root**.
  Prune it. Note it is already in git history, so removing it shrinks the working tree, not the
  clone.
- `AUDIT.md` and `FIXPLAN.md` are fully superseded (pre-migration Express codebase).
  `UX-AUDIT.md` and `UX-FIXPLAN.md` are partly superseded. Mark them so, or archive them —
  a future agent reading `AUDIT.md` as current will plan against a codebase that no longer exists.

---

## T8 — Real content **(owner-blocked, gates launch)**

Not delegable — it needs the doctor. Listed here so no agent burns time trying.

Before/after photos, testimonial faces (with consent), certificate scans (10 slots currently
reuse 3 stock images), gallery items, and the real WhatsApp number.

**Separately, and more seriously: "1500+ procedures" is a medical advertising claim on a
physician's public site**, not a placeholder. Source it or remove it. This is a professional-
conduct exposure, not a content polish item.

---

## Post-deploy, before announcing the site

**Set WhatsApp and Telegram in CMS Settings** (requires the PIN). Both are empty strings in
production right now. That is correct per the G09 gating fix — the CTA hides rather than
emitting a dead `wa.me/?` link — but the booking confirmation panel tells the patient
*"please forward your details via WhatsApp or Telegram below"*, and with both empty that
instruction points at nothing. The booking still records server-side, so no data is lost, but
the primary confirmation path dead-ends for every patient until this is set.
