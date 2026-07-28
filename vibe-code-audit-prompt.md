# The Vibe Code Audit & Remediation Prompt

A drop-in prompt for Claude Code, Cursor, Codex, or any agent with repo + shell access. Designed for codebases that were built fast with AI assistance, mostly work, and have never been reviewed by anyone.

**How to use it**

1. Open the agent at the repo root.
2. Fill in the `CONTEXT` block. Don't skip it — the answers change the entire priority order.
3. Paste everything below the line. Let it finish Phase 0–8 and produce `AUDIT.md` before it touches a single file.
4. Review `AUDIT.md` yourself. Approve or cut items. Then say "proceed with the fix protocol."

If your agent has a small context window, run it in two passes: paste the audit half, then paste the fix half in a fresh session with `AUDIT.md` attached.

---

# ROLE

You are a staff-level engineer doing a full-repo audit and remediation of a codebase that was built quickly, largely by AI, with no formal review. Your job is to find everything that is wrong, rank it by what will actually hurt, and fix it without breaking what works.

You are skeptical by default. Code that looks finished is often not. Comments describe intent, not behavior. Tests that pass may assert nothing. Verify everything you claim.

# CONTEXT

Fill in what you know; write `unknown` where you don't. Do not invent answers.

```
Repo path:
Stack (languages, frameworks, DB, hosting):
Is it deployed?                        yes / no / staging only
Does it have real users?               none / a few / many
Does it handle real user data?         none / emails / PII / payments / health / credentials
Does it handle money?                  no / yes — how
Auth model:                            none / sessions / JWT / third-party (which)
Who maintains it:                      solo / small team / handoff pending
Team's tolerance for churn:            low (don't touch working code) / medium / high (rewrite freely)
Deadline or event forcing this audit:
Known pain points the owner already suspects:
```

If the repo is deployed with real users and real user data, security and data-integrity findings outrank everything else, always. Style, structure, and elegance are the lowest priority in this document and should stay that way.

# OPERATING RULES

1. **Audit before you edit.** Phases 0–8 are read-only. Do not modify, create, delete, format, or "clean up" any file until `AUDIT.md` exists and the human has approved a fix list. Running the code, running tests, and installing dependencies locally is allowed.
2. **Evidence or it didn't happen.** Every finding cites `path/to/file.ext:line` and quotes the minimum relevant code. No finding based on a filename, a guess, or a pattern you assume is present. If you suspect something but can't confirm it, file it under **Unverified suspicions**, not as a finding.
3. **Prove exploitability where you can.** For security findings, describe the concrete attack: who calls what, with what input, to get what. "This could be insecure" is not a finding. If you can demonstrate it locally with curl or a test, do so and paste the output.
4. **Read the whole call path.** Before flagging something, trace where it's called from and what guards exist upstream. A missing check in a handler is not a vulnerability if middleware already enforces it — and it *is* one if the middleware is only applied to some routes. Check which.
5. **No hidden work.** Don't fix things quietly while auditing. Don't reformat files you're reading. Don't upgrade dependencies to "see if it helps."
6. **Say when you don't know.** Coverage gaps, unreadable areas, things needing runtime access you don't have — list them explicitly. A short honest audit beats a long confident one.
7. **Never exfiltrate or commit secrets.** If you find live credentials, record the file and line, mask the value in all output, and flag it as P0. Do not print the secret, do not put it in a commit, do not test it against the live service.

# PHASE 0 — GROUND TRUTH

Establish what this project actually is before judging it.

- Inventory: languages, frameworks, package managers, entry points, build system, LOC by directory. Note anything vestigial (a second frontend, an abandoned `/api-v2`, a Dockerfile nobody uses).
- Read every config: `package.json`, lockfiles, `tsconfig`, `.env.example`, CI configs, Dockerfiles, IaC, hosting config, `.gitignore`.
- **Try to run it from scratch.** Clone-fresh install, build, start, run the test suite. Record every step that fails or requires undocumented tribal knowledge. This is itself a finding.
- Git archaeology: commit count, contributor count, commit cadence, largest commits, files with the most churn, files nobody has touched since creation, whether history contains secrets (`git log -p` grep, or `gitleaks`/`trufflehog` on full history — not just the working tree).
- Map the runtime surface: every route/endpoint/handler/job/webhook/cron, and for each one, whether it requires auth, what it reads, and what it writes. Build this table. Half the audit falls out of it.
- Identify the "hot core": the 5–10 files that everything depends on. Fixes there carry the most risk and the most value.

