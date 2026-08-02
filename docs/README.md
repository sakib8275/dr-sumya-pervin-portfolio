# docs/ — Dated archive

Everything here is a **snapshot**. Nothing in this directory is updated when the
project changes. Current state lives in [`../STATUS.md`](../STATUS.md); current
rules and architecture in [`../agent.md`](../agent.md); the active execution
plan in [`../FIXPLAN-2026-08-02.md`](../FIXPLAN-2026-08-02.md).

## handoffs/ — session logs, 2026-07-28 → 2026-08-02

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
  (the latest log; covers the audit, fixplan, F1–F7, deploy `f64b9221`, and the
  fixture/editing traps found along the way).

Known staleness in these files (caught by the 2026-08-02 audit): production
deployment names age quickly; `HANDOFF-2026-08-02.md` claims it is untracked
(it is committed); its "www in neither var" note predates `462a0f2`.

## audits/ — the three audit rounds

| File | Round | Status |
|---|---|---|
| `AUDIT.md` + `FIXPLAN.md` | 1 | SUPERSEDED — pre-migration Express backend, deleted |
| `UX-AUDIT.md` + `UX-FIXPLAN.md` | 2 | Partly superseded — pre-migration; one finding regressed and was re-fixed as G06 |
| `AUDIT-ROUND-3.md` | 3 | Post-migration security audit; **all 10 findings fixed and browser-verified** |

## prompts/ — the audit specifications that produced the above

`vibe-code-audit-prompt.md` (round 1), `ui-ux-audit-prompt.md` (round 2/UX),
`STATUS-AUDIT-PROMPT.md` (the 2026-08-02 launch-readiness audit; its output is
the evidence appendix in `../FIXPLAN-2026-08-02.md`).

## SUBAGENT-PLAYBOOK.md

Dispatch rules and environment gotchas for tasks T7–T12. Mostly executed as of
2026-08-02 (T7 done; T8/T12 done in Phase 1; T5's WAF premise was corrected in
`handoffs/HANDOFF-2026-07-31-v3.md`). Kept for the harness gotchas if Playwright
(F10) is taken up.
