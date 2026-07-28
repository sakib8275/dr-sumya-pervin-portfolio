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

```
Portfolio Sumya Pervin/
├── index.html                    # Single-page portfolio (all markup)
├── css/
│   └── style.css                 # CSS design system & component styles
├── js/
│   └── main.js                   # Frontend logic + API fetch calls
├── assets/
│   ├── hero_portrait.jpg
│   ├── clinic.jpg
│   └── treatment.jpg
├── functions/
│   ├── _middleware.js            # CORS + admin seed on every request
│   ├── lib/
│   │   ├── auth.js               # JWT sign/verify, PIN hashing, json helper
│   │   └── db.js                 # Admin seeder (fallback)
│   └── api/
│       ├── auth/
│       │   ├── login.js          # POST: verify PIN, return JWT
│       │   └── check.js          # GET: verify JWT, return auth status
│       ├── appointments/
│       │   ├── index.js          # GET (auth): list, POST: create
│       │   └── [id].js           # PUT (auth): status, DELETE (auth)
│       ├── gallery/
│       │   ├── index.js          # GET: list, POST (auth): create + upload
│       │   └── [id].js           # DELETE (auth): remove from D1 + R2
│       ├── uploads/
│       │   └── [filename].js     # GET: serve images from R2 bucket
│       ├── config.js             # GET/PUT (auth): settings + PIN change
│       └── contact.js            # POST: submit, GET (with secret): list
├── migrations/
│   └── 001_schema.sql            # D1: 4 tables + seed admin PIN
├── wrangler.toml                 # Cloudflare config (D1, R2, env vars)
├── package.json                  # Dependencies (jose for JWT)
├── node_modules/                 # (gitignored)
├── agent.md                      # AI Agent rules & operational guidance
├── AGENTS.md                     # Points to agent.md
├── context.md                    # Domain context, background & site specs
├── AUDIT.md                      # Security & code health audit (Round 1)
├── FIXPLAN.md                    # Round 1 remediation plan — all done
├── UX-AUDIT.md                   # UI/UX audit findings (Round 2)
├── UX-FIXPLAN.md                 # Round 2 remediation plan — all done
├── HANDOFF-2026-07-28.md         # Agent handoff doc
└── vibe-code-audit-prompt.md     # Code audit reference prompt
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
- **Vanilla CSS Priority**: Avoid TailwindCSS or utility frameworks to preserve the custom glassmorphism aesthetic tailored in `css/style.css`.
- **Aesthetic Excellence**: Maintain premium UI visuals—modern typography (Google Fonts Outfit), curated color palettes, subtle glassmorphism cards, micro-animations.
- **No Session State**: Auth is stateless JWT. Token stored in `localStorage` as `cms_token`. Sent as `Authorization: Bearer <token>` header.

### API Overview
All routes prefixed with `/api`. Admin routes verify JWT from `Authorization: Bearer` header. Public routes require no auth.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | No | Login with PIN, returns JWT |
| `/api/auth/check` | GET | No | Verify JWT, returns auth status |
| `/api/appointments` | POST | No | Create booking |
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

# Start dev server
npx wrangler pages dev . --local --port 8788
```

Visit `http://localhost:8788` to see the site with full API functionality.

### Default Admin Credentials
- **PIN**: `talhatheboss` (SHA-256 hashed, stored in D1, change via CMS Settings)

### Environment Variables (set in Cloudflare dashboard)
| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Strong random string for signing JWT tokens |
| `SITE_SECRET` | Access code for viewing contact messages via API |

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

# Deploy
npx wrangler pages deploy .

# Or: connect GitHub repo in Cloudflare Pages dashboard (auto-deploys on push)
```

### Verification Checklist
When making code changes or updates, verify the following:
1. **Responsive Layout**: Test on mobile screen sizes (<375px), tablets (768px), and desktops (1280px+).
2. **Interactive Elements**:
   - Mobile navigation toggle (burger menu) opens and closes smoothly.
   - Modal booking popup triggers correctly from all "Book Appointment" CTA buttons.
   - Smooth scroll anchor links navigate to exact section target offsets.
   - Accordions (FAQ section) open/collapse without layout shifts.
3. **Console Hygiene**: Check browser DevTools console for zero JavaScript errors or missing asset warnings.
4. **Data Integrity**: Verify Dr. Sumya Pervin's qualifications, degrees, chamber locations, and appointment phone numbers remain accurate.
5. **API Tests**: Run `wrangler pages dev` and test all endpoints.

---

## 6. Safety & Preservation Rules

> [!IMPORTANT]
> **Preserve Medical Accuracy**: Never modify Dr. Sumya Pervin's professional titles (`MBBS (SSMC)`, `BCS (Health)`, `DDV (BSMMU)`, `FCPS (Skin & VD)`), official designation (`Assistant Professor`), or chamber details without explicit instruction from the user.

> [!CAUTION]
> **Asset Links**: Do not break image source paths (`assets/hero_portrait.jpg`, `assets/clinic.jpg`, `assets/treatment.jpg`). If adding new images, place them in the `assets/` directory.