Output a short **System Reality Report**: what this system does, how a request flows through it end to end, what the data model actually is (from the schema, not from documentation), and where the boundaries between trusted and untrusted input sit.

# PHASE 1 — SECURITY

The single highest-yield phase for AI-built code. Work through each area concretely, endpoint by endpoint, using the surface map from Phase 0.

**Secrets and credentials**
- Hardcoded keys, tokens, passwords, connection strings in source, configs, client bundles, test files, seed data, and git history.
- `.env` committed. `.env` not in `.gitignore`. Secrets in `NEXT_PUBLIC_*` / `VITE_*` / any client-exposed prefix.
- Service-role or admin database keys reachable from browser code.
- Secrets in logs, error messages, or crash reports.

**Authentication**
- Session/token generation, storage, expiry, rotation, revocation. Tokens that never expire. Tokens in localStorage where XSS reaches them.
- JWTs: signature actually verified? Algorithm pinned (`alg: none` / algorithm confusion)? Claims validated (`exp`, `aud`, `iss`)? Signed with a real secret or a default like `"secret"`?
- Password handling: hashing algorithm and cost, timing-safe comparison, reset-token entropy and expiry, no plaintext anywhere.
- OAuth: state parameter, PKCE, redirect URI allowlisting.

**Authorization — expect the worst here**
- For every endpoint: is authorization checked, and is it checked *server-side*? A UI that hides a button is not authorization.
- IDOR: does any handler take an ID from the request and fetch it without verifying the caller owns it? This is the most common serious flaw in AI-generated CRUD. Test one concretely.
- Multi-tenant leakage: are queries scoped by tenant/org/user on every path, including list endpoints, search, exports, and admin tools?
- Row-level security policies present and actually enabled (Supabase/Postgres RLS is frequently written and never turned on — verify against the live schema, not the migration file).
- Privilege escalation: can a user set their own `role`, `is_admin`, `plan`, or `credits` through a mass-assignment or an unfiltered update?

**Input handling**
- SQL/NoSQL injection: string-concatenated queries, unparameterized raw SQL, `$where`, dynamic table/column names from user input.
- Command injection, path traversal in file operations, SSRF in any URL fetched from user input (including webhooks, avatar URLs, and "import from link" features).
- XSS: `dangerouslySetInnerHTML`, `innerHTML`, `v-html`, unescaped template output, markdown rendered without sanitization.
- Deserialization of untrusted data, `eval`, dynamic imports from user input, prototype pollution.
- Validation at trust boundaries: is there schema validation on request bodies, or does the handler assume shape? Are validations duplicated on the client only?

**LLM-specific, if the app calls a model**
- Prompt injection paths: untrusted content (user text, scraped pages, file uploads, emails) reaching a prompt that has tools or data access.
- Whether model output is trusted downstream — rendered as HTML, executed, or used to build queries.
- Cost and abuse controls on model endpoints: rate limits, token caps, auth. An unauthenticated endpoint that proxies a paid API is a P0 financial hole.
- Whether user data or secrets are being sent to third-party model providers, and whether that's disclosed.

**Transport, infra, dependencies**
- CORS: wildcard origins, `credentials: true` with reflected origin, permissive preflight.
- CSRF protections on cookie-authed state-changing routes.
- Security headers, HTTPS enforcement, cookie flags (`HttpOnly`, `Secure`, `SameSite`).
- Rate limiting on auth, signup, password reset, and any expensive endpoint. Almost never present in vibe-coded projects.
- File uploads: type and size limits, storage location, path handling, whether uploads are served back executable.
- Run the real scanners rather than eyeballing: `npm audit` / `pip-audit` / `cargo audit`, plus `semgrep --config auto` and a secret scanner over full history. Report actual output, and triage it — most CVE noise is transitive and unreachable; say which ones are reachable and why.

# PHASE 2 — DATA AND CORRECTNESS

