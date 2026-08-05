# HANDOFF — Self-Service CMS: Password (PIN) Reset + TOTP 2FA + Site-Content Editing

**Repo:** `/home/kitahara-poposagain/Desktop/Portfolio Sumya Pervin`
**Branch:** `master` (remote `origin` = `sakib8275/dr-sumya-pervin-portfolio`). HEAD at plan time: `654f7f0`.
**Wrangler:** local 4.118.0, logged in as `nazmus8275@gmail.com` (account `344944edcc6fbef4ea774a50d044aebc`).
**Test baseline before this work:** `npm test` → **217 pass / 0 fail** (probe F11 work landed and is green).

## Locked decisions (user, 2026-08-05)
1. 2FA = **TOTP authenticator app** (Google Authenticator / Authy).
2. Reset email = **`dr.enamtalha@gmail.com`** (only Email-Routing-verified destination; digest + probe already send to it). Make it editable in Settings later.
3. Lost-phone recovery = **email password reset also clears 2FA** (logged).
4. Enrollment QR = **vendored `qrcode` UMD** at `public/js/vendor/qrcode.min.js` (no build step; CSP `'self'`-safe).
5. Site-content editing = **in the same build**.
6. Editable sections: **hero, about, chamber cards, services list, section headings + band text. Quiz stays static.**
7. Rich text = **light** (bold/italic/lists only).
8. Sessions stay **24h** (no "remember device").

## Verified facts the implementing agent may rely on (do not re-derive)
- **Pages project** `dr-sumya-pervin-portfolio`; root `wrangler.toml`: `pages_build_output_dir = "public"`, `compatibility_date = "2026-07-29"`.
- **D1** `dr-sumya-pervin-db` (id `d2ce7968-38ce-4329-86a9-b60d3b48f414`, binding `DB`); **R2** `dr-sumya-gallery` (binding `GALLERY_BUCKET`). Tables live: `admin_settings`, `appointments`, `gallery`, `contact_messages`, `uptime_state`.
- **Secrets (Pages):** `JWT_SECRET`, `SITE_SECRET`, `TURNSTILE_SECRET` via `wrangler pages secret put`. **Vars:** `ALLOWED_ORIGIN = "https://drsumyapervin.com"`, `TURNSTILE_HOSTNAMES = "dr-sumya-pervin-portfolio.pages.dev,drsumyapervin.com,www.drsumyapervin.com"`. Local secrets in gitignored `.dev.vars`.
- **Auth lib** `functions/lib/auth.js`: `hashPin(pin, saltHex)` (PBKDF2-SHA256, 100k iter, 16-byte hex salt), `newSalt()`, `safeEqual(a,b)`, `signToken(env)` → HS256 JWT `{authenticated:true}` exp **24h**, `verifyToken(request, env)`, `requireAuth(request, env)`, `readJson`, `json`. `jose` is the only runtime dep.
- **Turnstile** `functions/lib/turnstile.js` `verifyTurnstile(context, action, token)`; sitekey `0x4AAAAAAEClxf8-TRYoLcZl` hardcoded in `main.js` (~line 861). Login runs Turnstile **before** PIN.
- **Email:** `workers/lib/email.js` → `buildMimeMessage({from,to,subject,body,now,messageId})`, `rfc5322Date`. Transport pattern (digest `workers/digest/index.js`): `env.EMAIL.send(new EmailMessage(from,to,raw))`, fallback `env.EMAIL.send({from,to,subject,text:body})`. **`cloudflare:email` imports only work inside workerd** — transport must stay in worker `index.js`, logic in a plain module.
- **Email config:** sender `digest@drsumyapervin.com`, destination `dr.enamtalha@gmail.com` (verified). Probe worker `dr-sumya-probe` deployed `c7d0aced` (2026-08-05 15:30 UTC), cron `*/30 * * * *`, `workers_dev=false`.
- **Pages Functions CANNOT use `send_email`.** Pages **DO support Service bindings** (`env.MAILER.fetch(request)`), configured via root `wrangler.toml` `[[services]]` or dashboard (docs Jun 2026).
- **Tests:** `npm test` = `node --test tests/*.test.mjs`; `pretest` builds `.test-build/worker/index.js` via `scripts/build-test-worker.mjs` (`wrangler pages functions build`). Harness `tests/helpers/harness.mjs`: `createHarness(options)` → Miniflare with `d1Databases:{DB}`, `r2Buckets:{GALLERY_BUCKET}`, `serviceBindings:{ASSETS:serveAsset}`, `outboundService:makeSiteverify()`, `bindings:{JWT_SECRET,SITE_SECRET,TURNSTILE_SECRET,TURNSTILE_HOSTNAMES,ALLOWED_ORIGIN,...options.bindings}`; seeds `TEST_PIN='test-pin-12345'`. API: `h.anon/h.asAdmin/h.withToken/h.db/h.mf`, `h.adminToken`. `tokens.good('login')` etc. **Harness `migrate()` currently applies ONLY `migrations/001_schema.sql` — must be updated to apply all migrations in filename order (001, 002, 003).**
- **Frontend** `public/js/main.js` (~1331 lines, plain script, no modules). CMS ids: `cmsPinInput`, `submitPinBtn`, `pinError`, `cmsAuthSection`, `cmsMainSection`, Turnstile mounts `turnstileLogin`/`turnstileBooking`, `localStorage 'cms_token'`, `api()`, `setToken()`, `turnstileReset('login')`. Tabs `.cms-tab-btn[data-tab]` / `.cms-tab-content`. Gallery upload: `photoFileInput`, `uploadZone`, `uploadForm`, `photoTitle`, `photoCategory`, `uploadPreview`.
- **index.html sections:** hero (h1 ~L90, p ~L91), about `#about` (~L112, `.sec-head` + 3 `.stat`), chambers `#chambers` (~L143, 2 `.chamber-card`), quiz `#quiz` (~L176, **keep as-is**), results band `.band` (~L220), results `#results` (~L235), gallery `#gallery` (~L274), services `#services` (~L297, `#svcGrid` with `.svc` cards `role="button" tabindex="0"` — modal behavior; reuse existing delegation in main.js).
- **CSP is strict:** `script-src 'self' 'nonce-<uuid>' https://challenges.cloudflare.com https://static.cloudflareinsights.com`; no `'unsafe-inline'` for scripts; external scripts only; **no `on*` attributes in HTML generated from JS** (F9 rule, see `functions/_middleware.js` comments).
- **Uptime probe** asserts the JSON shape of `/api/config/public` only (`{whatsapp, telegram}`) — do not change that route.
- Logs: `functions/lib/log.js` `loggedWrite(event, fields, fn)` / `logWrite`; redacts env secrets + Turnstile tokens.

