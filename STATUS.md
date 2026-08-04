# STATUS.md — Current state (living document)

**The only state document that is kept current.** Update it whenever deployment,
verification, or owner-action state changes. Everything under `docs/` is a dated
snapshot; if this file and a snapshot disagree, this file wins.

**Updated:** 2026-08-04 (evening, Dhaka) — a **doc-validity audit re-probed every
claim in this file against live state** (all accurate; two stale cells fixed:
the git hash and the 404-page size), then a **UI/UX + navigation audit**
(`docs/audits/UX-AUDIT-2026-08-04.md`) shipped **8 local fixes**: the booking
modal now shows only the confirmation after a successful booking (operator
request), a **critical quiz bug** (every quiz-driven booking was server-rejected
— the quiz recommended names that were never `#serviceType` options), a11y
announcements, lazy images (2.19 MB → ~0.7 MB warm), tap targets, a no-JS blank
page, and two copy bugs. **All local, all verified locally, NOT yet deployed —
production still serves `74c3bd4b`.** Earlier the same day: L6 closed and Workers
Logs enabled on the digest.

---

## The one-line state

**The site is LIVE on `drsumyapervin.com`** (deployment `74c3bd4b`, 191/191 tests
green; L1–L2, L4–L5 done, L7 not what it claimed — see below), **F9 security
headers are live** (CSP with no `'unsafe-inline'` in `script-src`, HSTS, zero
inline handlers left in `public/`), and **the F8 digest worker is DEPLOYED,
crons registered, recipient verified, Workers Logs on** — nothing blocks it; its
first live run is **2026-08-04 08:30 UTC (14:30 Dhaka)** and has not happened
yet, so it is wired but unproven end-to-end in production. The smoke row is gone (L8 done) —
production D1 is clean. **L6 is now done too** — the owner's `+8801725196101` is
live in production D1, so booking confirmations reach WhatsApp. The remaining
owner action is the PIN rotation; **Telegram wiring is deferred by the owner.**
**The working tree carries a verified-but-undeployed UX batch** (booking-success
view, the quiz-booking fix, a11y/perf/tap-target fixes — see the UX audit row);
deploy it deliberately, it changes the patient-facing site.

## Verified right now

