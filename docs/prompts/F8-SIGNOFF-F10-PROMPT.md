# PROMPT — F8 sign-off (read the digest's first run), then F10 (Playwright DOM layer)

Paste this into a fresh agent session. Everything it needs is in the repo; the
pointers say what to read first and what "done" means.

---

You are picking up the Dr. Sumya Pervin portfolio at
`/home/kitahara-poposagain/Desktop/Portfolio Sumya Pervin` (branch `master`,
Cloudflare Pages + D1 + R2, plus one standalone cron Worker). The site is **live
and serving patients** — treat every change as production.

**Read first, in this order:** `STATUS.md` →
`docs/handoffs/HANDOFF-2026-08-04.md` → `docs/handoffs/HANDOFF-2026-08-03-v4.md`
(F9 / CSP) → `agent.md` (architecture, security rules, deploy/verify checklist) →
`FIXPLAN-2026-08-02.md` §Phase 2 row F10.

If anything in this prompt disagrees with `STATUS.md`, **`STATUS.md` wins** — say
so in your report rather than quietly following the prompt.

**Arrival check, before anything else:** `npm test` must be **191/191**. If it is
not, stop and report — something drifted since 2026-08-03.

---

## Task A (do this first, it is small) — sign off F8

The digest worker `dr-sumya-digest` was fully unblocked on 2026-08-03 but **its
first scheduled run had not happened yet**: it deployed at 15:10 UTC, after both
of that day's cron times. First real run: **2026-08-04 08:30 UTC / 14:30 Dhaka.**

**Read the Workers Logs for that run and classify it.** Run `date -u` first so
you know whether the run is even in the past yet; if it is not, say so and move
to Task B rather than guessing.

Use the Cloudflare observability MCP (`query_worker_observability`, load it with
`ToolSearch` first) against script `dr-sumya-digest`, window 08:00 UTC → now.
Logs are on (`[observability] enabled = true, head_sampling_rate = 1`, live on
deployed version `0f6d80cd`), so the run should have left a trace.

Four possible outcomes — name which one, and do not blur them:

| Outcome | Meaning |
|---|---|
| **No invocation at all** | the cron did not fire. A real problem. Check the triggers on the deployed version. |
| Fired, sent successfully | F8 is proven end to end. |
| **Fired, exited without sending** | **MOST LIKELY, and NOT a failure.** |
| Fired, `send-failed` logged | the send path broke after verification. Report the exact error. |

⚠️ **Why the third row is the expected one:** production D1 holds **0
appointments**, and `runDigest` returns without sending when there is nothing to
report. **An empty inbox is the predicted outcome of a perfectly healthy run.**
Do not report "the digest failed" on the strength of no email — and note that the
recipient mailbox `dr.enamtalha@gmail.com` is the owner's and is **not readable
by you**, so inbox confirmation always needs a human.

**If the logs come back empty, say exactly that.** Empty logs are a real result
(and would themselves be worth investigating, since observability is on); they
are not licence to infer what probably happened.

Then, optionally: create the inbound `digest@drsumyapervin.com` Email Routing
rule. It was previously rejected with `2054` while the destination was
unverified; that no longer applies. **Nothing depends on it** — the worker sends
mail, it does not receive any.

Update `STATUS.md`'s "Digest first run" row with what you found either way.

---

## Task B — F10, the Playwright DOM layer

`FIXPLAN-2026-08-02.md` row F10. Add Playwright as a devDependency and build
`tests/e2e/` with **five specs green against `npm run dev`**:

1. a **real pointer-click** booking submit (not a synthetic dispatch);
2. XSS payloads rendering **inert** in the CMS;
3. the booking-**failure** UI state;
4. **WhatsApp CTA gating** — hidden when the config value is empty, shown with a
   correct `wa.me/<digits>` link when set;
5. the **pre-hydration submit guard** (`public/js/formguard.js`).

Seed local D1 per `docs/SUBAGENT-PLAYBOOK.md`; Turnstile handling is documented
in `docs/handoffs/HANDOFF-2026-07-31-v3.md`.