---

## Part A — Password (PIN) reset + TOTP 2FA

### A1. Migration — `migrations/003_self_service.sql` (new)
```sql
ALTER TABLE admin_settings ADD COLUMN admin_email TEXT DEFAULT '';
ALTER TABLE admin_settings ADD COLUMN totp_secret TEXT DEFAULT '';
ALTER TABLE admin_settings ADD COLUMN totp_enabled INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS twofa_challenges (
  challenge_id TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);
```
Operator seed (after applying): `npx wrangler d1 execute dr-sumya-pervin-db --remote --command "UPDATE admin_settings SET admin_email='dr.enamtalha@gmail.com' WHERE id=1"`.

### A2. New lib — `functions/lib/totp.js` (pure, WebCrypto, NO new dep)
- RFC 4648 base32 **decode** (A–Z, 2–7, case-insensitive, ignore spaces/padding).
- `generateTotpSecret()` → 20 random bytes → base32 string.
- `totp(secretBase32, { timeStep = 30, digits = 6, time = Date.now()/1000 })` → HMAC-SHA1 (`crypto.subtle.importKey('raw', keyBytes, {name:'HMAC', hash:'SHA-1'}, false, ['sign'])`), counter = `Math.floor(time/30)`, 8-byte big-endian, dynamic truncation, mod `10^digits`, zero-padded.
- `verifyTotp(secretBase32, code, { window = 1, time })` → boolean over steps `t-window..t+window`.
- `totpUri(label, secret, { issuer })` → `otpauth://totp/<label>?secret=<secret>&issuer=<issuer>&algorithm=SHA1&digits=6&period=30` (URL-encode label/issuer).

