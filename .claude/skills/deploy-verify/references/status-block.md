# STATUS.md deploy block

`STATUS.md` is the one living state document. Each deploy adds a dated block at
the top. When the top block already describes the same piece of work, replace it
instead. **Never trim the stack below it.** Keep the hash-stable rows (such as the
`git` row) hash-free.

```markdown
**Updated:** YYYY-MM-DD (DEPLOYED) — **<what shipped, one line> is LIVE.**
<PR #NN (`<merge sha>`) merged / committed directly at the owner's call.>
Gates on the committed tree: <N> node + <M> e2e. Deployed as `<deployment id>`
(`npx wrangler pages deploy`; <static assets only | Functions changed | Workers:
name>). Rollback target: `<previous deployment id>`.
Verified on the live apex: `npm run verify:live -- --browser` <exit 0, N/N | exit 2 —
operator browser check: …>; <anything specific to this change, observed not
assumed>. Known deferred: <items, or "none">.
```

Write what was **observed**, not what was expected. "Verified" means you saw it.
If a check could not run (exit 2, no browser), say who checked it and how, or say
that it is unverified.