**Why F10 is worth more than its row suggests.** F9 shipped a CSP with no
`'unsafe-inline'` in `script-src`. Under that CSP an `on*=` attribute is dropped
**silently** — no console error, no failed request, no failing test, the button
simply does nothing. Every check that caught this class of bug in F9 was done by
hand in a browser. Spec 5 and spec 1 are that safety net. Prioritise them.

Two things F10 must not pretend to cover:

- `tests/headers.test.mjs` already fails if an `on*=` attribute reappears in
  `public/`. Do not duplicate it; complement it by proving the *behaviour*.
- **`wrangler pages dev` starts with an unmigrated local D1.** `/api/gallery` and
  `/api/config/public` return 500 until you run the migration with `--local`.
  That looks like a broken API and is not one — handle it in setup, don't "fix"
  the API.

---

## Standing rules for this repo

- Remote D1 **writes** and `pages secret put` are **operator-run**. You SELECT
  only, unless the operator tells you otherwise in the moment. (2026-08-03 was an
  explicit exception for the WhatsApp number.)
- **Never log into the production CMS.** Its PIN and its D1/R2 writes are
  operator-only. Exercise the CMS locally.
- Never print or record the admin PIN; check secrets by presence only.
  ⚠️ **The PIN is pending rotation** — it surfaced in a transcript via autofill.
  If you drive a browser near that field, watch for autofill.
- `JWT_SECRET`, `SITE_SECRET` and `TURNSTILE_SECRET` must **never** appear in
  `wrangler.toml` `[vars]`.
- Nothing outside `public/` may ever be published — `tests/exposure.test.mjs`
  enforces this; extend it if you add files.
- Turnstile widget hostnames are dashboard-only (the OAuth API returns 10405).
- The digest Worker deploys from `workers/digest/`, **never** from the repo root;
  the root `wrangler.toml` is the Pages project and the two must not be merged.

## Traps that have already cost this repo time

- **The apex HTML is not the HTML you deployed.** The zone injects two scripts
  into it (JavaScript Detections, the Analytics beacon) that never appear on
  `pages.dev`. A header change can pass every local and preview test and still
  break production. Verify on `https://drsumyapervin.com/` itself.
- **A wrong CSP and a wrong Turnstile hostname produce the identical symptom** —
  every booking 403s, nothing in the console. If it starts right after a header
  change, roll back to **`f64b9221`** (last pre-F9), not to `5423d45e`.
- **Rollback target is `5423d45e`**, but confirm it against
  `npx wrangler pages deployment list --project-name=dr-sumya-pervin-portfolio`
  before quoting it. Two wrong ids have already circulated here.
- **Cloudflare cron day-of-week must be spelled** (`SUN-WED,SAT`). The numeric
  form is rejected with `10100: invalid cron string`.
- **A stored setting is not a used setting.** The CMS's Telegram field drives
  nothing: `main.js:726` builds a generic `t.me/share/url` share sheet that never
  routes to the doctor. **Deferred by the owner — not a bug, do not "fix" it.**
- Playwright's saved console logs are written as binary; plain `grep` skips them
  silently. Use `grep -a`.

## Also open, if you finish both or get blocked

1. **An application-level login throttle** in `functions/api/auth/login.js`
   (D1- or KV-backed, keyed on the attempt). The zone rule on that endpoint is a
   **managed challenge, not a rate limit**, and the Free plan's single
   rate-limit slot is deliberately spent on leaked-credential blocking. Not yet
   in the FIXPLAN — **propose it before building it.**
2. `autocomplete="new-password"` on `#cmsPinInput` — small, and it is why
   browsers keep offering to save the PIN.

## Done means

1. Task A: the first-run outcome named from evidence, with the log lines quoted,
   and `STATUS.md` updated. If you could not determine it, say which of the four
   outcomes remain possible and what would settle it.
2. Task B: five specs green, listed explicitly, plus what they do **not** cover.
   Do not imply coverage you do not have.
3. `npm test` green (191 + whatever you added).
4. `STATUS.md` updated (living record), the FIXPLAN row marked, and a new
   `docs/handoffs/HANDOFF-<date>.md` per house convention, with `docs/README.md`
   pointed at it.
5. Commit locally; **confirm with the operator before pushing.**
