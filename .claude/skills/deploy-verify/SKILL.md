---
name: deploy-verify
description: Deploy drsumyapervin.com to Cloudflare Pages with the operator's explicit go-ahead, verify the live apex (leaks, headers, API, served assets, console), and record the result in STATUS.md. Use for any production deploy, and to re-verify the live site.
---

# Deploy and verify

Real patients book through this site. The two failures that have actually bitten
here, a Turnstile hostname list that rejects every booking and a CSP that blocks the
widget, look exactly like a working site from every check that runs before deploy.
That is why deploys are manual and every one ends with a live-apex check.

## Steps

1. **Pin what ships.** Use a clean checkout of the commit to deploy, normally merged
   `master`: `git status` is clean and CI is green on that SHA.
   `wrangler pages deploy` uploads the working tree, not a git ref, so any local edit
   ships too.
2. **Run the gates on that tree:** `npm test` and `npm run test:e2e`, then
   `git checkout public/sitemap.xml` (the test build re-dates it). Note the counts.
3. **Classify the change:** `git diff --stat <last-deployed-commit>..HEAD`.
   - Static only (`public/`, `content/`): the normal case.
   - `functions/_middleware.js` or headers: the apex browser check in step 7 is mandatory.
   - `functions/` or `wrangler.toml`: re-read `agent.md` §5 for bindings and secrets.
   - `workers/<name>/`: that Worker deploys separately (`cd workers/<name> && npx wrangler deploy`).
   - `migrations/`: the **operator** runs the remote migration. Agents are SELECT-only on remote D1.
4. **Record the rollback target:**
   `npx wrangler pages deployment list --project-name=dr-sumya-pervin-portfolio`.
   Note the current production deployment id.
5. **STOP and ask.** Show the operator the SHA, the gate counts, the classification
   and the rollback id, then wait for an explicit "deploy" in this session. A previous
   approval does not carry over.
6. **Deploy:** `npx wrangler pages deploy` from the repo root. `wrangler.toml` names
   the project and `public/`. Note the new deployment id from the output.
7. **Verify the apex:** `npm run verify:live -- --browser`.
   - Exit 0: every check passed.
   - Exit 1: read the FAIL lines. A mismatch in a served asset right after a deploy is
     usually the CDN cache. Wait a minute and re-run before concluding anything.
   - Exit 2: inconclusive. The edge blocked this machine, or it cannot reach the site.
     Ask the operator to open `https://drsumyapervin.com/`, `/book/` and `/prices/` at
     desktop and phone width with DevTools open and report any console errors or
     `Refused to …` / CSP lines. Turnstile's own WebGL and font warnings are harmless.
   - After a header change, the console check on the **apex** is required. `pages.dev`
     never gets the zone-injected scripts.
8. **On failure, roll back first and debug after** if bookings could be affected
   (a 403 on booking, Turnstile, CSP): Pages dashboard → Deployments → the rollback
   id from step 4 → Rollback. Then investigate.
9. **Record it in `STATUS.md`** using `references/status-block.md`, and commit it as
   `docs(status): <what> deployed as <id>`.
10. **Smoke rows.** A booking made against the live apex is the only real Turnstile
    test, and it leaves a row only the operator can delete. List each one, with its
    `appointment_date` against the digest crons, and ask for same-day deletion.

## References
- `references/status-block.md`: the STATUS.md block template.
- `agent.md` §5 (deploy, secrets, headers, digest Worker) and §5c (ops, logs).
