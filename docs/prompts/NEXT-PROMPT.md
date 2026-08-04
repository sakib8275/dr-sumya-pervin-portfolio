# PROMPT — F8 sign-off (digest first run), ship the pending UX batch, then F10 (Playwright DOM layer)

Paste this into a fresh agent session. Everything it needs is in the repo; the
pointers say what to read first and what "done" means.

---

You are picking up the Dr. Sumya Pervin portfolio at
`/home/kitahara-poposagain/Desktop/Portfolio Sumya Pervin` (branch `master`,
Cloudflare Pages + D1 + R2, plus one standalone cron Worker). The site is **live
and serving patients** — treat every change as production.

**Read first, in this order:** `STATUS.md` →
`docs/handoffs/HANDOFF-2026-08-04-v2.md` → `docs/handoffs/HANDOFF-2026-08-04.md`
→ `docs/audits/UX-AUDIT-2026-08-04.md` → `docs/handoffs/HANDOFF-2026-08-03-v4.md`
(F9 / CSP) → `agent.md` (architecture, security rules, deploy/verify checklist) →
`FIXPLAN-2026-08-02.md` §Phase 2 row F10.

If anything in this prompt disagrees with `STATUS.md`, **`STATUS.md` wins** — say
so in your report rather than quietly following the prompt.

**Arrival check, before anything else:** the working tree already carries the
2026-08-04 UX batch, committed and pushed at `30d042e`. `npm test` must be
**191/191**. If it is not, stop and report — something drifted.

---

## Task A (small, do first) — sign off F8 at its real first run

As of the last session the digest worker `dr-sumya-digest` had **never fired a
scheduled run**: it deployed at 15:10 UTC on 2026-08-03, after both of that day's
cron times. First real run: **2026-08-04 08:30 UTC / 14:30 Dhaka** (plus a second
at 10:30 UTC).

**Read the Workers Logs for those runs and classify them.** Run `date -u` first
so you know whether the run is in the past yet; if it is not, say so and move to
Task B rather than guessing.

Use the Cloudflare observability MCP (`query_worker_observability`, load it with
`ToolSearch` first) against script `dr-sumya-digest`, window 08:00 UTC → now.
Logs are on (`[observability] enabled = true, head_sampling_rate = 1`, live on
deployed version `0f6d80cd`), so the run should have left a trace.

Four possible outcomes — name which, and do not blur them:

| Outcome | Meaning |
|---|---|
| **No invocation at all** | the cron did not fire. A real problem. Check the triggers on the deployed version. |
| Fired, sent successfully | F8 is proven end to end. |
| **Fired, exited without sending** | **MOST LIKELY, and NOT a failure.** |
| Fired, `send-failed` logged | the send path broke. Report the exact error. |

⚠️ **Why the third row is the expected one:** production D1 holds **0
appointments**, and `runDigest` returns without sending when there is nothing to
report. **An empty inbox is the predicted outcome of a perfectly healthy run.**
Also: the recipient mailbox `dr.enamtalha@gmail.com` is the owner's and is **not
readable by you**, so inbox confirmation always needs a human.

**If the logs come back empty, say exactly that.** Empty logs are a real result
(worth investigating, since observability is on); they are not licence to infer.

Update `STATUS.md`'s "Digest first run" row with what you found either way.

---

## Task B (before F10) — ship the pending, already-verified UX batch

Commit `30d042e` fixed, locally and on `master`, a verified **but UNDEPLOYED**
UX batch. Production still serves `74c3bd4b` without it. Your job is the
**operator-confirmed deploy + live proof**. This is patient-facing; follow the
deploy/verify checklist in `agent.md` exactly.

1. `wrangler pages deploy public --project-name=dr-sumya-pervin-portfolio`.
   Record the new deployment id, and confirm the two rollback targets still hold
   (`f64b9221` pre-F9, `5423d45e` pre-Phase-1).
2. Verify **on the live apex `https://drsumyapervin.com/`** (the `.pages.dev`
   preview text or screenshots that lie), not on preview:
   - A **real booking click-through with a live Turnstile token** (the widget
     must still mint tokens under the CSP block) → success modal shows **only**
     the confirmation card (no form, no modal header), WhatsApp + reference
     intact; reopen gives a fresh form.
   - **Quiz → booking**: each of the four quiz outcomes lands on a populated
     `#serviceType` select (this was the critical path fix — every quiz submit
     used to 400 with an empty `service`).
   - One **mobile-width** pass (≥375px): step dots, faq-send, modal-close,
     tst-nav are all ≥24/44px targets; no horizontal overflow.
   - No-JS render (devtools disable JS or a curl/`?noscript`): content visible.
   - Post-deploy `npm test` must still be **191/191**.
3. Only after the live checks pass, update `STATUS.md`: git row → the
   post-deploy commit (see the hash-stability note in the git row itself),
   the audit row's "UNDEPLOYED" note, and the serving-deploy id.

If any live check fails, **roll back** — to `f64b9221` if the failure smells
like a header/CSP regression (all bookings 403), to `5423d45e` if it predates
Phase-1 — and report before retrying.

---

## Task C — F10, the Playwright DOM layer

`FIXPLAN-2026-08-02.md` row F10. Add Playwright as a devDependency and build
`tests/e2e/` with **five specs green against `npm run dev`**:

1. a **real pointer-click** booking submit (not a synthetic dispatch);
2. XSS payloads rendering **inert** in the CMS;
3. the booking-**failure** UI state;
4. **WhatsApp CTA gating** — hidden when the config value is empty, shown with a
   correct `wa.me/<digits>` link when set;
5. the **pre-hydration submit guard** (`public/js/formguard.js`).