### A3. New lib — `functions/lib/reset.js`
- `newResetToken()` → 32 random bytes → hex (64 chars, URL-safe).
- `hashToken(token)` → SHA-256 hex (`crypto.subtle.digest`).
- `resetExpiry(minutes = 30)` → SQLite string via `datetime('now', '+30 minutes')` (caller binds); `isExpired(expiresAt, now = new Date())` for tests.

### A4. New endpoint — `functions/api/auth/forgot-password.js` (POST)
- Order: Turnstile (`action 'forgot-password'`) → `readJson` → validate `email` is a string + basic email regex.
- Read `admin_settings` row (`admin_email`).
- **Always return** `json({ success: true, message: 'If that address matches the CMS account, a reset link is on its way.' })` — never distinguish match/no-match (no enumeration oracle).
- If `admin_email` set and `email` equals it (case-insensitive):
  1. Throttle: `SELECT created_at FROM password_resets ORDER BY created_at DESC LIMIT 1`; if within **60 s**, skip minting/sending (still generic 200).
  2. Mint: `token = newResetToken()`; insert `(hashToken(token), datetime('now','+30 minutes'))`.
  3. Reset URL = `${new URL(request.url).origin}/#reset?token=${token}`.
  4. Send via `env.MAILER.fetch('https://mailer.internal/send', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Mail-Secret': env.MAIL_SECRET }, body: JSON.stringify({ to: admin_email, subject: 'Reset your CMS password', body: <plain text with the URL + "valid 30 minutes" note> }) })`. On throw/non-OK → `logWrite('auth.reset_send_failure', { status })` and still return generic 200.
- `loggedWrite('auth.forgot_request', { minted: <bool> })` — **never log the email, token, or URL.**

### A5. New endpoint — `functions/api/auth/reset-password.js` (POST)
- Turnstile (`action 'reset-password'`) → `readJson` → `{ token, new_pin }`.
- Validate `new_pin`: string, length ≥ 8 (`MIN_PIN_LENGTH`). Else 400.
- `SELECT * FROM password_resets WHERE token_hash = ?` (`hashToken(token)`). Missing / `used_at IS NOT NULL` / expired → **one generic message** `'This reset link is invalid or has expired.'` (no oracle).
- Success path (use `DB.batch([...])` for atomicity):
  - `UPDATE password_resets SET used_at = datetime('now') WHERE token_hash = ?`
  - `UPDATE admin_settings SET pin_hash = ?, pin_salt = ?, totp_secret = '', totp_enabled = 0, updated_at = datetime('now') WHERE id = 1` (fresh salt via `newSalt()`; **clears 2FA** per decision).
- `loggedWrite('auth.reset', { pin_rotated: true, twofa_cleared: true })`.
- Return `{ success: true, message: 'Password updated. Please log in.' }`.

### A6. Modify — `functions/lib/auth.js`
- `signToken(env)`: payload → `{ authenticated: true, twofa: true }` (still HS256, 24h). Harness `adminToken` picks this up automatically.
- `requireAuth(request, env)`: after `verifyToken`, additionally require `payload.authenticated === true && payload.twofa === true`; else 401.
- Add `signChallengeToken(env, { challenge })` → HS256, **5-min** expiry, payload `{ pending_2fa: true, challenge }` (**no** `authenticated`, **no** `twofa`).
- Add `verifyChallengeToken(request, env)` → payload or null.

### A7. Modify — `functions/api/auth/login.js`
- Keep Turnstile-first + PIN checks identical (all existing `auth.test.mjs` cases must pass unchanged — harness 2FA is off by default).
- After PIN passes: read `totp_enabled`.
  - `1` → `challengeId = crypto.randomUUID()`; `INSERT INTO twofa_challenges (challenge_id, attempts) VALUES (?, 0)`; return `{ success: true, pending_2fa: true, challenge: signChallengeToken(env, { challenge: challengeId }) }`.
  - `0` → return `{ success: true, token }` exactly as today.

