# docs/ — Dated archive

Everything here is a **snapshot**. Nothing in this directory is updated when the
project changes. Current state lives in [`../STATUS.md`](../STATUS.md); current
rules and architecture in [`../agent.md`](../agent.md); the active execution
plan in [`../FIXPLAN-2026-08-02.md`](../FIXPLAN-2026-08-02.md).

## handoffs/ — session logs, 2026-07-28 → 2026-08-04 (v2)

Read only when you need the *why* behind a decision. Reading order for the
threads that span files:

- **Turnstile evidence tables** — `HANDOFF-2026-07-31-v3.md` (the only source).
- **Leaked-token investigation** — `HANDOFF-2026-07-31-v4.md`, then `v5`.
  ⚠️ Two wrong token identifications happened before the correct one; the
  lessons are recorded there so they are not repeated.
- **WhatsApp/Telegram "already inputtable" section** — `HANDOFF-2026-07-31-v3.md`.
- **T7 integration suite + the two dead CMS routes** — `HANDOFF-2026-08-02.md`
  (supersedes v5 for those items and for the wrangler-token-prefix gotcha).
- **Phase 1 implementation + docs consolidation** — `HANDOFF-2026-08-02-v2.md`
  (the audit, fixplan, F1–F7, deploy `f64b9221`, and the fixture/editing traps).
- **Domain launch + F8 scaffold** — `HANDOFF-2026-08-03.md` (L1–L8 verified
  state, smoke booking `book-09fce136`, digest-worker bug list, rollback-id
  lesson).
- **F8 built and tested** — `HANDOFF-2026-08-03-v2.md` (six bugs fixed, crons
  derived from `schedule.js`, the Email-Routing findings). Its "not deployed"
  conclusion was overtaken later the same day; read `-v3` for the outcome.
- **F8 shipped + Cloudflare email setup + L8** — `HANDOFF-2026-08-03-v3.md`.
  Supersedes both files above for F8, Cloudflare and D1 state: the worker
  deployed, the Cloudflare cron day-of-week trap, how far the live run got, the
  L7 correction, and the open list as it stood.
- **Doc-validity audit + UX audit + 8 local fixes** — **`HANDOFF-2026-08-04-v2.md`,
  the latest log and the one to read.** Every STATUS.md claim re-probed against
  live state (all accurate, two stale cells fixed); the booking modal now shows
  only the confirmation on success; the audit's critical find: **every
  quiz-driven booking was server-rejected** because the quiz recommended names
  that were never `#serviceType` options. All fixes local and verified;
  **undeployed**. Also records the rulesets-OAuth-scope limit, the behavioral
  L7 proof, and the reveal-gate specificity trap. Companion findings doc:
  `audits/UX-AUDIT-2026-08-04.md`.
- **L6 closed + digest observability** — `HANDOFF-2026-08-04.md`. No code changed;
  it supersedes `-v4` for L6, the digest
  worker's version (`0f6d80cd`) and the git baseline (`3a2e864`). Contains the
  finding that matters most from that session: **the CMS's Telegram field drives
  nothing** — `main.js:726` builds a generic `t.me/share/url` share sheet that
  never routes to the doctor, so "the value is stored" and "the value is used"
  are separate claims. Also: why a cron-only Worker needs logs turned on *before*
  its first run, and why neither cloud routines nor local cron jobs can be
  trusted to check on production here.
- **F9 security headers** — `HANDOFF-2026-08-03-v4.md`. Supersedes `-v3` for headers, deployment id and test count
  (`74c3bd4b`, 191/191); `-v3` remains correct for F8. Contains the corrected
  inline-handler count (12, not 11), the Logout button that had never worked, and
  the trap that matters most: **the zone injects scripts into the apex HTML that
  never appear on `pages.dev`, so a CSP can pass every local test and still break
  production.**

Known staleness in these files (caught by the 2026-08-02 audit): production
deployment names age quickly; `HANDOFF-2026-08-02.md` claims it is untracked
(it is committed); its "www in neither var" note predates `462a0f2`.

## audits/ — the audit rounds

| File | Round | Status |
|---|---|---|
| `AUDIT.md` + `FIXPLAN.md` | 1 | SUPERSEDED — pre-migration Express backend, deleted |
| `UX-AUDIT.md` + `UX-FIXPLAN.md` | 2 | Partly superseded — pre-migration; one finding regressed and was re-fixed as G06 |
| `AUDIT-ROUND-3.md` | 3 | Post-migration security audit; **all 10 findings fixed and browser-verified** |
| `UX-AUDIT-2026-08-04.md` | 4 | Post-launch UI/UX + navigation audit; **8 findings fixed and verified locally (undeployed)**, 11 recommendations open (2 need owner decisions) |

## prompts/ — the audit specifications that produced the above

`vibe-code-audit-prompt.md` (round 1), `ui-ux-audit-prompt.md` (round 2/UX),
`STATUS-AUDIT-PROMPT.md` (the 2026-08-02 launch-readiness audit; its output is
the evidence appendix in `../FIXPLAN-2026-08-02.md`),
`F8-DIGEST-PROMPT.md` (2026-08-03; kickoff prompt for the digest worker —
**executed**, see `handoffs/HANDOFF-2026-08-03-v3.md`. ⚠️ It states the numeric
crons `30 8 * * 0-3,6` / `30 10 * * 0-4,6` are correct. They are not — Cloudflare
rejects numeric day-of-week. Do not copy them from this file),
`F9-HEADERS-PROMPT.md` (2026-08-03; security headers, starting with the
inline-handler refactor — **executed**, see `handoffs/HANDOFF-2026-08-03-v4.md`),
`F8-SIGNOFF-F10-PROMPT.md` (**the current one — paste this into the next
session**: read the digest's first-run logs to close F8, then build the
Playwright DOM layer).

## SUBAGENT-PLAYBOOK.md

Dispatch rules and environment gotchas for tasks T7–T12. Mostly executed as of
2026-08-02 (T7 done; T8/T12 done in Phase 1; T5's WAF premise was corrected in
`handoffs/HANDOFF-2026-07-31-v3.md`). Kept for the harness gotchas if Playwright
(F10) is taken up.