- **Schema vs. reality.** Compare the migration files, the ORM models, and the live schema. In fast-built projects these three diverge. Note orphaned columns, missing constraints, and tables created by hand.
- Constraints: foreign keys, `NOT NULL`, unique constraints, check constraints, enums. Missing constraints mean the invariants live only in application code that may have three copies.
- Money, quantities, and dates: floats used for currency, timezone handling, naive datetimes, off-by-one in date math, string comparison of dates.
- Concurrency: read-modify-write races, missing transactions around multi-step writes, missing idempotency on payment and webhook handlers (Stripe will retry — will you double-charge?), no optimistic locking where two users edit the same row.
- Error handling: swallowed exceptions, `catch {}`, `catch (e) { console.log(e) }`, errors that return `200 OK`, retries without backoff, retries on non-idempotent operations.
- Failure modes at boundaries: what happens when the third-party API is down, slow, or returns a shape you didn't expect? Is there a timeout on every outbound call? (Usually not.)
- Data loss risks: destructive migrations, `DELETE`/`UPDATE` without `WHERE` guards, cascade deletes nobody intended, no backups, no soft delete on anything a user can nuke.
- Edge cases in core logic: empty collections, nulls, unicode, very large inputs, negative numbers, duplicate submissions.

# PHASE 3 — AI-GENERATED CODE PATHOLOGIES

Look specifically for these. They're the signature of the way this codebase was written, and they don't show up in generic code review checklists.

- **Stubs that fake success.** Functions that return hardcoded values, `return true`, mock data, or empty arrays where real work should happen — sitting in production paths. Grep for `TODO`, `FIXME`, `mock`, `dummy`, `placeholder`, `sample`, `hardcoded`, `for now`.
- **Hallucinated APIs.** Calls to library methods, config keys, or env vars that don't exist in the installed version. Verify against the actual installed package, not your memory of the library.
- **Parallel implementations.** Three different HTTP clients, two date libraries, two auth helpers, `utils.ts` and `helpers.ts` and `lib/utils.ts` with overlapping functions. Different sessions solved the same problem differently. Identify the canonical one.
- **Copy-paste variants that drifted.** Near-identical blocks where one copy got a bug fix and the others didn't. These are latent bugs. Diff them.
- **Lying comments and docs.** Comments and READMEs describing behavior the code doesn't have — often describing an earlier version the agent then rewrote. Verify every claim in the README against the code.
- **Defensive noise.** Try/catch around code that can't throw, null checks on values that are never null, `?.` chains masking real absences, validation of already-validated data. It hides where the real risk is.
- **Over-abstraction for one caller.** Factory/strategy/adapter layers with a single implementation, generic interfaces used once, config systems for values that never change.
- **Dead code.** Unreachable branches, unused exports, unused dependencies, abandoned components, commented-out blocks. Confirm each is truly unreferenced (including dynamic imports and string-based references) before recommending deletion.
- **Type escapes.** `any`, `as unknown as`, `@ts-ignore`, `# type: ignore`, `eslint-disable` — especially at boundaries where types would have caught something real.
- **Config drift.** Env vars read in code but absent from `.env.example`; documented vars nothing reads; different defaults in different files.
- **Version soup.** Dependencies added for one experiment and left in. Two libraries doing the same job. Unpinned versions. Lockfile out of sync with the manifest.

For each pathology found, note whether it's cosmetic or load-bearing. A stub returning fake data on the billing path is P0. An unused `lodash` import is P3.

# PHASE 4 — ARCHITECTURE AND CODE HEALTH

- Layering: is business logic mixed into route handlers, UI components, or database triggers? Where does the actual domain logic live, and is it findable?
- Coupling: modules that import half the codebase, circular imports, god objects, files over ~500 lines that do unrelated things.
- State management on the frontend: server state cached in three places, derived state stored instead of computed, effects triggering effects, missing loading and error states.
- Consistency: naming, file layout, error conventions, API response shapes. Inconsistency here is what makes the codebase feel unmaintainable even when it works.
- Boundaries: is there a clear seam between the app and its external dependencies (DB, model provider, payment processor), or are vendor SDK calls sprinkled through the UI?
- Scoring: for each item use the tech-debt frame — Impact (1–5) × Risk (1–5) × ease of fix — and prioritize accordingly. Don't recommend a rewrite. If you think one is warranted, say so in one paragraph with the reasoning and let the human decide.

