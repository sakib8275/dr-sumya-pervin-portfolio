# Review record format

The records in `docs/reviews/` are the project's memory of why things are the way
they are. Keep them in this shape so the next reader can scan dispositions.

```markdown
# PR #NN review: <reviewer>, round N (YYYY-MM-DD)

<What was reviewed: branch, head SHA vs base SHA, diff size. Who reviewed and how
(sub-agent `reviewer`, or the CLI command line). Runtime if notable.>
Verdict: **FIX FIRST** (1×P1, 1×P2, 3×P3).

## P1 — <claim> — REAL, FIXED (`<sha>`)
<Reviewer's point in one paragraph. How it was reproduced (test, probe, grep) with
the before/after evidence. What the fix changed.>

## P2 — <claim> — DECISION RECORDED
<Why this is a judgement call and which way it went.>

## P3s — accepted as notes
1. <claim>: <disposition, one or two lines>.

## Checked, no finding
<What the reviewer verified clean. This tells the next round what not to redo.>

Gates after fixes: <N> node + <M> e2e.
```

Dispositions: REAL, FIXED · DECISION RECORDED · ACCEPTED AS NOTE · DEFERRED ·
REJECTED. A REJECTED finding carries the evidence that refutes it, not an opinion.

## External reviewer

The operator has run headless third-party CLIs as reviewers for PRs #15–#21 (see the
headers of those records). This is the recipe from PR #21:

```bash
qwen --auth-type openai -m qwen3.8-flash -o text --max-wall-time 18m -p "<prompt>"
```

Pre-materialize the diff, give the repo as read-only context at the base commit,
and demand a verdict plus severity-tagged `file:line` findings. The reviewer brief
in `.claude/agents/reviewer.md` works as that prompt. The CLI needs the operator's
own credentials, so an agent session may not have it. Use the `reviewer`
sub-agent instead.
