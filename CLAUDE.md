# CLAUDE.md

## Project
The live website of Dr. Sumya Pervin's dermatology practice in Shyamoli, Dhaka
(`drsumyapervin.com`). Patients read prices and conditions and book at a real
chamber. The doctor's staff use `/admin/` to manage bookings, the gallery and
site copy. Real patients and real patient data, so the rules below are not optional.

## Where things live (open only what the task needs)
| Need | Read |
|---|---|
| Current deploy, verification and owner-action state | `STATUS.md`. Read the top block and the section you need, not the whole stack |
| Architecture, API table, full security rules, deploy steps | `agent.md` |
| Medical facts: credentials, chambers, schedules | `context.md`, plus `functions/lib/schedule.js` for the hours that are enforced |
| Who the site is for, brand commitments, open sign-offs | `PRODUCT.md` |
| Visual system (Nil & Haldi tokens, components, motion) | `DESIGN.md` |
| Anything that needs a person (dashboard clicks, owner content) | `HUMAN-TASKS.md` |
| The *why* behind an old decision | `docs/README.md` (a dated archive that is never kept current) |

## Stack
Static HTML generated from `content/*.mjs`, served by Cloudflare Pages. The API is
Pages Functions (`functions/`) on D1 (SQLite) and R2. JWT admin auth uses `jose`,
with TOTP 2FA. Three standalone Workers live in `workers/` (mailer, digest, probe)
and are deployed separately. Vanilla JS and CSS only, with no framework and no
Tailwind.

## Commands
```bash
npm test                 # Node tests on the Miniflare harness. Must be green before any commit
npm run test:e2e         # Playwright DOM layer (Chromium). Run it for UI and JS changes
npm run build:site       # content/ → public/**/index.html, 404.html, sitemap.xml
npm run dev              # wrangler pages dev public --local. Never use a plain static server
npm run verify:live      # Post-deploy apex check (leaks, headers, API shape). Read-only
```
`npm test` rebuilds `public/` and re-stamps every `<lastmod>` in `public/sitemap.xml`
with today's date. If your change does not touch `content/`, run
`git checkout public/sitemap.xml` before committing.

## Hard rules (detail and history: `agent.md` §3, §5c and §6)
1. **Only `public/` is published.** Never put docs, config, migrations or secrets in it,
   and never widen `pages_build_output_dir`. `tests/exposure.test.mjs` guards this.
2. **Generated pages are never hand-edited.** Edit `content/`, run `npm run build:site`,
   and commit the sources together with the output. Use `/edit-content`.
3. **Secrets are never committed, never put in `wrangler.toml` `[vars]`, and never get
   a fallback default.** Use `npx wrangler pages secret put` (not `wrangler secret put`)
   and `.dev.vars` locally. Fail closed.
4. **No inline event handlers and no `javascript:` URLs, ever.** The CSP drops them
   silently. Use a listener or a `data-` attribute with delegation (`[data-cms-action]` in
   `cms.js`). `tests/headers.test.mjs` enforces this, so do not weaken it.
5. **Escape every interpolation into `innerHTML`**, attributes included. Use
   `escapeHTML` (`admin.js`, bridged into `cms.js`). Booking fields arrive
   unauthenticated, so admin views are not a trusted context.
6. **Never log** a patient name, phone or notes, any PIN or hash, any secret, or a
   Turnstile token (`functions/lib/log.js`, `tests/log.test.mjs`).
7. **Never record, request or echo the admin PIN.** Remote D1 is SELECT-only for agents.
   Hand any mutation to the operator as an exact command.
8. **Deploys are manual and confirmed by the operator.** CI never deploys. Use
   `/deploy-verify`, and never deploy without an explicit go-ahead in this session.
9. **Medical accuracy.** Never change her titles, credentials or chamber details without
   the owner's instruction. Never write "MD". "Assistant Professor" and "BCS (Health)"
   are past roles. Add no unsourced claims such as procedure counts or guaranteed
   results. Never present `clinic.jpg` or `treatment.jpg` as the real practice, and
   never reintroduce her portrait (deleted at her request).
10. **Bangla copy renders only after the doctor approves it** (`content/bn.mjs`
    `approved: true`). Never flip that flag yourself.
11. **The owner's docx is the truth for copy and prices.** It lives in `Change Request/`,
    with an extracted copy in `content/source/website-content.md`. Never hand-edit the
    extracted copy. Re-extract it with `scripts/extract_change_docx.py`.

## Skills (`.claude/skills/`)
- `/edit-content`: change copy, prices or pages through the build pipeline and its gates.
- `/review-round`: run an independent review of a branch or PR and record it in `docs/reviews/`.
- `/deploy-verify`: get the operator's go-ahead, deploy, verify the live apex and record it in `STATUS.md`.

## Traps that have actually bitten here
- A 200 is not a result. A catch-all can return the homepage. Assert on bodies and DOM.
- Cloudflare injects scripts into the **apex** HTML only, never `*.pages.dev`. Check CSP
  changes in the browser console on `https://drsumyapervin.com/` itself.
- Cloudflare cron day-of-week must use names (`SUN-WED,SAT`), not numbers.
- A `.open-booking` selector needs `:visible`. Use `openBookingModal(page)` in e2e.
- Public pages are static. The WhatsApp link, chambers and hours are stamped at build
  time from `content/site.mjs` and `functions/lib/schedule.js`. Saving CMS Settings,
  Site Content or Gallery does **not** change any public page. "Stored" is not "used".

## Conventions
- Commits use `type(scope): subject` (`feat`, `fix`, `docs`, `polish`, `test`), e.g.
  `fix(cards): animate the hover lift`. One logical change per commit.
- The default branch is `master`, not `main`. Work on a branch and open a PR. CI runs
  `npm test` and `npm run test:e2e`.
- Font sizes are in `rem`, and tap targets are at least 44px at phone width. Design
  tokens live in `site.css` `:root`, mirrored verbatim into `style.css`, and a test
  enforces the mirror.
- After any change to deployment or verification state, update `STATUS.md`. Add a
  dated `**Updated:**` block at the top, or replace the top block when it covers the
  same piece of work. Never trim the stack below it.
