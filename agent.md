# AGENT.MD — AI Agent Guidance & Project Manual

Welcome! This document provides operational guidelines, structural context, and coding standards for AI agents and developers working on the **Dr. Sumya Pervin - Aesthetic Medicine & Dermatology Portfolio** codebase.

---

## 1. Project Overview

- **Project Name**: Dr. Sumya Pervin Portfolio Website
- **Domain**: Medical & Aesthetic Dermatology Specialist Portfolio
- **Target Audience**: Prospective patients in Dhaka, Bangladesh seeking clinical dermatology, cosmetic treatments, and dermatosurgery consultations.
- **Hosting**: Cloudflare Pages + Functions + D1 + R2

---

## 2. Workspace & File Structure

**Everything patient-facing lives in `public/`. Everything else is never published.**
This split is a security boundary, not a style preference — see the rule in §3.

```
Portfolio Sumya Pervin/
├── public/                       # ← THE ONLY PUBLISHED DIRECTORY
│   ├── index.html                # Single-page portfolio (all markup)
│   ├── 404.html                  # Not-found page
│   ├── favicon.svg               # SVG monogram favicon
│   ├── robots.txt                # Allow all + sitemap reference
│   ├── sitemap.xml               # Single-URL sitemap
│   ├── css/
│   │   └── style.css             # CSS design system & component styles
│   ├── js/
│   │   ├── main.js               # Frontend logic + API fetch calls
│   │   └── formguard.js          # Blocking, from <head>: cancels native form submits pre-hydration
│   └── assets/
│       ├── hero_portrait.jpg
│       ├── clinic.jpg
│       └── treatment.jpg
├── functions/                    # Pages Functions — served as routes, not as files
│   ├── _middleware.js            # CORS (scoped to ALLOWED_ORIGIN) + F9 security headers
│   ├── lib/
│   │   ├── auth.js               # JWT sign/verify, PBKDF2 PIN hashing, helpers
│   │   ├── turnstile.js          # Turnstile siteverify, fail-closed
│   │   └── schedule.js           # Chamber schedules, same-day cutoff, slot validation
│   └── api/
│       ├── auth/
│       │   ├── login.js          # POST: verify PIN, return JWT
│       │   └── check.js          # GET: verify JWT, return auth status
│       ├── appointments/
│       │   ├── index.js          # GET (auth): list, POST: create + validate
│       │   └── [id].js           # PUT (auth): status, DELETE (auth)
│       ├── gallery/
│       │   ├── index.js          # GET: list, POST (auth): create + upload
│       │   └── [id].js           # DELETE (auth): remove from D1 + R2
│       ├── uploads/
│       │   └── [filename].js     # GET: serve images from R2 with nosniff
│       ├── config/
│       │   ├── index.js          # GET/PUT (auth): settings + PIN change
│       │   └── public.js         # GET: WhatsApp/Telegram only, no auth
│       └── contact.js            # POST: submit, GET (with secret): list
├── workers/                      # Standalone Workers — deployed separately, NOT part of Pages
│   └── digest/                   # F8: daily per-chamber digest email (cron-only, no fetch handler)
│       ├── index.js              # scheduled() + the send_email transport
│       ├── digest.js             # All logic; pure, imports functions/lib/schedule.js
│       └── wrangler.toml         # Own config: D1 (read-only in practice) + send_email
├── migrations/
│   └── 001_schema.sql            # D1: 4 tables + seeded admin credential
├── tests/                        # Miniflare integration suite — `npm test` (173 tests)
├── scripts/                      # build-test-worker.mjs, generate-pin-seed.mjs
├── docs/                         # DATED ARCHIVE — see docs/README.md; snapshots, never current
│   ├── handoffs/                 # Session logs 2026-07-28 → 2026-08-02
│   ├── audits/                   # Audit rounds 1–3 (1 & 2 superseded pre-migration)
│   ├── prompts/                  # The audit specifications
│   └── SUBAGENT-PLAYBOOK.md      # T7–T12 dispatch rules & harness gotchas
├── wrangler.toml                 # Cloudflare config (D1, R2) — NO SECRETS
├── netlify.toml                  # Fail-closed guard against Netlify redeploy
├── .dev.vars                     # Local secrets (gitignored, never published)
├── package.json                  # Dependencies (jose for JWT)
├── node_modules/                 # (gitignored)
├── STATUS.md                     # LIVING state doc — update on every state change
├── HUMAN-TASKS.md                # Step-by-step guide for dashboard/owner tasks
├── FIXPLAN-2026-08-02.md         # Active execution plan (Phase 1 shipped)
├── agent.md                      # AI Agent rules & operational guidance
├── AGENTS.md                     # Points to agent.md
└── context.md                    # Domain context, background & site specs
```