| Fact | State | Verified |
|---|---|---|
| Serving deployment | `74c3bd4b` on apex + pages.dev (F9) | `pages deploy`, 2026-08-03 |
| Rollback target | **`5423d45e`** (last pre-Phase-1 known-good) — full id `5423d45e-78fd-48ea-abe8-1ce5d5bd0917`, re-confirmed against `pages deployment list` | 2026-08-03 |
| Previous good deploy | `f64b9221` (pre-F9), if F9 alone needs backing out | same |
| Apex / www / HTTPS | apex 200; www → 301 apex; http → 301 https | curl, 2026-08-03 |
| Tests | **191/191 green** (`npm test`; Miniflare + real compiled worker, plus 16 digest units and 18 F9 header, inline-handler and exposure units). Re-run and green three times during the 2026-08-04 UX session, including after every change | 2026-08-04 |
| **F9 security headers** | **LIVE on apex.** CSP (`script-src 'self' 'nonce-…' challenges.cloudflare.com static.cloudflareinsights.com`, no `'unsafe-inline'`; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`/`form-action 'self'`), `Permissions-Policy`, `HSTS max-age=31536000; includeSubDomains` (no preload), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` | `curl -I` + browser console, 2026-08-03 |
| Inline event handlers | **zero in `public/`** — 12 removed (8 `onclick` + 1 `onsubmit` in index.html, 3 generated `onclick` in main.js). `tests/headers.test.mjs` fails if one returns | `npm test` + DOM probe, 2026-08-03 |
| CSP violations in browser | **0** across a full local click-through and a full production pass | Playwright console capture, 2026-08-03 |
| F8 digest worker | **DEPLOYED** — `dr-sumya-digest`, live version **`0f6d80cd`** (2026-08-03 22:16 UTC; supersedes `e89ceefb`), crons `30 8 * * SUN-WED,SAT` + `30 10 * * SUN-THU,SAT` registered; no public URL (`workers_dev = false`, probe 404) | `wrangler deployments list`, 2026-08-03 22:2x UTC |
| Digest observability | **ON** — `[observability] enabled = true, head_sampling_rate = 1` in `workers/digest/wrangler.toml`, confirmed on the deployed script (`logs.enabled true`, `persist true`, `invocation_logs true`). Enabled *before* the first scheduled run for one reason: this Worker's only trigger is cron and its only output is an email nobody in this repo can read, so **"no mail arrived" and "nothing to report" are the same observation** without logs | Cloudflare API, 2026-08-03 22:16 UTC |
| Digest first run | **NOT YET OBSERVED.** No cron has fired since the 15:10 UTC deploy. First real run **2026-08-04 08:30 UTC / 14:30 Dhaka**. ⚠️ Production D1 has 0 appointments, so **a quiet run that sends nothing is the expected outcome** — do not read a missing email as a failure until the logs are read | reasoning + D1 count, 2026-08-03 |
| Digest end-to-end | **proven up to the send**: forced scheduled run on remote bindings routed Alliance → Dhaka date 2026-08-03 → production D1 query OK → both send paths rejected only with "destination address is not a verified address" | `wrangler dev --remote --test-scheduled`, 2026-08-03 |
| Email Routing (zone) | **enabled, status `ready`** — MX ×3 + SPF + DKIM (`cf2024-1._domainkey`) created automatically | Cloudflare API, 2026-08-03 |
| Digest recipient | `dr.enamtalha@gmail.com` — **`verified` 2026-08-03 16:13 UTC** (owner opened the link). The send path is now unblocked; **no cron has fired since the 15:10 UTC deploy**, so the first live digest is 2026-08-04 08:30 UTC / 14:30 Dhaka | Cloudflare API, 2026-08-03 22:07 UTC |
| Inbound `digest@` rule | **not created** — the zone has only a disabled catch-all `drop`. Nothing depends on it (the worker sends, it does not receive); create it when convenient now that the destination verifies | Cloudflare API, 2026-08-03 22:07 UTC |
| L7 login rule | **corrected**: it is a `managed_challenge` on every `POST /api/auth/login` — **not** a rate limit. The zone's one rate-limiting rule is `Leaked credential check` (block, 5/10s). Free plan allows one such rule; kept as-is | zone rulesets, 2026-08-03 |
| Booking guard live | tokenless POST on apex → 403; real widget booking succeeded | curl + D1, 2026-08-03 |
| Repo-root exposure | closed — internals all 404 @ 2,589 B (the 404 page grew when F9's markup changed; still 404, still nothing internal served) | curl, 2026-08-04 |
| SEO/OG | canonical, OG/Twitter, JSON-LD, robots.txt, sitemap.xml, favicon.svg live | curl, 2026-08-02 |
| Production D1 | **0 appointments** — smoke row `book-09fce136` deleted 2026-08-03 (L8 done, `changes: 1`, count re-checked); gallery=0 | D1 DELETE + SELECT, 2026-08-03 |
| WhatsApp/Telegram | **SET — L6 done.** `whatsapp = 8801725196101`, `telegram = +8801725196101` (owner-supplied `+8801725196101`, stored WhatsApp-style without `+` because `main.js` strips non-digits and the CMS field asks for it that way). Written straight to production D1, not through the CMS — the row now reads back on `/api/config/public` | D1 UPDATE (`changes: 1`) + curl, 2026-08-03 22:1x UTC |
| Telegram button caveat | **the stored `telegram` value drives nothing.** `main.js:726` builds `https://t.me/share/url?...`, a generic share sheet that opens the *patient's* Telegram to pick any recipient — it never routes to the doctor. The value is only echoed back into the CMS Settings input (`main.js:1144`). WhatsApp is wired properly (`wa.me/<digits>`, FAB at `main.js:163` + booking button at `:725`) | code read, 2026-08-03 |
| Launch steps L1–L8 | L1 ✅ L2 ✅ L4 ✅ L5 ✅ **L6 ✅** L8 ✅ L7 ⚠️ (see row above) · L3 contingency unused | FIXPLAN marks + probes |
| git | **in sync and clean** — `origin/master` and local `master` both at `54b9f69` (`git ls-remote` confirmed after push), working tree clean. Note the deployed code is live regardless of git: `wrangler pages deploy` uploads the working tree, not a git ref. `30d042e` carried the verified UX batch (still **undeployed** on Pages) | `git ls-remote`, 2026-08-04 |
| Browser clicks | **Whole CMS exercised locally** on the F9 build against local D1/R2 — login, Update Status, **Upload Photo** (R2 + D1 + image served back), Settings save, Gallery delete, Logout. **On production, only the public surface was exercised**; the production CMS was NOT logged into (its PIN and its D1/R2 writes are operator-only) | Playwright, 2026-08-03 |
| Zone-injected scripts | The apex HTML gets **two scripts this repo does not contain**: Cloudflare JavaScript Detections (inline, per-request ray id — a CSP hash can never match it) and the Web Analytics beacon. Both were blocked by F9's first deploy; fixed with a per-request CSP nonce + `static.cloudflareinsights.com`. **Neither appears on `pages.dev`**, so preview testing cannot catch this class of break. (2026-08-04 re-probe: only the JSD inline script appeared in curl fetches — the beacon is request-dependent; CSP allows it either way) | curl + browser, 2026-08-03 |
| **Doc-validity audit** | **Every row of this table re-probed against live state** — apex/www/http redirects, all six security headers, serving deploy + both rollback ids, zero inline handlers, 403 on tokenless booking, digest version/crons/observability/bindings, workers.dev 404, Email Routing (`ready`; recipient verified to the minute; only the disabled catch-all rule), D1 counts (0 appointments, 0 gallery), `/api/config/public`, L7 challenge behavior (`cf-mitigated: challenge`), exposure sweep. **All accurate** except two stale cells, fixed: git hash (`3a2e864`→`4460d34`) and 404 size (1,512→2,589 B). Not re-verifiable read-only: zone rulesets API (wrangler OAuth scope) — L7 was confirmed *behaviorally* instead | curl + wrangler + CF API, 2026-08-04 |
| **UX audit + fixes** | **Local, verified, UNDEPLOYED.** 8 fixes in the working tree: booking modal shows only the confirmation on success (form + header hidden, restored on reopen; failure path unchanged); **quiz-driven bookings were all server-rejected** — rec names weren't select options; now mapped, plus new `Hair Loss & Scalp Treatments` option; `role=status`/`aria-live` on result regions, `role=dialog` on modals; 17 below-fold images lazy (2.19 MB → ~0.7 MB warm); step dots/faq-send/modal-close/tst-nav tap targets ≥24–44px; no-JS blank page fixed (`html.reveal` gate); Process-heading duplicate and toggle-label copy fixed. Full findings + 11 open recommendations: `docs/audits/UX-AUDIT-2026-08-04.md`. Handoff: `docs/handoffs/HANDOFF-2026-08-04-v2.md` | local click-throughs (puppeteer + system Chrome), 2026-08-04 |

## Active documents

- **`HUMAN-TASKS.md`** — step-by-step guide for everything that needs a person (browser clicks, dashboard launch, owner content, Phase 2 prereqs). **Start here.**
- **`FIXPLAN-2026-08-02.md`** — the execution plan. Phase 1 ✅, Phase 0 (dashboard launch) and Phase 2 (hardening) pending.
- `agent.md` — architecture, security rules, deploy/verify checklist.
- `context.md` — domain and medical-content facts; source of truth for credentials and schedules.
- `docs/` — dated archive; see `docs/README.md` for the map. **Latest session log: `docs/handoffs/HANDOFF-2026-08-04-v2.md`** (doc-validity audit, UX audit + 8 verified local fixes awaiting deploy) — read `-2026-08-04.md` before it for L6 and the digest, `-v4` for F9 and `-v3` for F8.
- **`docs/prompts/F8-SIGNOFF-F10-PROMPT.md` — the current kickoff prompt. Paste it into the next session.** Its Task A (read the digest's first-run logs) is still open as of this update; its Task B (F10) should now also absorb the UX audit's local fixes and the assertions listed in `docs/audits/UX-AUDIT-2026-08-04.md` §Artifacts — and the session must deploy the pending UX batch first or rebase onto it.
- `docs/prompts/F9-HEADERS-PROMPT.md` — the kickoff prompt for F9. **Done**; kept for the record.

## Standing owner actions

0. ⚠️ **Rotate the admin PIN.** During F9's browser pass the machine's saved-password
   autofill re-populated the CMS PIN field on `localhost`, so the production PIN
   appeared in an agent session transcript. Nothing was written down and no
   production login was attempted, but transcripts persist — change it in
   CMS Settings (needs the current PIN, min 8 chars). Unrelated: the field also
   invites autofill because it has no `autocomplete="new-password"`.
1. ~~CMS Settings → real WhatsApp number + Telegram @username~~ **DONE
   2026-08-03** — `+8801725196101` supplied by the owner and written to
   production D1. Booking confirmations and the floating button now reach
   WhatsApp. **Telegram is DEFERRED by the owner (2026-08-03)** — the button
   stays a generic share sheet and the stored value stays unused. Do not treat
   it as a bug; revisit only when the owner supplies a real @username, which
   also needs a code change at `main.js:726`.
2. ~~Open Cloudflare's verification email in `dr.enamtalha@gmail.com`~~ **DONE
   2026-08-03 16:13 UTC.** The digest is fully wired; the first live run is
   2026-08-04 08:30 UTC (14:30 Dhaka). **Next agent's first job: read the Workers
   Logs for that run** (see the F8 sign-off prompt) — with 0 appointments in
   production D1 the expected result is a run that reports nothing and sends no
   mail, which is success, not failure. Also still open: create the `digest@`
   inbound rule (now that `2054` no longer applies); nothing depends on it.
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