### A8. New endpoint — `functions/api/auth/2fa/verify.js` (POST)
- `{ challenge, code }`; `verifyChallengeToken`; 401 if invalid.
- Look up challenge row; missing → 401 `'Session expired. Please log in again.'`; `attempts >= 5` → delete row, 401 `'Too many attempts. Please log in again.'`.
- Read `totp_secret`/`totp_enabled`; if not enabled → 401.
- `verifyTotp(totp_secret, code)` fails → `UPDATE ... SET attempts = attempts + 1`, 401 `'Invalid code.'`.
- Passes → delete challenge row, mint `signToken(env)`, return `{ success: true, token }`.

### A9. New endpoints — 2FA enrollment (all auth-required)
- `GET /api/auth/2fa/status` → `{ enabled: !!totp_enabled }`.
- `POST /api/auth/2fa/setup` → generate secret, **store into `totp_secret` now but leave `totp_enabled = 0`** (pending), return `{ secret, otpauth_uri }` (via `totpUri`). `loggedWrite('auth.twofa.setup_initiated')`.
- `POST /api/auth/2fa/verify-setup` → `{ code }`; if `verifyTotp(totp_secret, code)` → `UPDATE admin_settings SET totp_enabled = 1, updated_at = datetime('now')`, `loggedWrite('auth.twofa.enabled')`, `{ success: true }`; else 400 `'Invalid code.'`.
- `POST /api/auth/2fa/disable` → `{ current_pin, code }`; require `safeEqual(hashPin(current_pin, salt), stored_hash)` **and** `verifyTotp(totp_secret, code)`; clear `totp_secret = ''`, `totp_enabled = 0`; `loggedWrite('auth.twofa.disabled')`; else generic 400/401.

### A10. New mailer Worker — `workers/mailer/`
- `wrangler.toml`: `name = "dr-sumya-mailer"`, `compatibility_date = "2026-07-29"`, `workers_dev = false`, `[[send_email]] name = "EMAIL" destination_address = "dr.enamtalha@gmail.com"`, `[vars] MAIL_FROM = "digest@drsumyapervin.com"`. `MAIL_SECRET` via `wrangler secret put MAIL_SECRET` (worker-level), **not** in toml.
- `mailer.js` (pure, testable in node): `handle(env, request)` → validates method POST, `X-Mail-Secret` header vs `env.MAIL_SECRET` (via `safeEqual`), body `{to, subject, body}`; reject `to !== 'dr.enamtalha@gmail.com'`; returns `{ ok:true, raw: buildMimeMessage({from: env.MAIL_FROM, to, subject, body}) }` or `{ ok:false, status, error }`.
- `index.js` (thin, workerd-only): `export default { async fetch(request, env) { ... } }` — calls `mailer.js` `handle`, then `env.EMAIL.send(new EmailMessage(from, to, raw))` with the digest's object-form fallback. Copy the try/fallback pattern from `workers/digest/index.js`.

