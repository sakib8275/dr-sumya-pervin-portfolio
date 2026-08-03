# PROMPT — F8: finish and ship the daily digest worker

> **EXECUTED 2026-08-03 — archived, do not re-run.** Outcome:
> `../handoffs/HANDOFF-2026-08-03-v3.md`.
>
> ⚠️ **One instruction below is wrong.** It states the crons `30 8 * * 0-3,6`
> and `30 10 * * 0-4,6` are correct and must not be changed. Cloudflare's
> schedules API **rejects numeric day-of-week** (`10100: invalid cron string`);
> the deployed crons are `30 8 * * SUN-WED,SAT` and `30 10 * * SUN-THU,SAT`.
> Never copy the numeric form from this file.

Paste this into a fresh agent session. Everything it needs is in the repo; the
pointers below tell it what to read first and what "done" means.

---

You are picking up the Dr. Sumya Pervin portfolio at
`/home/kitahara-poposagain/Desktop/Portfolio Sumya Pervin` (branch `master`,
Cloudflare Pages/D1/R2). **Read first, in this order:** `STATUS.md` →
`docs/handoffs/HANDOFF-2026-08-03.md` → `FIXPLAN-2026-08-02.md` §Phase 2 row F8 →
`agent.md` → `workers/digest/` (the untracked scaffold you are fixing) →
`functions/lib/schedule.js` (the reference for chambers, cutoffs, Dhaka time) →
`migrations/001_schema.sql` (real column names).

## Task

Finish and ship **F8 — the daily per-chamber appointment digest** (locked decision
T11: after each chamber's booking cutoff, email Dr. Sumya that chamber's bookings
for the day; **always send, even "0 bookings"** — silence reads as failure).

A scaffold exists at `workers/digest/` (own wrangler.toml, crons correct:
`30 8 * * 0-3,6` DCIMCH, `30 10 * * 0-4,6` Alliance — these are the cutoffs in
UTC; do not change them without re-deriving from `schedule.js`). It has six known
bugs, all verified against the live schema — fix every one:

1. **Wrong D1 columns.** It selects `name, phone, ... WHERE date = ?`; the real
   schema is `patient_name, patient_phone, appointment_date, service, notes,
   status, created_at`. (`SELECT name …` against production errors
   `no such column: name`.)
2. **Missing import.** `EmailMessage` needs `import { EmailMessage } from
   "cloudflare:email"` (or build MIME with `mimetext`); the bare global is
   undefined in module workers. Check current Cloudflare docs for the send_email
   binding before writing code.
3. **UTC date bug.** `new Date().toISOString()` is UTC; "today" must be the
   **Dhaka** date (UTC+6, no DST). Follow `functions/lib/schedule.js`'s approach —
   extract a tiny shared helper or duplicate its ~5 lines with a comment; do not
   reinvent.
4. **Sender mismatch.** Scaffold uses `noreply@drsumyapervin.com`; the plan
   creates **`digest@drsumyapervin.com`**. Use `digest@`; flag in your final
   report if the human hasn't confirmed which address exists.
5. **"Unknown Chamber" branch sends email.** On an unexpected cron: log and
   return, never send.
6. **No tests.** Add a `tests/digest.test.mjs` in the existing suite style
   (`tests/helpers/harness.mjs` patterns; stubbed D1 + captured email payload):
   per-chamber filter correctness, Dhaka/UTC edge (e.g. 00:30 Dhaka = 18:30 UTC
   previous day), empty-list body still sends, both crons route to the right
   chamber.

Email content per row: name, phone, service, notes (if any), status — ordered by
`created_at` ASC, with a total count header naming chamber + date.

## Gates (all mandatory)

- `npm test` green (existing 155 + your new tests) before any deploy.
- **Human prereqs may be missing:** F8 needs Email Routing enabled on the zone, a
  verified destination (the doctor's email — ask for it if not provided), and the
  `digest@drsumyapervin.com` sender created (HUMAN-TASKS.md Task 13). If these
  aren't confirmed, deliver code + tests, deploy the worker, and leave the live
  email verification as an explicit open item — do **not** fake-verify.
- Deploy with `wrangler deploy` from `workers/digest/`, then a forced cron test
  (dashboard or `wrangler triggers`) proving an email arrives. Never touch the
  booking path; the digest worker is read-only on D1.
- Remote D1 **writes** and `pages secret put` are operator-run — you SELECT only.
  Presence-only secret checks; never print or record the admin PIN.
- Rollback target for the *site* is `5423d45e` — irrelevant here unless asked;
  quote deployment ids only from `npx wrangler pages deployment list`.

## Done means

1. All six bugs fixed; `npm test` green.
2. Worker deployed; forced-cron email received (or human prereqs explicitly
   listed as open).
3. `STATUS.md` updated (living record), FIXPLAN F8 progress logged, and a new
   `docs/handoffs/HANDOFF-<date>.md` per house convention.
4. `agent.md` updated if the digest worker changes any documented architecture
   (it adds a second worker — check the tree section).
5. Commit locally; the operator pushes.

If anything in this prompt disagrees with `STATUS.md`, `STATUS.md` wins — and say
so in your report.
