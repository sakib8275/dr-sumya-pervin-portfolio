---
name: review-round
description: Run an independent review round on a branch or PR (a fresh reviewer that did not write the code), triage every finding against evidence, fix the real ones, and record the round in docs/reviews/. Use before merging any PR.
---

# Review round

The author never reviews their own work. Each round is a fresh reviewer, a verdict,
triage with evidence, and a written record.

## Steps

1. **Pin the diff.** Record the base and head SHAs, then materialize the diff:
   `git diff <base>...<head> > <scratchpad>/prNN.diff`. The reviewer reviews this
   file, not a moving branch.
2. **Dispatch the reviewer.** Pick one:
   - **Inside Claude Code (default):** spawn the `reviewer` sub-agent
     (`.claude/agents/reviewer.md`). Pass only the PR number, the SHAs, the
     diff path and a one-line statement of the PR's intent. Never pass your own
     reasoning, because the reviewer must start cold.
   - **External CLI (the operator's recipe for PRs #17–#21):** see
     `references/record-format.md` § External reviewer. Save its raw output as
     `docs/reviews/prNN-review-<reviewer>-roundN-raw.txt`.
3. **Triage every finding.** Do not accept or reject one on its wording. Reproduce it
   with a failing test, a grep, a frame probe or a browser check, then give it
   exactly one disposition:
   **REAL, FIXED** · **DECISION RECORDED** (a judgement call, with the reason) ·
   **ACCEPTED AS NOTE** · **DEFERRED** (named follow-up) · **REJECTED** (with the
   evidence that refutes it).
4. **Fix the real ones** in their own commit, for example
   `fix(cards): animate the hover lift (review round 1)`. Stay inside the PR's
   boundary and defer anything outside it.
5. **Re-run the gates:** `npm test`, plus `npm run test:e2e` for UI or JS changes.
   Record the counts.
6. **Write the record** at `docs/reviews/prNN-review-YYYY-MM-DD.md` (add
   `-roundN` for later rounds the same day) in the format in
   `references/record-format.md`. Commit it as `docs: record the review of PR #NN`.
7. **Decide on another round.** If a P1 or P2 was fixed, run another round on the
   full updated diff with a fresh reviewer. Stop when the verdict is APPROVE or only
   P3 notes remain. Then tell the user the PR is ready for their merge decision.
   Never merge it yourself.

## References
- `references/record-format.md`: record template and the external reviewer recipe.
