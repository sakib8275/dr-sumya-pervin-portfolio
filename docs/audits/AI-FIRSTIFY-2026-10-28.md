# AI-Firstify Assessment Report

**Project:** drsumyapervin.com (`dr-sumya-pervin-portfolio`)
**Date:** 2026-10-28
**Mode:** Re-engineer (audit first, then additive fixes; nothing deleted)
**Baseline:** `b1d070b` on `claude/gallant-johnson-huck5a`; `npm test` 328/328 before, 337/337 after

## Overall Score

| Dimension | Before | After | Summary |
|-----------|--------|-------|---------|
| 1. Project Structure | YELLOW | GREEN | There was no CLAUDE.md, and AGENTS.md linked to a file on the owner's desktop. Git discipline is excellent |
| 2. Agent Architecture | GREEN | GREEN | No LLM calls in app code. Reviews use outside CLIs, now joined by a read-only reviewer sub-agent |
| 3. Skill Usage | RED | YELLOW | Deploy, review and content workflows ran by hand many times with no `.claude/`. Three skills now cover them, but none has run on real work yet |
| 4. Scope & Complexity | YELLOW | YELLOW | The frontend and the booking stack are justified. Several CMS features have no public consumer (needs a decision) |
| 5. Context Hygiene | RED | YELLOW | The wrong facts in agent.md and context.md are fixed. STATUS.md is still 609 lines, with stale incident ids and stale rows (owner's call) |
| 6. Safety | YELLOW | YELLOW | Strong prose rules, now also enforced in settings. Admin PIN rotation, the rollback ids and unapproved medical references are still open |
| 7. Workflow Design | YELLOW | YELLOW | Review rigour was real but ad hoc. It is now prescriptive skills with a tested live check that has not yet run against the real apex |

## Priority Recommendations

1. **[HIGH]** Rotate the admin PIN. This has been open since 2026-08-04 (STATUS.md § Standing owner actions 1, HUMAN-TASKS Task 0): the production PIN appeared in an agent session transcript. The seed hash and salt in `migrations/001_schema.sql` are harmless only once the live PIN has changed. *5 min, owner.*
2. **[HIGH]** Decide on `content/references.mjs`. Its header says *"DRAFT FOR OWNER/CLINICAL APPROVAL — DO NOT DEPLOY UNTIL APPROVED"*, yet `article.mjs:107` renders it ungated on condition pages (`public/conditions/acne/` has a References block), and STATUS.md:432 lists the approval as still pending "before deploy". This is medical content, and it is likely live now. Confirm the approval and update the header, or gate the block. *Owner + 15 min.*
3. **[HIGH]** Replace the rollback ids in STATUS.md § "If a booking ever 403s" (`5423d45e`, `f64b9221`). Both predate the multi-page site and every October change, so following them in an incident would put the one-pager back. The fix is to roll back to the deployment before the current one, which `/deploy-verify` step 4 now records. Two other STATUS.md lines are also stale: the :468 heading still names `a5077cb3` as live, and the :516 WhatsApp row shows the pre-migration-005 number. *10 min, owner.*
4. **[MEDIUM]** Re-wire or retire the CMS features with no public consumer: **Site Content** (`/api/content`), **Gallery** (`/api/gallery`, `/api/uploads`, R2) and **Settings → WhatsApp/Telegram**. No public page fetches them; the build stamps contact facts from `content/site.mjs`. Migration 005 keeps the D1 WhatsApp value equal to the site's number, so nothing is wrong today. The risk is that a Settings edit silently changes nothing, and the features still carry attack surface (an authenticated upload path, an anonymous gallery read). *Owner decision, then 1–3 h.*
5. **[MEDIUM]** Fix the homepage step in `.github/workflows/uptime.yml`. It greps `id="bookingForm"`, which exists nowhere in `public/` (the form is now `siteBookingForm` on `/book/`). The step passes only because GitHub runners are edge-blocked first. On any unblocked run it fails, which is a false alarm in waiting. Assert on the canonical link, as `scripts/verify-live.mjs` does. *5 min.*
6. **[MEDIUM]** Split STATUS.md. About 300 lines of stacked `**Updated:**` blocks come before the reader reaches "Verified right now", and that table is dated 2026-08-05. Keep a short current-state block and move older blocks to an archive file. Git history shows the owner deliberately keeps the stack, so this is their call. *30 min.*
7. **[MEDIUM]** Approve or decline the agent-config follow-ups from the review round (§ Review round, below). They change `CLAUDE.md`, `.claude/settings.json` and `.claude/` skill and agent files, so they wait for the owner. *15 min.*
8. **[LOW]** Move the closed `FIXPLAN-2026-08-0{2,5}.md` from the root into `docs/` (update `tests/exposure.test.mjs`, `docs/README.md` and STATUS § Active documents). *15 min.*
9. **[LOW]** Run the three new skills on their next real occurrence and refine them (the Three Times Rule: the 4th time tests the skill). *Ongoing.*

## Detailed Findings

### Dimension 1: Project Structure
- **Good:** a clean `public/` publish boundary, enforced by `tests/exposure.test.mjs`; a thorough `.gitignore` that already excluded `backups/`, `.dev.vars` and Playwright traces; `type(scope): subject` commits; one PR per batch; CI on every PR.
- **Was missing:** CLAUDE.md. `AGENTS.md` pointed at `file:///home/kitahara-poposagain/Desktop/…/agent.md`, which resolves only on the owner's machine (not in CI, a cloud session or GitHub). `agent.md` was the de-facto entry point at 477 lines.
- **Root:** 28 tracked entries (25 without dotfiles), including two closed dated FIXPLANs and a DNS zone export (`drsumyapervin.com.txt`, guarded by the exposure test). Not cluttered, but not purely current.

### Dimension 2: Agent Architecture
- No `openai`, `anthropic`, `langchain` or other LLM SDK, and no completion calls, anywhere in `functions/`, `workers/`, `public/js/` or `scripts/`.
- PR reviews used headless third-party CLIs (`qwen`, `agy`) with recorded dispositions, which is the right pattern. Those CLIs need the operator's credentials, so an agent session could not run a review on its own. A `reviewer` sub-agent now fills that gap.

### Dimension 3: Skill Usage
- Before: no `.claude/` directory. Repeated workflows lived as prose: deploy plus live verification in roughly eight STATUS blocks, nine review records in `docs/reviews/`, content edits through the build, and audit kickoff prompts in `docs/prompts/`.
- After: `/edit-content`, `/review-round` and `/deploy-verify`. Each has a SKILL.md under 70 lines with numbered steps, a `references/` file for depth, and explicit human checkpoints. `/deploy-verify` stops for an explicit "deploy" in the session.

### Dimension 4: Scope & Complexity
- The frontend is warranted: this is a public patient site, not a personal tool. D1, Turnstile, JWT with TOTP, the mailer and the digest all serve real booking and admin needs.
- Not warranted as things stand: the three CMS surfaces above, which are still stored, editable and attack surface, but are read by nothing public. The ERP + patient-portal programme (`docs/ERP-INTEGRATION-PLAN.md`) is proposed with nothing built. Keep it that way until the Centre opens.

### Dimension 5: Context Hygiene
Wrong facts an agent would have acted on, all verified against the code and now fixed:

| Claim | Where | Truth |
|---|---|---|
| `escapeHTML` and `[data-cms-action]` live in `public/js/main.js` | agent.md §3 | `main.js` does not exist. They are in `admin.js` and `cms.js` |
| "preserve the custom glassmorphism aesthetic" (two lines) | agent.md §3 | agent.md §4 says "No glassmorphism", and DESIGN.md's Earned Shadow Rule (flat paper and indigo) rules it out |
| Local and remote setup runs `001_schema.sql` only | agent.md §5 | There are five migrations. The harness applies all of them |
| "the 204-test suite", "F10's 14 Playwright tests", "295" | agent.md §2, §5 | 328 node + 66 e2e. Counts are now removed rather than updated |
| API table | agent.md §3 | Was missing 2FA, password reset, `/api/config/public` and `/api/content` |
| Contact numbers "come from `/api/config/public` … CMS Settings" | context.md §2, §6 | They are stamped at build time from `content/site.mjs` |
| "Chamber schedules live in `public/index.html`" | context.md §6 | They live in `functions/lib/schedule.js` |

Still open: STATUS.md (609 lines, recs 3 and 6). CLAUDE.md routes agents to its top block first, and its lower sections still carry the stale incident ids, the stale live-deploy heading and the stale WhatsApp row. agent.md is 492 lines. agent.md is now a reference behind a 95-line CLAUDE.md rather than the first thing read.

### Dimension 6: Safety
- **Good:** no secrets in git; secrets are `pages secret` only, with no fallbacks; CI never deploys; remote D1 is SELECT-only by rule; PII is stripped from logs and tested; the exposure test runs on every `npm test`.
- **Was prose-only, now enforced:** `.claude/settings.json` asks before `wrangler pages deploy`, `wrangler deploy`, any `secret` put, any `d1 execute`, `r2`, `backup:d1` and `git push … master`. It denies the Read tool on `.dev.vars`, `.env*` and `backups/**`. Caveat: Read-deny rules bind the Read tool; a shell `cat` is not guaranteed to be caught.
- `.gitignore` now also covers `.env.*`, `*.pem`, `*.key`, `credentials.json`, `service-account.json` and `.claude/settings.local.json`. None of these exist today; the entries are defensive.
- **Open:** admin PIN rotation (rec. 1), the draft medical references (rec. 2) and the stale incident-rollback ids (rec. 3). The guards are not exhaustive. For example, `wrangler d1 migrations apply`, `pages project delete` and non-`npx` spellings are not covered (§ Review round).

### Dimension 7: Workflow Design
- Before: unusually disciplined by hand (adversarial review rounds with evidence-backed dispositions, gates before every deploy, live-apex checks), but it lived in people's heads and in STATUS prose.
- After: the skills make it prescriptive. The `reviewer` sub-agent separates creation from review. `scripts/verify-live.mjs` makes the post-deploy check deterministic: leaks with body markers, HSTS, CSP nonce freshness, Turnstile allowances, API shape, served-asset hashes, plus a `--browser` pass that requires a 200 and a clean console. `tests/verify-live.test.mjs` (5 tests, hermetic) pins both directions:
  - the clean harness passes;
  - a 200 catch-all serving secret markers FAILs (exit 1);
  - an edge challenge on some paths never downgrades a real leak to inconclusive (exit 1);
  - a fully challenged vantage point is inconclusive (exit 2);
  - an unreachable host is inconclusive (exit 2).

  A manual run with `--browser` against the harness passed 33/33 (27 HTTP checks + 6 browser checks).
- **Not verified:** a live run against the real apex. This session's network policy blocks `drsumyapervin.com` (the proxy refuses the CONNECT), and the script correctly reported `UNREACHABLE` (exit 2).

## Changes Made (Re-engineer mode only)

| Action | File | Description |
|--------|------|-------------|
| Created | `CLAUDE.md` | Entry point: map, commands, 11 hard rules, skills, traps (95 lines) |
| Modified | `AGENTS.md` | Relative links to CLAUDE.md and agent.md (the old link was a desktop path) |
| Created | `.claude/skills/edit-content/` | SKILL.md + `references/content-map.md` |
| Created | `.claude/skills/review-round/` | SKILL.md + `references/record-format.md` |
| Created | `.claude/skills/deploy-verify/` | SKILL.md + `references/status-block.md` |
| Created | `.claude/agents/reviewer.md` | Read-only adversarial reviewer with the project checklist |
| Created | `.claude/settings.json` | Ask/deny permission guards |
| Created | `scripts/verify-live.mjs` | Read-only post-deploy apex check (`npm run verify:live`) |
| Created | `tests/verify-live.test.mjs` | Runs the check against the harness and against hostile stand-ins (5 tests) |
| Modified | `package.json` | `verify:live` script |
| Modified | `tests/exposure.test.mjs` | CLAUDE.md and `.claude/` paths must never be published |
| Modified | `agent.md` | Stale facts fixed (table above); API and env tables completed; tree updated |
| Modified | `context.md` | Contacts, schedules and motion pointed at their real sources; one-pager table marked historical |
| Modified | `.gitignore` | Credential patterns, `.env.*`, `settings.local.json` |
| Modified | `docs/README.md` | Audit table row for this report |

## Review round (independent sub-agent, 2026-10-28)

A fresh general-purpose sub-agent reviewed this report and the diff read-only. It verified claims (a)–(e) above, the API rows and the line counts. Dispositions:

| # | Finding | Disposition |
|---|---|---|
| P1 | The report said the D1 WhatsApp number differs from the site's. Migration 005 set them equal; the source was a stale STATUS row | **REAL, FIXED** (rec. 4 rewritten) |
| P1 | Admin PIN rotation missing from Safety | **REAL, FIXED** (now rec. 1) |
| P2 | `verify-live`: one `cf-mitigated` response forced exit 2 even when other checks FAILed, laundering a leak | **REAL, FIXED**: per-result SKIP, and a real FAIL always wins. Regression test added |
| P2 | `verify-live --browser` ignored the page status, and Turnstile-origin CSP refusals were dropped | **REAL, FIXED**: a 200 is required, and CSP lines from Turnstile now count |
| P2 | Scores for Skill Usage and Workflow Design were too generous for unproven tooling | **ACCEPTED**: both are YELLOW until first real use |
| P3 | Report counts (root entries, 33/33 provenance), DESIGN.md wording, the stale FIXPLAN tree line in agent.md, a verify-live comment overclaim | **FIXED** |
| P2 | `.claude/settings.json` does not guard `d1 migrations apply --remote`, `pages project delete`, `wrangler delete`, `kv`, or non-`npx` `pages secret`/`r2`. Unconfirmed whether `Bash(npx wrangler pages deploy *)` matches the bare command | **AWAITING OWNER**: permission config |
| P2 | `.claude/agents/reviewer.md` allows `npm test`, which rewrites `public/sitemap.xml` | **AWAITING OWNER**: agent config (fix: tell it to `git checkout public/sitemap.xml` after) |
| P2 | CLAUDE.md sends agents to STATUS.md without warning that its 403 section and :468 heading are stale | **AWAITING OWNER**: CLAUDE.md (or fixed at the source by rec. 3) |
| P3 | CLAUDE.md "(not `wrangler secret put`)" holds for Pages only; the mailer Worker uses `wrangler secret put` | **AWAITING OWNER**: CLAUDE.md |
| P3 | CLAUDE.md says staff manage "the gallery and site copy", which contradicts its own "stored is not used" trap | **AWAITING OWNER**: CLAUDE.md |
| P3 | `/deploy-verify` has no ask step before a live smoke booking (a prod D1 write plus mail), and step 9 records before step 10 | **AWAITING OWNER**: skill file |

The AWAITING rows are agent configuration, so they are applied only with the owner's go-ahead (rec. 7).

## Still Needs Human Decision

- [ ] Rotate the admin PIN (rec. 1)
- [ ] Approval status of `content/references.mjs` on the live site (rec. 2)
- [ ] STATUS.md incident rollback ids and stale rows (rec. 3)
- [ ] Re-wire or retire CMS Site Content, Gallery + R2, and Settings WhatsApp/Telegram (rec. 4)
- [ ] Approve the one-line uptime.yml assertion fix (rec. 5)
- [ ] Whether to split STATUS.md (rec. 6)
- [ ] The agent-config follow-ups in § Review round (rec. 7)

## Recommended Next Steps

1. Owner: answer recs 1–3. Each one is a short decision or action.
2. Next deploy: run it through `/deploy-verify` from the operator's machine, where `npm run verify:live -- --browser` can reach the apex, and refine the skill from that run.
3. Next PR: run `/review-round` with the `reviewer` sub-agent and compare its findings with a `qwen` round on the same diff.
4. Merge this branch only after `/review-round` on it.
