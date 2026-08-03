# STATUS.md — Current state (living document)

**The only state document that is kept current.** Update it whenever deployment,
verification, or owner-action state changes. Everything under `docs/` is a dated
snapshot; if this file and a snapshot disagree, this file wins.

**Updated:** 2026-08-03, after **F9 (security headers) shipped**. Earlier that day:
the F8 digest deploy, the Cloudflare email setup and the L8 smoke-row deletion.
Everything below was probed live that day.

---

## The one-line state

**The site is LIVE on `drsumyapervin.com`** (deployment `74c3bd4b`, 191/191 tests
green; L1–L2, L4–L5 done, L7 not what it claimed — see below), **F9 security
headers are live** (CSP with no `'unsafe-inline'` in `script-src`, HSTS, zero
inline handlers left in `public/`), and **the F8 digest worker is DEPLOYED with
both crons registered** — it is one click from working: someone with access to
**`dr.enamtalha@gmail.com`** must open Cloudflare's verification email.
Remaining otherwise: owner enters WhatsApp/Telegram (L6). The smoke row is gone
(L8 done) — production D1 is clean.

## Verified right now

| Fact | State | Verified |
|---|---|---|
| Serving deployment | `74c3bd4b` on apex + pages.dev (F9) | `pages deploy`, 2026-08-03 |
| Rollback target | **`5423d45e`** (last pre-Phase-1 known-good) — full id `5423d45e-78fd-48ea-abe8-1ce5d5bd0917`, re-confirmed against `pages deployment list` | 2026-08-03 |
| Previous good deploy | `f64b9221` (pre-F9), if F9 alone needs backing out | same |
| Apex / www / HTTPS | apex 200; www → 301 apex; http → 301 https | curl, 2026-08-03 |
| Tests | **191/191 green** (`npm test`; Miniflare + real compiled worker, plus 16 digest units and 18 F9 header, inline-handler and exposure units) | 2026-08-03 |
| **F9 security headers** | **LIVE on apex.** CSP (`script-src 'self' 'nonce-…' challenges.cloudflare.com static.cloudflareinsights.com`, no `'unsafe-inline'`; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`/`form-action 'self'`), `Permissions-Policy`, `HSTS max-age=31536000; includeSubDomains` (no preload), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` | `curl -I` + browser console, 2026-08-03 |
| Inline event handlers | **zero in `public/`** — 12 removed (8 `onclick` + 1 `onsubmit` in index.html, 3 generated `onclick` in main.js). `tests/headers.test.mjs` fails if one returns | `npm test` + DOM probe, 2026-08-03 |
| CSP violations in browser | **0** across a full local click-through and a full production pass | Playwright console capture, 2026-08-03 |
| F8 digest worker | **DEPLOYED** — `dr-sumya-digest`, version `e89ceefb`, crons `30 8 * * SUN-WED,SAT` + `30 10 * * SUN-THU,SAT` registered; no public URL (`workers_dev = false`, probe 404) | `wrangler deploy` + curl, 2026-08-03 |
| Digest end-to-end | **proven up to the send**: forced scheduled run on remote bindings routed Alliance → Dhaka date 2026-08-03 → production D1 query OK → both send paths rejected only with "destination address is not a verified address" | `wrangler dev --remote --test-scheduled`, 2026-08-03 |
| Email Routing (zone) | **enabled, status `ready`** — MX ×3 + SPF + DKIM (`cf2024-1._domainkey`) created automatically | Cloudflare API, 2026-08-03 |
| Digest recipient | `dr.enamtalha@gmail.com` added as destination, **still `unverified`** — Cloudflare's confirmation email must be opened. **This is the only thing between the digest and working.** | Cloudflare API, 2026-08-03 |
| L7 login rule | **corrected**: it is a `managed_challenge` on every `POST /api/auth/login` — **not** a rate limit. The zone's one rate-limiting rule is `Leaked credential check` (block, 5/10s). Free plan allows one such rule; kept as-is | zone rulesets, 2026-08-03 |
| Booking guard live | tokenless POST on apex → 403; real widget booking succeeded | curl + D1, 2026-08-03 |
| Repo-root exposure | closed — internals all 404 @ 1,512 B | curl, 2026-08-02 |
| SEO/OG | canonical, OG/Twitter, JSON-LD, robots.txt, sitemap.xml, favicon.svg live | curl, 2026-08-02 |
| Production D1 | **0 appointments** — smoke row `book-09fce136` deleted 2026-08-03 (L8 done, `changes: 1`, count re-checked); gallery=0 | D1 DELETE + SELECT, 2026-08-03 |
| WhatsApp/Telegram | **still EMPTY** — L6 open | `/api/config/public`, 2026-08-03 |
| Launch steps L1–L8 | L1 ✅ L2 ✅ L4 ✅ L5 ✅ L8 ✅ L7 ⚠️ (see row above) · **L6 ⬜** · L3 contingency unused | FIXPLAN marks + probes |
| git | `master` is **1 ahead of `origin/master`** — the F9 commit `69b02ff` on top of `d71f4f0`. **Unpushed on purpose; the operator has not been asked yet.** Note the deployed code is already live regardless: `wrangler pages deploy` uploads the working tree, not a git ref | `git rev-list`, 2026-08-03 |
| Browser clicks | **Whole CMS exercised locally** on the F9 build against local D1/R2 — login, Update Status, **Upload Photo** (R2 + D1 + image served back), Settings save, Gallery delete, Logout. **On production, only the public surface was exercised**; the production CMS was NOT logged into (its PIN and its D1/R2 writes are operator-only) | Playwright, 2026-08-03 |
| Zone-injected scripts | The apex HTML gets **two scripts this repo does not contain**: Cloudflare JavaScript Detections (inline, per-request ray id — a CSP hash can never match it) and the Web Analytics beacon. Both were blocked by F9's first deploy; fixed with a per-request CSP nonce + `static.cloudflareinsights.com`. **Neither appears on `pages.dev`**, so preview testing cannot catch this class of break | curl + browser, 2026-08-03 |

## Active documents

- **`HUMAN-TASKS.md`** — step-by-step guide for everything that needs a person (browser clicks, dashboard launch, owner content, Phase 2 prereqs). **Start here.**
- **`FIXPLAN-2026-08-02.md`** — the execution plan. Phase 1 ✅, Phase 0 (dashboard launch) and Phase 2 (hardening) pending.
- `agent.md` — architecture, security rules, deploy/verify checklist.
- `context.md` — domain and medical-content facts; source of truth for credentials and schedules.
- `docs/` — dated archive; see `docs/README.md` for the map. **Latest session log: `docs/handoffs/HANDOFF-2026-08-03-v4.md`** (F9 security headers) — it supersedes `-v3`, which remains correct for F8 and the Cloudflare email setup.
- `docs/prompts/F9-HEADERS-PROMPT.md` — the kickoff prompt for F9. **Done**; kept for the record.

## Standing owner actions

0. ⚠️ **Rotate the admin PIN.** During F9's browser pass the machine's saved-password
   autofill re-populated the CMS PIN field on `localhost`, so the production PIN
   appeared in an agent session transcript. Nothing was written down and no
   production login was attempted, but transcripts persist — change it in
   CMS Settings (needs the current PIN, min 8 chars). Unrelated: the field also
   invites autofill because it has no `autocomplete="new-password"`.
1. **CMS Settings → real WhatsApp number + Telegram @username** — every booking
   confirmation points nowhere until then.
2. **Open Cloudflare's verification email in `dr.enamtalha@gmail.com`** and click
   the link — the digest worker is deployed and wired; this is all that is left.
   Then tell an agent, so the `digest@` inbound rule can be created too (it was
   rejected with `2054: Destination address is not verified`).
3. **Confirm chamber schedules** (Alliance Sat–Thu 5–8 PM; DCIMCH Sat–Wed 3–5 PM)
   — F4's enforcement and F8's digest both depend on these.
4. **Leaked token**: delete id `b17d8b1322d3a80ddeebb36d76ae8ba5` — match by the
   **id in the token page URL**, not the name. Turnstile-only scope; low priority.
5. R2 dashboard glance: any `dr-sumya-gallery` object without a D1 row is an orphan.

## If a booking ever 403s in production

Roll back to **`5423d45e`** first, debug after. A Turnstile hostname
misconfiguration rejects every patient silently and looks identical to the
system working. Since F9 there is a second way to produce the same silent
failure: a CSP that blocks `challenges.cloudflare.com` in `script-src` or
`frame-src` stops the widget minting a token, and every booking 403s with no
console error a patient would ever see. **If the symptom appeared right after a
header change, roll back to `f64b9221` (the last pre-F9 deploy) rather than all
the way to `5423d45e`.**

## Before you add markup or build HTML in JS

`script-src` has no `'unsafe-inline'`. An `onclick=` (or any `on*=`) attribute is
dropped silently — no console error, no failed request, no failing test, the
button just does nothing. Use a listener or a `data-` attribute.
`tests/headers.test.mjs` scans `public/` and fails if one reappears.

```bash
npx wrangler pages deployment list --project-name=dr-sumya-pervin-portfolio
```

Then redeploy `5423d45e` from the Pages dashboard.