**Absorb the 2026-08-04 UX batch into the specs** — `docs/audits/UX-AUDIT-2026-08-04.md`
§Artifacts lists the exact assertions you should encode into scope so they never
silently regress (in particular: booking-success hides `#bookingForm` +
`.modal-header` and shows only `#bookingStatus`; all four quiz outcomes land on
a valid `selectedIndex`; the reveal gate — `html.reveal [data-r]:not(.in)` — is
hit; no sub-40px ambiguous on critical tap targets).

Seed local D1 per `docs/SUBAGENT-PLAYBOOK.md`; Turnstile handling is documented
in `docs/handoffs/HANDOFF-2026-07-31-v3.md` (headless Chrome gets **no token** —
page-side stub `window.turnstile.getResponse` for DOM tests; the real-token path
is already proven and is also covered by Task B's live click-through).

**Why F10 is worth more than its row suggests.** F9 shipped a CSP with no
`'unsafe-inline'` in `script-src`. Under that CSP an `on*=` attribute is dropped
**silently** — no console error, no failing test, the button simply does nothing.
Spec 5 and spec 1 are that safety net. Prioritise them.

Two things F10 must not pretend to cover:

- `tests/headers.test.mjs` already fails if an `on*=` attribute reappears in
  `public/`. Do not duplicate it; complement it by proving the *behaviour*.
- **`wrangler pages dev` starts with an unmigrated local D1.** `/api/gallery` and
  `/api/config/public` return 500 until you run the migration with `--local`.
  That looks like a broken API and is not one — handle it in setup, don't "fix"
  it.

---

## Standing rules for this repo (unchanged, all still binding)

- Remote D1 **writes** and `pages secret put` are **operator-run**. Be
  SELECT-only unless the operator says otherwise in the moment. (Task B's
  deploy is the deliberate, operator-confirmed exception — that is a Pages
  deploy, not a D1 write.)
- **Never log into the production CMS.** Its PIN and its D1/R2 writes are
  operator-only.
- Never print or record the admin PIN; check secrets by presence only.
  ⚠️ **The PIN is pending rotation** — it surfaced in a transcript via autofill.
  If you drive a browser near that field, watch for autofill and at minimum apply
  the standing `autocomplete="new-password"` idea.
- `JWT_SECRET`, `SITE_SECRET` and `TURNSTILE_SECRET` must **never** appear in
  `wrangler.toml` `[vars]`.
- Nothing outside `public/` may ever be published — `tests/exposure.test.mjs`
  enforces this; extend it if you add files.
- The digest Worker deploys from `workers/digest/`, **never** the repo root; the
  root `wrangler.toml` is the Pages project and the two must not be merged.

## Traps that have already cost this repo time

- **The apex HTML is not the HTML you deployed.** The zone injects scripts into
  it (JavaScript Detections, the Analytics beacon) that never appear on
  `pages.dev`. A change can pass every local/preview test and still break
  production. Verify on `https://drsumyapervin.com/` itself.
- **A wrong CSP and a wrong Turnstile hostname produce the identical symptom** —
  every booking 403s, nothing in the console. If it starts right after a deploy,
  roll back to **`f64b9221`** if that deploy touched headers.
- **Rollback target is `5423d45e`** but confirm it against
  `npx wrangler pages deployment list --project-name=dr-sumya-pervin-portfolio`
  before quoting it. Two wrong ids have already circulated here.
- **Cloudflare cron day-of-week must be spelled** (`SUN-THU,SAT`). Numeric form
  is rejected with `10100: invalid cron string`.
- **A setting is not a used setting.** The CMS's Telegram field drives nothing —
  `main.js:726` builds a generic `t.me/share/url` sheet. **Deferred by the owner —
  not a bug, do not "fix" it.**
- **`box-sizing: border-box` (global)** kills padding/tap-target math: the step
  dots use a transparent border + `background-clip`, with `width` set to the
  **outer** 24px. A naive `width:8px`+border collapses the dot. Be careful
  editing `public/css/style.css`.
- Playwright's saved console logs are binary; plain `grep` skips them. Use
  `grep -a`
- The STATUS "git" row is designed to be hash-stable (it references `git log
  --oneline -1`). Keep it that way — do not paste a bare hash that your own
  commit will stale-return.

## Also open

1. **An application-level login throttle** in `functions/api/auth/login.js` —
   the zone rule is a challenge, not a rate limit. Not in the FIXPLAN — **propose
   before building.**
2. `autocomplete="new-password"` on `#cmsPinInput` (standing; part of the batch's
   R-10).
3. Owner decisions deferred from the UX audit — R-5 (stock testimonials /
   before-after; same class as the removed unsourced stat) and R-7 (gallery's
   empty state to patients; production has 0 photos). Ask the operator, don't
   decide for them.

## Done means

1. Task A: first-run outcome named from evidence with log lines quoted,
   `STATUS.md` updated. Undeterminable → say which outcomes remain and what would
   settle it.
2. Task B: new deploy id recorded, rollback ids confirmed, live apex verified
   (click-through + quiz + mobile + no-JS), post-deploy `npm test` 191/191.
   Not verified after your last note — be explicit what you yourself confirmed.
3. Task C: the five specs green (now covering the UX-batch assertions per the
   audit doc), listed explicitly, plus what they do **not** cover.
4. `npm test` green (191 + what you added).
5. `STATUS.md` updated, the FIXPLAN row marked, and a new
   `docs/handoffs/HANDOFF-<date>.md` per house convention, with `docs/README.md`
   re-pointed at it and at any new audit.
6. Commit locally; **confirm with the operator before pushing** (Task B's deploy
   already happened under their confirmation).