---

## 3. Technology Stack & Architectural Principles

### Core Stack
1. **HTML5**: Semantic markup (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
2. **CSS3**: Native CSS variables (`:root`), flexbox, grid, glassmorphism UI, smooth transitions, responsive media queries.
3. **JavaScript (ES6+)**: Event delegation, DOM manipulation, modal state management, smooth scrolling, interactive sliders/accordions.
4. **Cloudflare Pages**: Static frontend served at edge.
5. **Cloudflare Pages Functions**: API layer (Hono-style routing via file system).
6. **Cloudflare D1**: Serverless SQLite database.
7. **Cloudflare R2**: Object storage for gallery images.
8. **JWT** (jose library): Stateless admin auth (Bearer token in localStorage).

### Architectural Rules
- **Only `public/` is published.** `pages_build_output_dir = "public"`. Never widen it, and never
  put docs, migrations, config, or secrets inside `public/`. This directory was previously the repo
  root, which served the admin credential and `SITE_SECRET` to the public internet — see the Security
  History section of the handoff. New patient-facing files go in `public/`; everything else stays out.
- **Secrets are never committed and never go in `[vars]`.** `wrangler.toml` `[vars]` ship as plaintext
  and overwrite the dashboard on deploy. Use `wrangler pages secret put` for real deployments and
  `.dev.vars` (gitignored) locally. No code may carry a fallback default for a secret — fail closed.
- **Escape every interpolation into `innerHTML`.** Use the existing `escapeHTML` helper in
  `public/js/main.js`, including inside attributes (`src`, `alt`, `href`). Booking fields reach the
  admin panel from an unauthenticated endpoint, so admin-only views are not a trusted context.
- **No inline event handlers. Ever.** Since F9 the CSP has no `'unsafe-inline'` in `script-src`, so
  an `onclick=` (or any `on*=`) attribute — in markup *or* in an HTML string built by JS — is
  dropped **silently**: no console error a patient sees, no failed request, no failing test. The
  control simply stops working. Use a listener, or a `data-` attribute plus a delegated listener
  (`[data-cms-action]` in `main.js` is the pattern). `javascript:` URLs are blocked the same way.
  `tests/headers.test.mjs` scans `public/` and fails if one reappears — do not weaken that test.
- **Validate at the API boundary**, not just in the form. Anything reachable without a token must
  assume hostile input.
- **Vanilla CSS Priority**: Avoid TailwindCSS or utility frameworks to preserve the custom glassmorphism aesthetic tailored in `public/css/style.css`.
- **Aesthetic Excellence**: Maintain premium UI visuals—modern typography (Google Fonts Outfit), curated color palettes, subtle glassmorphism cards, micro-animations.
- **No Session State**: Auth is stateless JWT. Token stored in `localStorage` as `cms_token`. Sent as `Authorization: Bearer <token>` header.

### API Overview
All routes prefixed with `/api`. Admin routes verify JWT from `Authorization: Bearer` header. Public routes require no auth.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | No | Login with PIN, returns JWT |
| `/api/auth/check` | GET | No | Verify JWT, returns auth status |
| `/api/appointments` | POST | No | Create booking (Turnstile + schedule rules: listed chambers only, consultation days only, same-day closes 30 min before start; duplicate phone+chamber+date → 409) |
| `/api/appointments` | GET | JWT | List bookings |
| `/api/appointments/:id` | PUT | JWT | Update status |
| `/api/appointments/:id` | DELETE | JWT | Delete booking |
| `/api/gallery` | GET | No | List gallery |
| `/api/gallery` | POST | JWT | Add gallery item (JSON or multipart) |
| `/api/gallery/:id` | DELETE | JWT | Delete gallery item (+ R2 cleanup) |
| `/api/uploads/:filename` | GET | No | Serve gallery image from R2 |
| `/api/config` | GET | JWT | Get settings |
| `/api/config` | PUT | JWT | Update settings/PIN |
| `/api/contact` | POST | No | Contact form |
| `/api/contact?from=secret` | GET | Secret | List messages |

---

## 4. Coding Standards & Best Practices

### HTML Standards
- Maintain clean semantic structure and proper heading hierarchy (`h1` -> `h2` -> `h3`).
- Include explicit `id` attributes on key sections for navigation anchors (`#top`, `#about`, `#chambers`, `#services`, `#results`, `#faq`, `#book`).
- Include `alt` attributes on all images for accessibility.
- Keep interactive button IDs and modal trigger classes distinct and functional.

### CSS Standards
- Define re-usable design tokens (colors, spacing, font weights, border radiuses) in `css/style.css`.
- Use relative units (`rem`, `em`, `%`, `vw`/`vh`) for scalable typography and layout bounds.
- Maintain responsive breakpoints (Mobile: `<768px`, Tablet: `768px-1024px`, Desktop: `>1024px`).
- Preserve glassmorphism styles (`backdrop-filter: blur()`, semi-transparent border/background combinations).

### JavaScript Standards
- Write modular, clean ES6 functions in `js/main.js`.
- Avoid global variable pollution by wrapping script execution or using `DOMContentLoaded` event listeners.
- Gracefully check for element presence before adding event listeners to prevent runtime errors.
- Ensure keyboard accessibility for interactive controls (e.g., closing modals with `Escape` key, focus trapping).
- Use the `api()` helper function for all server calls — it auto-attaches `Authorization: Bearer` from `localStorage`.

### Functions Standards (Cloudflare Pages Functions)
- Each function exports `onRequestGet`, `onRequestPost`, `onRequestPut`, `onRequestDelete` as appropriate.
- D1 binding accessed via `context.env.DB`.
- R2 binding accessed via `context.env.GALLERY_BUCKET`.
- Import `{ json }` from `../../lib/auth.js` for JSON responses.
- Import `{ requireAuth }` from `../../lib/auth.js` for protected routes.
- Use `crypto.randomUUID().slice(0, 8)` for short IDs instead of `uuid` package.
- JWT token payload: `{ authenticated: true }`, expiration: 24h.

---

## 5. Development & Verification Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run D1 migration locally (first time only)
npx wrangler d1 execute dr-sumya-pervin-db --local --file=migrations/001_schema.sql

# Create .dev.vars (gitignored) with JWT_SECRET, SITE_SECRET, ALLOWED_ORIGIN.
# Without JWT_SECRET, login returns 500 by design — there is no fallback.

# Start dev server — note the "public" argument, not "."
npx wrangler pages dev public --local --port 8788
```

Visit `http://localhost:8788` to see the site with full API functionality.

Never serve this project with a plain static server (`python3 -m http.server`, `npx serve`).
Those cannot run Pages Functions, so every `/api/*` route 404s and the site appears broken in
ways that are not real — and if pointed at the repo root they publish the migration and config
files. One such server was found running on the LAN and was the second half of the credential
exposure recorded in the handoff.

### Admin Credentials
The PIN is **not recorded in this repository**, by design. It is PBKDF2-SHA256 hashed with a
per-install salt in `admin_settings`, seeded by `migrations/001_schema.sql`, and held by the
practice. Change it via CMS Settings (requires the current PIN, minimum 8 characters). If it is
lost, reseed the row with a freshly generated hash and salt — do not add a default.

### Environment Variables
Set with `npx wrangler pages secret put <NAME>` (Pages), or `.dev.vars` locally.
**`wrangler secret put` without `pages` is the Workers command and silently does nothing here.**

| Variable | Kind | Description |
|----------|------|-------------|
| `JWT_SECRET` | secret | Strong random string for signing JWT tokens. No fallback — unset means login 500s. |
| `SITE_SECRET` | secret | Access code for viewing contact messages via API. No fallback. |
| `ALLOWED_ORIGIN` | var | Site origin allowed through CORS. Safe to keep in `wrangler.toml`. |

### Deploy to Production
```bash
# Authenticate
npx wrangler login

# Create D1 database (first time only)
npx wrangler d1 create dr-sumya-pervin-db

# Create R2 bucket (first time only)
npx wrangler r2 bucket create dr-sumya-gallery

# Update wrangler.toml with the D1 database_id from output above

# Run migration
npx wrangler d1 execute dr-sumya-pervin-db --remote --file=migrations/001_schema.sql

# Set secrets — "pages secret", not "secret"
npx wrangler pages secret put JWT_SECRET
npx wrangler pages secret put SITE_SECRET

# Deploy — publishes public/ per wrangler.toml
npx wrangler pages deploy

# Then confirm the repo root is NOT reachable:
#   curl -s -o /dev/null -w "%{http_code}\n" https://drsumyapervin.com/migrations/001_schema.sql
#   curl -s -o /dev/null -w "%{http_code}\n" https://drsumyapervin.com/wrangler.toml
# Both must be 404. Check the response body too, not just the status code —
# a catch-all can return 200 with the homepage and mask a real leak.

# Or: connect GitHub repo in Cloudflare Pages dashboard (auto-deploys on push)
```

### Security headers (F9) — `functions/_middleware.js`

The root `functions/_middleware.js` runs for **static assets as well as API routes**,
which is how these headers reach the HTML. It sets, on every response:

| Header | Value / note |
|---|---|
| `Content-Security-Policy` | `script-src 'self' 'nonce-<per-request>' challenges.cloudflare.com static.cloudflareinsights.com`; `frame-src` Turnstile; `style-src` keeps `'unsafe-inline'`; `img-src 'self' https: data:`; `object-src 'none'`; `base-uri`/`form-action 'self'`; `frame-ancestors 'none'` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`, **no `preload`** |
| `Permissions-Policy` | denies accelerometer, camera, geolocation, gyroscope, magnetometer, microphone, payment, usb |
| `X-Frame-Options` / `X-Content-Type-Options` / `Referrer-Policy` | `DENY` / `nosniff` / `strict-origin-when-cross-origin` |

Three things to know before touching it:

> [!CAUTION]
> **`script-src` has no `'unsafe-inline'`, and that breaks inline handlers silently.**
> See the rule in §3. This is why F9 removed all 12 `on*=` attributes *before* the
> header shipped, and why the order matters if you ever re-do this work.

> [!WARNING]
> **The nonce is not for anything in this repo.** Every script we ship is external
> and matches `'self'`. Cloudflare's zone injects two scripts into the **apex** HTML
> that this repo does not contain: **JavaScript Detections** (inline; its body carries
> a per-request ray id, so no CSP hash can ever match it, and Bot Fight Mode makes it
> non-disableable) and the **Web Analytics beacon** from `static.cloudflareinsights.com`.
> Cloudflare's CDN parses our CSP response header and stamps our nonce onto the script
> it injects — that is the documented fix and it is verified working. Keep the nonce
> fresh per request; a fixed one is `'unsafe-inline'` wearing a hat.

> [!IMPORTANT]
> **Neither injected script appears on `*.pages.dev`.** The apex is HTML-rewritten by
> the zone and the preview host is not, so a CSP that passes every local and preview
> check can still break on the apex. **Always re-check the browser console on
> `https://drsumyapervin.com/` itself after a header change** — F9's first deploy was
> clean everywhere except the one place that counts.

`connect-src`, `font-src` and `default-src` are deliberately **unset**. Turnstile makes
its own network requests, including to `*.challenges.cloudflare.com` subdomains that
Cloudflare documents as normal, and a `connect-src` that misses one fails every booking
with a 403 indistinguishable from the system working.

### The digest Worker (F8) — deployed separately

`workers/digest/` is a standalone Worker, not part of the Pages project. It is
cron-only (no fetch handler, no routes) and reads D1; it must never be able to
touch the booking path. Deploy it from its own directory so the root
`wrangler.toml` is not picked up:

```bash
cd workers/digest && npx wrangler deploy
```

Its crons are derived from `functions/lib/schedule.js`, not hand-written:
`tests/digest.test.mjs` fails if `workers/digest/wrangler.toml` and that
derivation disagree. Change a chamber's hours in `schedule.js`, run `npm test`,
and copy the crons it demands.

> [!WARNING]
> **Cloudflare cron day-of-week must be NAMES, not numbers.** `30 8 * * 0-3,6`
> and `30 8 * * 0,1,2,3,6` are both rejected with `10100: invalid cron string`;
> `30 8 * * SUN-WED,SAT` is accepted. Verified against the schedules API on
> 2026-08-03. Standard-cron intuition does not apply, and `wrangler deploy`
> uploads the Worker successfully and *then* fails the trigger step — so a
> half-deployed Worker with no schedule is the failure mode to watch for.

Email is gated on human dashboard work (HUMAN-TASKS Task 13): Email Routing
enabled on the zone, a **verified** destination inbox, and the `digest@` sender.
All three were completed on 2026-08-03. Until `DIGEST_TO` is set in its
`wrangler.toml`, the Worker logs "not configured" at each cutoff and sends
nothing; if it points at an *unverified* address, every send fails with
`2054: destination address is not verified`, which `runDigest` logs as
`send-failed`.

> [!IMPORTANT]
> **Keep `[observability]` enabled on this Worker.** It has no fetch handler and
> its only output is an email that leaves the system, so with logs off it has no
> observable surface at all: "the cron never fired", "it ran and correctly had
> nothing to report", and "it ran and the send failed" are **the same
> observation** — no email. Because production D1 is frequently empty, the quiet
> case is also the common one, so silence proves nothing either way.
> `head_sampling_rate = 1` is right here; two invocations a day is nothing to
> sample. Judge a run from the logs, never from the inbox — and note that the
> recipient mailbox belongs to the owner and is not readable by an agent.

### Verification Checklist
When making code changes or updates, verify the following:
1. **Responsive Layout**: Test on mobile screen sizes (<375px), tablets (768px), and desktops (1280px+).
2. **Interactive Elements**:
   - Mobile navigation toggle (burger menu) opens and closes smoothly.
   - Modal booking popup triggers correctly from all "Book Appointment" CTA buttons.
   - Smooth scroll anchor links navigate to exact section target offsets.
   - Accordions (FAQ section) open/collapse without layout shifts.
3. **Console Hygiene**: Check browser DevTools console for zero JavaScript errors or missing asset
   warnings — **on the apex, not only locally or on `pages.dev`** — and specifically for
   `Refused to …` / `violates the following Content Security Policy directive` lines. Turnstile's
   own iframe emits harmless WebGL and font warnings from `challenges.cloudflare.com`; filter those
   out rather than chasing them.
4. **Data Integrity**: Verify Dr. Sumya Pervin's qualifications, degrees, chamber locations, and appointment phone numbers remain accurate.
5. **API Tests**: `npm test` — the 191-test suite (Miniflare integration against the real
   compiled worker, real D1/R2, stubbed siteverify; plus the pure schedule, digest and
   security-header units) must be green before any deploy; then spot-check against
   `wrangler pages dev public --local`.

   `wrangler pages dev` starts with an **unmigrated** local D1, so `/api/gallery` and
   `/api/config/public` 500 until you run
   `npx wrangler d1 execute dr-sumya-pervin-db --local --file=migrations/001_schema.sql`.
   That looks like a broken API and is not one.

---

## 6. Safety & Preservation Rules

> [!IMPORTANT]
> **Preserve Medical Accuracy**: Never modify Dr. Sumya Pervin's professional titles (`MBBS (SSMC)`, `BCS (Health)`, `DDV (BSMMU)`, `FCPS (Skin & VD)`), official designation (`Assistant Professor`), or chamber details without explicit instruction from the user.

> [!CAUTION]
> **Asset Links**: Do not break image source paths (`assets/hero_portrait.jpg`, `assets/clinic.jpg`, `assets/treatment.jpg`). If adding new images, place them in the `assets/` directory.