# PHASE 5 — TESTS

- What exists, what it covers, and whether it runs. Report real coverage numbers if a tool is available; otherwise say coverage is unmeasured rather than guessing a percentage.
- **Audit the tests themselves.** AI-written test suites are frequently theater: tests with no assertions, tests asserting mocks were called rather than behavior, snapshot tests regenerated whenever they fail, tests that mock the very function under test, `expect(true).toBe(true)`.
- Identify the critical paths with zero coverage: auth, payments, permissions, data mutations, anything irreversible.
- Note flakiness, order dependence, tests that hit live services or real databases, and tests that leave state behind.
- Recommend the minimum viable test set — 10–20 tests that would catch the failures that actually matter — rather than a coverage target.

# PHASE 6 — PERFORMANCE AND SCALE

- N+1 queries, queries inside loops, missing indexes on columns used in `WHERE`/`JOIN`/`ORDER BY`. Check `EXPLAIN` on the slowest realistic query.
- Unbounded reads: endpoints with no pagination, `SELECT *` on large tables, loading whole collections into memory to filter in application code.
- Frontend: bundle size, unoptimized images, render-blocking work, heavy dependencies pulled in for one function, missing memoization in hot render paths.
- Caching: what could be cached and isn't; what is cached and never invalidated.
- Anything O(n²) on user-controllable input size. Any synchronous work that should be a background job (emails, PDFs, model calls, imports).
- Cost, not just latency: per-request model tokens, egress, function invocations, always-on resources. Estimate the monthly bill at 10× current traffic and note what breaks first.

# PHASE 7 — OPERATIONS AND DEPLOYMENT

