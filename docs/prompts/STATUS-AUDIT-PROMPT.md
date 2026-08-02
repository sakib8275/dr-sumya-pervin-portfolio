# STATUS AUDIT PROMPT — Dr. Sumya Pervin Portfolio

Copy the block below into a fresh agent session (Claude Code / opencode) started in this
repo's root. It produces an evidence-based status report and a prioritized launch plan.
Keep this file OUTSIDE `public/` — only `public/` is ever published.

---

```
# PROJECT STATUS & LAUNCH-READINESS AUDIT — Dr. Sumya Pervin Portfolio

You are a senior engineer and launch consultant acting on the repo at
/home/kitahara-poposagain/Desktop/Portfolio Sumya Pervin (branch: master).

Your job is READ-ONLY reconnaissance that produces one evidence-based report: current
status, what's genuinely done vs. claimed, what's remaining, what would make this
robust/excellent/live, and a prioritized execution plan. Do not modify files, deploy,
write to D1, or print secret values. This is an audit; produce a report, not changes.

## 1. Mandatory reading order (summarize findings from each)
- HANDOFF-2026-08-02.md            # LATEST. Supersedes 07-31 v5 for the items it names
- HANDOFF-2026-07-31-v5.md / v4 / v3   # Turnstile evidence, leaked-token investigation, WhatsApp inputtable
- agent.md and AGENTS.md           # architecture, security rules, deploy + verify checklist
- context.md                       # domain/medical claims and "what's outstanding" notes
- AUDIT-ROUND-3.md, UX-AUDIT.md    # prior audits; check which items are still open
- wrangler.toml, netlify.toml, package.json, migrations/001_schema.sql

## 2. Establish ground truth (run, don't assume)
- git status, git log --oneline -25, git remote -v
- ls/find on public/, functions/, tests/, scripts/; note any stray large files (e.g. the
  11 MB root screenshot PNG) and any file that must not be published
- npm test  (128 integration tests via Miniflare — must all pass from a clean state)
- node --check on public/js/main.js; grep main.js for api() call sites vs the routes in
  functions/ to confirm the two route mismatches fixed on 2026-08-02 are truly gone
- If token access exists, list Cloudflare pages projects / D1 / R2 / custom domains —
  but NEVER print or echo any token or secret value
- curl production and drsumyapervin.com if reachable; a status code alone is not a
  result — inspect response bodies

## 3. Report sections — be specific, cite files/lines, mark VERIFIED / UNVERIFIED / OPEN

### A. Current status
What is built and deployed (production deployment, custom domain status), test suite
state, what is verified in a browser vs. only by tests, what is unexercised.

### B. What's remaining — verify each named open item and add any you discover
- WhatsApp/Telegram empty in production → booking confirmations link nowhere (CMS data entry)
- drsumyapervin.com custom domain NOT attached; zone exists at Cloudflare, no records
- Turnstile hostnames: apex vs www handling; widget render risk on live hostname
  (fail-closed → every booking 403s)
- T5: WAF rate-limit on POST /api/auth/login (only possible once on the custom domain)
- T8: "1500+ procedures" medical-advertising claim — source it or remove it
- T10 accessibility (WCAG: semantic HTML, keyboard, focus, contrast, labels, alt text)
- T11 booking notification to the doctor (nothing notifies her today)
- T12 housekeeping (11 MB screenshot PNG in repo root; netlify.toml — keep or delete?)
- Gallery R2/D1 orphan: R2 put happens before D1 insert — compensating delete needed
- Import-path bug: main.js ~line 1032 still sends image_path 'assets/clinic.jpg' for
  JSON-imported gallery items, silently swallowed by catch — same defect class as the two fixed
- Leaked Turnstile token (id b17d8b1322d3a80ddeebb36d76ae8ba5) — confirm deletion/reclassification
- Browser/DOM test layer gap (Playwright): booking submit pointer-click, XSS render path,
  booking-failure UI state, WhatsApp CTA gating, pre-hydration submit guard

### C. Possible improvements (prioritized: impact / effort / risk)
- Reliability: D1 backups + export/restore runbook, D1 query retries, upload orphan cleanup
- Security hardening: security headers (CSP, X-Content-Type-Options, etc.) via
  _middleware, honeypot + rate-limit on /api/contact, D1 auth query timing, token hygiene
- SEO/OG: meta description, canonical + og:url (blocked until domain resolves), JSON-LD
  (Physician schema), sitemap.xml, robots.txt, favicon, Open Graph image, 404 page check
- Performance: image compression/WebP, lazy-loading gallery, preload hero, caching
  headers for static assets, minification (only if it preserves the vanilla CSS/JS approach)
- Content correctness: verify every degree/credential/chamber/phone against context.md;
  flag anything unverified before launch
- Ops: CI/CD via GitHub Actions (test gate → deploy), staging/deploy-preview, uptime
  monitoring, structured logging for D1 writes, contact/booking dashboard
- DX: docs for running the CMS, PIN rotation runbook, incident/rollback runbook
  (rollback target d3a4d921)

### D. Making it LIVE — end-to-end runbook for drsumyapervin.com
Produce ordered, exact steps and a verify-after-each check: attach custom domain in
dashboard, wait for cert Active, add apex + www to Turnstile hostnames, decide www
(prefer 301 Redirect Rule vs redeploy), SSL/TLS Full (strict) + Always Use HTTPS, enable
WAF rate-limit on login, final smoke tests (one real anonymous browser booking → 201 +
ref, then clean the row), and rollback plan if a booking 403s. Flag every step that needs
a human in the dashboard vs. what an agent can do.

### E. Anything else you'd add to make it "excellent and live"
Your judgment call — keep it grounded in this repo, not generic boilerplate.

## 4. Output format
A single markdown report titled "STATUS-2026-08-02.md" content (do NOT write the file,
just emit it), containing:
1. One-line verdict
2. Status summary table (Area | State | Evidence)
3. Blockers to going live (must-fix vs should-fix vs nice-to-have)
4. Prioritized action plan: P0/P1/P2 with effort + risk + who (agent vs human-dashboard)
5. Open questions for the practice owner (content, WhatsApp/Telegram number, claim sourcing)

## 5. Hard rules
- Read-only. No deploys, no remote D1 writes, no secret printing, no file edits.
- A status code is not a result — verify bodies and side effects.
- If CLOUDFLARE_API_TOKEN is set in the environment, note it but never print its value;
  if you must run wrangler, guard against leaking it in logs.
- Do not trust prior handoffs on face value: re-verify anything that changed the security
  surface (domains, hostnames, vars, tokens).
```