### A11. Pages wiring — root `wrangler.toml`
```
[[services]]
binding = "MAILER"
service = "dr-sumya-mailer"
```
- **Guardrail:** verify this exact key shape works for Pages on installed wrangler 4.118.0 (`npx wrangler pages deploy`); if the Pages project does not honor `[[services]]`, configure it in the dashboard instead: Settings → Bindings → Service binding → `MAILER` → `dr-sumya-mailer`, and record that.
- Add Pages secret `MAIL_SECRET` (same value as the worker's): `npx wrangler pages secret put MAIL_SECRET`.

### A12. Tests — Part A
- `tests/totp.test.mjs` — RFC 6238 Appendix B SHA-1 vectors (secret ASCII `12345678901234567890` → base32 `GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ`; times 59/1111111109/1111111111/1234567890/2000000000/20000000000 with `digits:8`); `digits:6` stable format; window ±1 accepts; wrong code rejects; bad base32 rejects without throwing.
- `tests/reset.test.mjs` — token is 64-hex; hash roundtrip; `forgot` (Turnstile missing → 403; matching email → 200 + `h.mails` captured with `/#reset?token=`; mismatch → 200 + no mail; 2nd within 60 s → no new mail); `reset` (valid token sets new PIN: login with new PIN 200, old PIN 401; clears 2FA: status disabled; expired token rejected; used token rejected; short PIN → 400).
- `tests/auth2fa.test.mjs` — login with 2FA off → full token (regression); enable via setup/verify-setup computing the expected code from the returned secret via the totp lib; login → `pending_2fa` + challenge; challenge token on `/api/appointments` → 401; verify wrong ×5 → challenge invalidated; verify correct → token works; disable requires PIN + code.
- `tests/mailer.test.mjs` — pure `mailer.js`: bad secret → 403, wrong `to` → 400, valid → MIME with expected From/To/Subject headers.
- **Harness change:** `createHarness` adds `serviceBindings: { ASSETS: serveAsset, MAILER: <capture stub> }`; stub parses JSON, records into `state.mails`, returns `{ ok: true }`; expose `h.mails`. **Also update `migrate()` to apply all `migrations/*.sql` sorted (001, 002, 003)** — mandatory or every new test 500s.

---

## Part B — Site-content editing

### B1. Content model
- `site_content` rows, **never seeded** — hardcoded `index.html` text is the default until the doctor saves.
- **Scalar keys** (plain or light-rich strings): `hero.headline`, `hero.tagline`, `about.heading`, `about.intro`, `about.stat1_value`, `about.stat1_label`, `about.stat2_value`, `about.stat2_label`, `about.stat3_value`, `about.stat3_label`, `section.about.title`, `section.chambers.title`, `section.results.title`, `section.gallery.title`, `section.services.title`, `band.text`.
- **JSON-array keys:** `chambers` = `[{ name, address, hours }]`, `services` = `[{ title, description }]`.
- **Quiz copy stays hardcoded.** (Final key set must be mapped against the real `index.html` markup at build time.)

### B2. New endpoint — `functions/api/content/index.js`
- `GET` (public, no auth): `SELECT key, content FROM site_content` → `json(rows.map(r => [r.key, parseJsonKeys(r.key, r.content)]))` as a flat object; JSON keys parse, invalid JSON → return raw string.
- `PUT` (auth): body object `{ key: value }`. Validate each key ∈ allowlist (hardcoded in the endpoint); scalar length ≤ 2000; `chambers`/`services` parse as JSON array (≤ 100 items, fields ≤ 500 each). Unknown key → 400. `value === ''` or `null` → `DELETE` the row (page falls back to hardcoded default). Else upsert: `INSERT INTO site_content (key, content, updated_at) VALUES (?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET content=excluded.content, updated_at=datetime('now')`. Use `DB.batch`. Wrap in `loggedWrite('content.update', { keys: <changed keys> })` (**no content values in the log**).
- This is a new public route — it does **not** affect the uptime probe (which checks `/api/config/public` only).

### B3. New frontend module — `public/js/richtext.js` (plain script, pre-main.js)
- `renderLightRich(text)`: **escape `& < > " '` first**, then transform `**x**`→`<strong>`, `*x*`→`<em>`, lines starting `- `→`<ul><li>`, remaining `\n`→`<br>`. Output contains **only generated tags**; never emits raw HTML, never `on*` attributes.
- `plainText(text)`: escape-only.
- Bottom: `if (typeof module !== 'undefined' && module.exports) module.exports = { renderLightRich, plainText };` so node tests can import it.
- index.html: `<script src="js/richtext.js" defer></script>` before main.js (external, `'self'` — CSP-compliant).

### B4. index.html markup
- Add `data-content="<key>"` to each editable element; add `data-list="chambers"` / `data-list="services"` to `#chambers .chamber-card` container and `#svcGrid`. Leave hardcoded text in place as the fallback.

### B5. main.js hydration + admin UI
- On load (and after content save): `GET /api/content`; for scalar keys, `el.textContent = plainText(v)` (headings/stats) or `el.innerHTML = renderLightRich(v)` (hero tagline, about intro, band text — via `renderLightRich`); for `chambers`/`services`, rebuild containers from JSON using `document.createElement` + **event delegation** (reuse the existing `#svcGrid` delegation in main.js — do not assume card behavior, read it first). Do not set `innerHTML` on containers with untrusted-derived markup; build nodes.
- Login flow: after `POST /api/auth/login`, if `data.pending_2fa` → show a code input, keep `data.challenge`, `POST /api/auth/2fa/verify` → `setToken`; on "Too many attempts" → return to PIN step.
- "Forgot password?" link on login → swap to email form (new Turnstile mount `turnstileForgot`, action `forgot-password`) → generic success message.
- `#reset?token=` (parse on `hashchange`/init) → reset form (new password + confirm + Turnstile mount `turnstileReset`, action `reset-password`) → `POST /api/auth/reset-password` → success → switch to login.
- Settings tab additions: **email field** (`admin_email` — add to `GET/PUT /api/config` + validation; UI note: must be an Email-Routing-verified destination) and **2FA section** (status → `setup` → render QR via `QRCode.toCanvas(canvas, uri)` from vendored `qrcode.min.js` + show secret + code input → `verify-setup`; disable → prompt for current PIN + code → `disable`).
- New **"Site Content"** tab: field groups + list editors for chambers/services mirroring the gallery panel (`photoTitle`/`photoCategory`/add/remove pattern); Save → `PUT /api/content` → re-hydrate.

### B6. Vendor QR
- `npm i qrcode` (or `npm i -D qrcode`), copy `node_modules/qrcode/build/qrcode.min.js` → `public/js/vendor/qrcode.min.js`, **commit it**. Load via `<script src="js/vendor/qrcode.min.js" defer>` (external, `'self'`). If the file isn't present/UMD, fall back to manual secret entry (show secret + otpauth URI) rather than a CDN.

### B7. Tests — Part B
- `tests/content.test.mjs` — GET public empty → `{}`; PUT unauth → 401; PUT unknown key → 400; PUT valid scalar persists + GET reflects; PUT `services` with invalid JSON → 400; PUT `''` clears row; lengths enforced.
- `tests/richtext.test.mjs` — `<script>`/`onerror`/`javascript:` inputs stay inert (escaped); `**b**`→`<strong>b</strong>`; `*i*`→`<em>i</em>`; `- a\n- b`→`<ul><li>a</li><li>b</li></ul>`; `\n`→`<br>`; `&` escaped; output never contains `<script`, `javascript:`, or `on` attributes.

---

## Deploy/ops sequence (after all tests green)
1. `npm test` full suite green (old 217 + new). Optional `npm run test:e2e`.
2. Apply `migrations/003_self_service.sql` remote: `npx wrangler d1 execute dr-sumya-pervin-db --remote --file migrations/003_self_service.sql`
3. Seed email: `npx wrangler d1 execute dr-sumya-pervin-db --remote --command "UPDATE admin_settings SET admin_email='dr.enamtalha@gmail.com' WHERE id=1"`
4. Mailer: `cd workers/mailer && npx wrangler secret put MAIL_SECRET` then `npx wrangler deploy`.
5. Pages secret + binding: `npx wrangler pages secret put MAIL_SECRET` (same value); confirm `[[services]]` (or dashboard fallback per A11 guardrail).
6. Deploy Pages from repo root: `npx wrangler pages deploy public`.
7. HUMAN-TASKS.md: add task — verify a reset email lands at `dr.enamtalha@gmail.com`, the link works, 2FA enrolls in an authenticator app, and a content save renders live.
8. Update `STATUS.md` and `agent.md` (auth + content rows).

## Anti-hallucination guardrails (implementing agent MUST respect)
- Verify (don't assume) the Pages `[[services]]` wrangler syntax on installed wrangler 4.118.0; fall back to dashboard binding and record the choice.
- Verify the vendored `qrcode` UMD path exists before referencing it; never add a CDN script (CSP + no external dep without build).
- Do not touch `/api/config/public` (uptime probe + booking form contract) or the digest/probe workers (their sendEmail is reference-only).
- Do not weaken the CSP; no `on*` attributes in JS-generated HTML (F9 rule).
- Update harness `migrate()` to apply all migrations in filename order or every new test 500s.
- Keep `signToken`/`requireAuth`/login backward compatible: with 2FA off, login returns a full token exactly as today (existing `auth.test.mjs` must pass unchanged).
- Never log reset tokens, TOTP secrets, PINs, or the admin email (`functions/lib/log.js` redaction contract).
- TOTP is security-critical: implement from RFC 6238 and validate against the RFC test vectors; do not hand-wave the base32/truncation.
- Read `main.js` service-card event delegation before rebuilding `#svcGrid` cards.
- The mailer's `send_email` binding is restricted to `dr.enamtalha@gmail.com` — a future admin_email change to a different address silently breaks resets; the Settings UI must warn about the verified-destination constraint.