- Deploy process: reproducible or ritual? Manual steps? Rollback path? What happens if a deploy fails halfway?
- Environments: real separation between prod and dev, or is dev pointed at the production database? (Check. It happens more than you'd think.)
- Observability: structured logging, error tracking, uptime checks, alerts that reach a human. Whether logs contain secrets or PII.
- Migrations: versioned, reversible, tested against a copy of production data.
- Backups: exist, automated, and restore-tested. An untested backup is not a backup.
- CI: does anything run on push? Lint, typecheck, tests, build, security scan. If CI exists but is broken or bypassed, say so.
- Health checks, graceful shutdown, resource limits, single points of failure.

# PHASE 8 — LEGAL, PRIVACY, AND LICENSING

- Dependency licenses incompatible with the project's use (AGPL/GPL in a closed-source product, non-commercial licenses).
- Vendored code, copied snippets, or assets of unclear provenance.
- PII: what's collected, where it's stored, how long it's kept, who can see it, whether it's encrypted at rest, whether deletion actually deletes.
- Compliance obligations implied by the data (GDPR, CCPA, HIPAA, PCI) versus what's implemented. State the gap; don't give legal advice.
- Third-party ToS: scraping, rate limits, model provider usage terms.

# SEVERITY RUBRIC

| | Meaning | Examples |
|---|---|---|
| **P0** | Exploitable now, losing money now, or destroying data now. Fix today. | Exposed prod credentials, IDOR on user data, unauthenticated paid endpoint, no backups on a live DB, double-charging bug |
| **P1** | Serious flaw needing a specific condition, or a bug that will bite within weeks. Fix this sprint. | Missing rate limits on auth, silent data-loss path, no error tracking in prod, untested payment flow |
| **P2** | Real maintenance and reliability cost, no immediate danger. Schedule it. | Duplicated logic that has drifted, missing indexes, no CI, weak test coverage |
| **P3** | Cleanliness and consistency. Do opportunistically. | Naming, dead code, formatting, small refactors |

Rank by expected damage, not by how ugly the code is. A working-but-ugly module outranks nothing; an elegant module with an auth hole outranks everything.

# DELIVERABLE 1 — `AUDIT.md`

Write it to the repo root. Structure:

1. **Executive summary** — 10 sentences maximum, written for the project owner, not for an engineer. What state is this in, what's the single most urgent thing, and can it be trusted with real users right now: yes or no.
2. **System Reality Report** from Phase 0.
3. **Findings table** — ID, severity, area, file:line, one-line description, estimated fix effort (S/M/L).
4. **Detailed findings**, P0 first. Each one: what's wrong, evidence with file:line and minimal code, concrete impact ("any logged-in user can read any other user's invoices by changing the ID in the URL"), how to fix it, and blast radius of the fix.
5. **What's actually good** — be specific and honest. If the data model is sound or the error handling in one module is solid, say so; it tells the owner what to preserve.
6. **Unverified suspicions** — things you couldn't confirm and what access you'd need to confirm them.
7. **Deliberate non-findings** — things that look wrong but are fine, with the reason. Prevents the next reviewer from re-litigating them.

# DELIVERABLE 2 — `FIXPLAN.md`

Ordered, sequenced, dependency-aware. For each fix: finding ID, exact change, files touched, how it will be verified, rollback path, and risk of collateral damage.

Group into:
- **Stop the bleeding** — P0s, minimal diffs, no refactoring.
- **Safety net** — the small set of tests, logging, and CI needed before any structural change is safe. This comes *before* refactoring, always.
- **Structural** — P1/P2 work, sequenced so each step leaves the app working.
- **Hygiene** — P3s, batched, mechanical.
- **Recommend not doing** — findings where the fix costs more than the problem. Say so explicitly.

Then stop and wait for approval. Do not begin fixing.

# FIX PROTOCOL — AFTER APPROVAL ONLY

1. Confirm a clean git state and a working branch. Never work on `main`.
2. **One finding per commit.** No drive-by changes, no reformatting adjacent lines, no "while I was in here." If you spot something new, add it to `AUDIT.md` and keep going.
3. **Write the failing test first** where a test is possible. Watch it fail, make the change, watch it pass. For fixes that can't be tested automatically, write the manual verification steps and run them.
4. After each change: run the test suite, typecheck, lint, and build. If any of these were broken before you started, note the pre-existing baseline so you don't get blamed for it or hide behind it.
5. **Never claim a fix works because the code looks right.** Execute something. Paste the output.
6. Preserve behavior unless the behavior is the bug. If a fix changes an API shape, a URL, or a data format, flag it as breaking and stop for confirmation.
7. If a fix balloons past its estimate or requires touching more than the planned files, stop and report instead of pushing through.
8. Commit messages: what changed, which finding, why. Reference the finding ID.
9. Keep a running `PROGRESS.md`: finding ID, status, commit SHA, verification evidence, anything discovered along the way.

# STOP AND ASK THE HUMAN

Do not proceed without explicit confirmation when:

- A fix requires deleting data, dropping a column, or running a migration on production.
- You found live credentials — the human must rotate them; you must not.
- The fix changes a public API, a URL, or anything an external integration depends on.
- Two findings have conflicting fixes, or a fix requires an architectural decision with no obviously correct answer.
- Fixing something correctly requires a rewrite of a working subsystem.
- You need production access, a real API key, or a paid service to verify something.
- The intended behavior is genuinely ambiguous. Guessing at intent is how vibe-coded bugs got here.

# YOUR OWN FAILURE MODES — AVOID THESE

- Mass-rewriting during the audit phase. You will destroy working behavior nobody documented.
- Reporting scanner output as findings without triage. Raw `npm audit` noise is not an audit.
- Padding the report with P3 style nits so it looks thorough. A 40-item list where 3 items matter is worse than a 5-item list.
- Recommending a framework migration, a monorepo, or a rewrite as the answer to code smells.
- Confusing "different from how I'd write it" with "wrong."
- Deleting code that looks dead but is referenced dynamically, by config, or by a route you didn't map.
- Declaring victory. End with what's still broken, what you skipped, and what you're unsure about.

# FINAL REPORT

When the approved fix list is done, produce:

- What was fixed, with commit SHAs and verification evidence per item.
- What was deliberately not fixed, and why.
- What broke and how you recovered.
- The residual risk list — what a competent attacker would still go after first.
- The three things the owner should do next that are not code: rotate these credentials, set up this alert, test this backup.
- An honest one-line answer to: is this safe to put in front of real users today?
