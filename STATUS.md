# STATUS.md — Current state (living document)

**The only state document that is kept current.** Update it whenever deployment,
verification, or owner-action state changes. Everything under `docs/` is a dated
snapshot; if this file and a snapshot disagree, this file wins.

**Updated:** 2026-10-04 (PR #1 review fixes) — **BUILT AND GREEN (295 node + 49
e2e), NOT DEPLOYED.** Review fix-now list done: tap targets measured in a
browser (≥44px at phone width, ≥24px desktop); tool answers reach /book/ via
sessionStorage, never a URL; the WhatsApp number comes only from
content/site.mjs (stamped on `<body data-wa>`); site.css font sizes are rem;
agent.md §2/§4 brought current; "Consulting today" has e2e coverage.
The reviewer's three skin-check clinical concerns (palms/soles mapping, the
skin-cancer card on any new mole, "within days" for a fast-changing mole) are
for Dr. Sumya's review and are unchanged in code.

**Earlier 2026-10-04 — Skin check tool + whole-card fix: BUILT AND GREEN
(295 node + 44 e2e), NOT DEPLOYED.** New `/tools/skin-check/` (64 pages): a
five-question symptom guide that shows the conditions a description often
turns out to be (linking the condition pages), how soon to be seen, and which
visit fits; never a diagnosis or a procedure, nothing stored, no answers in
URLs. **Owner action: Dr. Sumya should review its clinical wording** — the
sign → condition mapping and warning signs in `content/pages/tools.mjs`
(`skinCheck`) and the urgency copy in `public/js/site.js`. It was published
before her review at the owner's request. Also fixed: fee and care-plan cards
are whole-card targets again (a press animation had broken body clicks), and
clicks during the card ↔ sheet view transition are no longer lost. **2026-10-04:
Dr. Sumya approved the Nil & Haldi rebrand** — she confirmed the rebrand was
itself requested, superseding the 2026-10-02 gold-identity decision. Still
pending her sign-off: the Signature SP mark (not trademark-cleared) and the
skin-check clinical wording above.

**Earlier 2026-10-03 (later)** — **Design critique round: BUILT AND GREEN, NOT
COMMITTED, NOT DEPLOYED.** An Impeccable audit (13/20) + critique (21/40) found
the home hero's small text at 1.8–4.0:1 on the gradient, the doctor's name in
every footer at 1:1 (ink on ink), a /book/ form that defaulted to a "Morning"
session no chamber runs, accepted past dates and closed days client-side, and
silently dropped its pre-ticked reminders box, and Centre fee tiers presented
without saying hospital-chamber fees differ. Fixed: hero recoloured (now
4.8–7.4:1 measured), footer brand, site-wide ink `:focus-visible`; /book/
derives each chamber's session and consulting days from `functions/lib/
schedule.js`, sets `min`, shows per-field errors, and sends `reminders` — the
API records an opt-out as `[No reminders]` at the front of the notes (no schema
change); home leads with the two Shyamoli chambers, ethics band second, Centre
tiers/rooms labelled "from opening in 2027" with VAT-inclusive totals; nav gains
Learn + an About menu (chambers, contact, FAQ, Centre), drawer mirrors the mega
menus, footer carries phone/WhatsApp/email/hours; burger below 1100px; ABCDE
illustrations on the mole tool (docx §5.40). New shared tokens `--hair-dark`,
`--field-line`, `--err-*`, `--warn-*` in BOTH :root blocks. **294/294 node +
31/31 e2e green.** Owner sign-off needed: the nav departs from the docx menu
(The Centre moved under About; Learn added); `content/bn.mjs` holds unapproved
Bangla drafts that render only when marked approved; `assets/clinic.jpg` (the
og:image) and `treatment.jpg` appear AI-generated with non-local subjects and
the og alt text calls clinic.jpg "the consultation suite at Dr. Sumya Pervin's
practice" — a claim the owner should replace or retract.

**Earlier 2026-10-03 — The multi-page site is CUT OVER in the repo.** `BASE` is
now `''` and `npm run build:site` writes the 63-page site to `public/` root, replacing
the one-pager's `index.html`. The one-pager CMS moved to a standalone **`/admin/`**
console (`public/admin/index.html` + `public/js/admin.js`); the one-pager-only scripts
(`main.js`, `richtext.js`, `formguard.js`) and their suites were retired. The hero
portrait was removed at the doctor's request on both surfaces — an arched credential
plate now stands in for the photo — and `og:image` is `assets/clinic.jpg`. The live
`drsumyapervin.com` is untouched until the owner deploys.
**Audit round 5 is BUILT AND GREEN BUT NOT DEPLOYED.**
The serving deployment is still **`a5077cb3`**; everything below in this paragraph
is in the working tree only. A full read of the frontend, all 18 Functions and the
three Workers found six shipped defects, a contrast failure running through the
whole design system, and 2.19 MB of avoidable image weight; three further defects
(A8, A9, A10) were found *while fixing those* and are the most serious of the set.
Fixed in this round: the hero was blank until three serial API calls resolved; all
eight service modals showed identical invented clinical copy; the appointments CSV
truncated at any `#` and was formula-injectable; four palette tokens failed WCAG
AA; `/api/auth/check` accepted a pending-2FA challenge token; the duplicate-booking
409 disclosed another patient's reference id; **A8** — the entire self-service PIN
reset path was unreachable from the UI (an inline `style="display:none"` that
`.active` never cleared); **A9** — 14 controls inside closed modals were reachable
by Tab; **A10** — `richtext.js` was loaded as a classic script despite using ES
exports, so it threw on *every* page load and the site-copy rich text had never
worked; **A11** (2026-10-02, owner-reported on the live site) — the sticky nav
lived inside the one-viewport hero, and since `position:sticky` works only
within the parent's box the "stuck" bar scrolled off for good past ~628px:
every deep anchor landed with no navigation at all. The wrapper is now a
sibling of the hero and `scroll-margin-top: 104px` stops jumps tucking headings
under the bar. **A12** (2026-10-02, owner-requested) — the About "Quick Stats"
pill and both stat cards are gone, replaced by a hairline-separated type-only
stat row: **15+ years in medical practice / 10+ years in government service /
7+ years as a dermatology specialist** (owner-supplied; `context.md` updated —
it previously said "14+ years of specialized clinical practice"). Every other
section is a card grid, so About now stays editorial; the FCPS&DDV/affiliation
content dropped with the cards already lives in the hero namecard, the
Certifications section and Chambers. Plus: `cms.js` split out of `main.js` and loaded on demand (patients no
longer download 18.2 KB gz of admin JS), images re-encoded to WebP, scrollspy
moved to an IntersectionObserver, `alert()`/`confirm()` replaced with inline
status, and closed chamber weekdays now refused before submit rather than by a
400. **276/276 node + 35/35 e2e green** (A11 adds two sticky-nav geometry e2e specs
and a markup containment guard), zero console errors and zero CSP
violations at 1280 px and 375 px. See the "Audit round 5" row. Earlier —
**F13 + F14 shipped** (see
the F13/F14 row below): the Settings form's required-but-dead `admin_email` field
is wired end-to-end (GET/PUT on `/api/config`, populated on load, saved on
submit, validated server-side; `/api/config/public` still returns exactly
`{whatsapp, telegram}`), and the CMS PIN fields now carry
`autocomplete="new-password"` so browsers stop offering to save the PIN (the
Task-0 transcript-leak vector). Deployed `a5077cb3`, committed + pushed
`3a00d4f`; **247/247 node tests + 14/14 e2e green.** F15 recorded only (no login
throttle is a deliberate decision). Earlier: **F11 is now FIXED: the
uptime monitor works and the crying-wolf is gone.** Production D1 is **clean**
(0 appointments, 0 gallery), **F8's digest** runs green from its own logs, and
the one open engineering item — the uptime monitor, which had failed **9/9**
scheduled runs with a Bot Fight Mode 403 on GitHub Actions' Azure IPs — is
replaced. The **authoritative monitor is now `workers/probe`**: a Cloudflare-
native Worker on its own 30-min cron (deployed 2026-08-05 15:30 UTC, version
`c7d0aced`) that probes `/api/config/public` **from Cloudflare's own network**
(verified: a Worker subrequest returns 200 with the JSON contract, where GitHub
runners got 403 on every attempt) and emails the doctor once on the DOWN
transition and once on RECOVERY. The **GitHub Actions workflow is demoted to a
third-party canary** that treats a cf-mitigated edge block as the expected
state of its own vantage point, so scheduled runs stay green instead of
spamming the owner's inbox. ⚠️ **Timestamps written earlier on 2026-08-04 were
taken from a machine clock that was ~9 h 24 m slow**; it has since synced and
now agrees with network time. Anything in this file dated "2026-08-04 21:xx
UTC" was really 2026-08-05 ~06:xx UTC. On 2026-08-04, **the Phase 2 build work
was closed.** Two deploys shipped: `fb1b3aa8` (the pending UX batch, including
the critical quiz-booking fix) and `42aa5567` (F11 + one new bug fix). **F10**
landed as 14 Playwright tests, **F11** as a CI gate, an uptime monitor, a
proven D1 backup/restore runbook and structured write logs, **F12** as this
update. F10 immediately earned its keep by catching a **latent bug**:
`.fab-btn { display: grid }` outranked the `[hidden]` attribute, so
`main.js`'s `fab.hidden = !digits` never hid anything and an unconfigured
WhatsApp number would have shown a dead `href="#"` button. Fixed and deployed.
Earlier on 2026-08-04: the doc-validity audit, the UX audit, L6, and Workers
Logs on the digest.

---

## Multi-page rebuild programme (started 2026-10-02) — CUT OVER to the site root

Owner change request (`Change Request/` + `docs/CHANGE-REQUEST-2026-10-02.md`): the one-pager
becomes a ~63-page site — concern-first hubs, published prices, tiered consultations, the 2027
Centre — **in the existing gold/Outfit identity** (the mockups' teal look was wireframe-only).
Baseline: round-5 batch committed and pushed as `c5552b9`.

- **Pipeline**: `content/` (site config, sitemap, price data, page bodies) → `scripts/build-pages.mjs`
  (`npm run build:site`) → `public/**` (63 pages + sitemap) at the site root. Zero deps, CSP-safe
  output. The builder cleans only the page directories, root `index.html`, `sitemap.xml` and the
  retired `/new/` tree — never the hand-maintained `css/`, `js/`, `assets/`, `admin/`.
  `tests/pages.test.mjs` (8 tests) pins: every sitemap page built, **every internal link resolves**
  (the interlinking rulebook made executable), unique titles/descriptions/canonicals, `site.css`
  `:root` is a verbatim copy of `style.css`'s (gold identity = one token set), no inline handlers,
  and the load-bearing docx price figures publish verbatim.
- **Phase 3 content fill (2026-10-03) — all pages now carry real content; zero stubs remain.**
  A generic article renderer (`content/pages/article.mjs`) renders structured content from
  `content/pages/content.mjs` (split into `conditions` / `treatments` / `aesthetic` / `visit`).
  Four bespoke bodies remain: Home (diagnosis-first hero, 4 promises, 3 pillars, 5 steps, tier
  preview, Centre teaser, ethical-limits band, Learn teaser), **Prices** (all of docx Part 6 plus
  a working course-cost estimator), About (docx 5.2 + the 15/10/7 stat row), What we don't offer
  (docx 5.38). Everything else is transcribed from docx §5.3–5.40: 3 hubs, 12 condition pages,
  7 concern pages, 14 treatment pages, the patient guide, The Centre, chambers, book, prep, products,
  community, a 14-question FAQ, contact, 2 tools, and 4 legal pages (authored from the docx briefs
  and verified site facts). Renderer supports h2+body, bullet lists, bold-lead definition lists,
  card grids, cost notes, FAQ accordions and related links.
- **Gates**: price rows carry docx Part-9 tags (OPENING/LICENCE/LASER/YEAR 2); staging shows all
  sections with badges; the live gate is one constant (`ACTIVE_GATE` in `content/site.mjs`).
  Publishing the price list needs D-01…D-06 sign-off first — that is the owner's, not ours.
- **Interactive tools (2026-10-03)** — the mole check, skin-type guide and prepare-for-visit
  pages are now working tools (docx §5.40), not static copy: bespoke bodies in
  `content/pages/tools.mjs` + client-side logic in `public/js/site.js` (CSP-safe, nothing
  stored). Mole check scores the ABCDE + brown-skin signs to "nothing concerning" or "worth a
  dermatologist's look"; the skin-type guide returns a type, sun-reactivity, a 3-step Dhaka
  routine and peel/laser suitability; prepare-for-visit suggests a consultation depth. Pinned by
  `tests/e2e/site-tools.spec.mjs` (4 specs).
- **Phase 2 booking tiers (2026-10-03)** — `/book/` is now a working form, not copy. Migration
  `004_consultation_tiers.sql` adds `consultation_type` + `preferred_session` (both optional, so
  the one-pager is unaffected); `POST /api/appointments` validates the tier against a fixed
  allowlist (Specialist / Comprehensive / Signature / Procedure Assessment / Private) and the
  session (Morning / Afternoon / Evening); the CMS appointment row shows the tier and session.
  The form is a bespoke body (`content/pages/book.mjs`) with Turnstile (action `booking`, same
  widget the one-pager uses) and the pre-hydration disabled-button guard; site.js submits to the
  same endpoint. Pinned by 4 API tests + `tests/e2e/site-booking.spec.mjs` (2 specs).
- **Admin console ported (2026-10-03)** — the multi-page site had **no CMS**; the whole admin
  panel lived only in the one-pager. A standalone **`public/admin/index.html`** (noindex) now
  carries the CMS markup and boots the existing tested `js/cms.js` through a small new bridge,
  `public/js/admin.js` (login/2FA, appointments, gallery, edit-copy, settings, backup, PIN
  reset). It reuses the one-pager `style.css` for the CMS component styles and `<base href="/">`
  so `cms.js`'s on-demand qrcode path resolves. Pinned by `tests/e2e/admin-console.spec.mjs`
  (2 specs: login reaches the panel; a wrong PIN is refused).
- **Cutover (2026-10-03)** — `BASE=''` and the build writes to `public/` root. The one-pager
  suites were migrated, not merely deleted: `booking-submit`/`booking-failure` fold into the new
  `site-booking`; `cms-xss`, `csv-export`, `lazy-admin` now drive the `/admin/` console;
  `a11y-dialogs` moved to the admin dialogs + the site skip link; `formguard` became the /book/
  disabled-button guard; `whatsapp-gating`, `service-modal`, `scrollspy`, `sticky-nav`,
  `richtext-render`, `hero-reveal` and the `services`/`schedule-mirror` node tests retired with the
  surfaces they pinned. `forgot-password.js` now mails `/admin/#reset?token=`. Dead one-pager
  scripts (`main.js`, `richtext.js`, `formguard.js`) removed; `style.css`/`cms.js` stay (the admin
  console uses them).
- **Verified**: 286/286 node + 29/29 e2e at the cut-over root; served at `wrangler pages dev`
  `http://localhost:8788/` — desktop nav mega-menus, estimator arithmetic (৳3,000 × 1.25 =
  ৳3,750), mobile drawer + sticky Call/WhatsApp/Book bar, no horizontal overflow at 375px.
- **M1 mobile pass (2026-10-03)** — the owner rejected the first phone layout, and docx §7.3
  (mobile rules) is now executable: the drawer was missing **Prices and About** entirely and its
  rows were 37px; it is now a light ivory panel over a scrim (48px rows, focus trap, focus returns
  to the burger). The hero credential plate collapses to a compact ~100px strip ≤820px so both
  CTAs fit the first phone screen. The utility bar shows one slim line on phones instead of a
  five-line wall. Price tables stack into `data-th`-labelled cards (band → price → inclusions →
  who badge), the recommended tier card renders **first** per §7.3, the sticky price tabs no
  longer slide under the header (a real `top:0` bug), and the bottom bar gets safe-area padding.
  Deviation recorded: the estimator stays a flat 3-control form on phones — §7.3's "4-step
  wizard" is deferred to Phase 2's booking JS rebuild. `tests/e2e/mobile-site.spec.mjs` (+6 at
  375×667) and a mobile-shell node test pin all of it.
- **Portrait removed (2026-10-03, `37f41f6` + staged `691bb2e`)** — the owner asked
  that her photograph not be published. Both the one-pager hero and the staged
  multi-page hero now carry an arched **credential plate** (SP monogram, name,
  specialty, MBBS/DDV/FCPS/BMDC pills) built from the existing gold tokens;
  `og:image`/`og:image:alt`/`twitter:image`/JSON-LD switched to `assets/clinic.jpg`;
  the cert cards, before/after slider, step thumbnail and review faces no longer
  reference her photo. `public/assets/hero_portrait.{jpg,webp,-400.jpg}` deleted
  (recoverable from git history). No `hero_portrait` reference remains outside
  dated `docs/**` snapshots.
- **Contact details wired (2026-10-03)** — owner-supplied phone `01353-787080` (`phone`
  display + `phoneTel` E.164 for `tel:`), practice email `appointments@drsumyapervin.com`,
  and the site WhatsApp link now `8801353787080` (follows the new phone). They publish on the
  utility bar, the sticky Call/WhatsApp bar and `/contact/` (tel + mailto). Migration
  `005_admin_contact.sql` sets the CMS `admin_email` to the practice inbox (Email Routing →
  the doctor's mailbox) and the CMS `whatsapp` field to the new number; the admin Settings
  placeholders were updated. Pinned by new `pages.test.mjs` + `config.test.mjs` guards.
- **Prices VAT + review date (2026-10-03)** — owner-supplied: the price list is reviewed
  **November 2026**, and displayed prices **exclude VAT** with **15% added at checkout**.
  Wired via `SITE.pricesReviewed` + `SITE.vatRate` (`content/site.mjs`), rendered on the Prices
  page and footer; the estimator now shows the VAT line and the checkout total. Pinned by
  `pages.test.mjs` + `tests/e2e/site-prices.spec.mjs`.
- **Content-completion pass (2026-10-03) — the docx gaps are closed; 63 pages.**
  Owner decisions: go live at the **`opening` gate** (`ACTIVE_GATE`), keeping all
  pages public while withholding unpublished prices; close every docx content gap.
  - **Publish gates now hold site-wide.** The gate previously filtered only the
    Prices page; it now also (a) withholds the laser-only estimator, (b) drops the
    cost note and any positive-`৳` block on a gated page (concerns/treatments/bridal
    keep their clinical copy, no prices), and (c) strips inline `[[gate: …]]`
    fragments on otherwise-visible pages (condition cost notes). Pinned by
    `pages.test.mjs` (opening figure set + "prices not yet cleared are withheld" +
    "no marker leaks").
  - **Learn articles**: the six docx §3.2 launch articles now exist under
    `/learn/[slug]/` (melasma, ringworm, ABCDE, laser hair removal, hair fall,
    arsenic), authored from the matching condition/treatment pages in the §1.4
    voice, linked from the hub and the home teaser. `tests/e2e/site-learn.spec.mjs`.
  - **Clinical bylines + review date**: every clinical page (conditions, concerns,
    treatments, Learn) carries "Written and reviewed by Dr. Sumya Pervin, FCPS
    (Skin & VD), BMDC A-59492 · Last reviewed October 2026" (`SITE.reviewed`).
  - **References (DRAFT — owner approval required)**: `content/references.mjs` adds
    2–3 organisation-level guideline pointers per clinical page, rendered at the
    foot. **Drafted by the agent, not yet clinically verified — do not deploy until
    the owner/doctor approves or corrects the list.**
  - **Linking rulebook** (docx §3.4) completed and enforced: conditions link
    `/consultation-prep` + a Learn article; surgical treatments link
    `/your-procedure`; Learn articles link a condition + a tool + Book.
  - **Placeholders gone**: the `/the-centre/` `[LANDMARK]`/`[details]` brackets were
    removed (owner D-12 details pending); a guard now fails on any bracketed
    placeholder in the build.
- **Next (owner inputs, before deploy)**: **approve or correct `content/references.mjs`**;
  the Centre landmark/parking + name/address/photos (D-12); the SMS-provider and
  EMI-partner-bank (D-10) decisions; and the `/admin/` URL hand-off. Deploy is
  owner-gated; the live site is untouched until then.
- **Polish (2026-10-03)** — the builder now also emits a multi-page **`public/404.html`** (same
  nav/footer/drawer shell, `noindex`, no canonical) so a lost visitor can still navigate, and
  `robots.txt` carries `Disallow: /admin/`. Pinned by 2 new `tests/pages.test.mjs` tests. The
  live-apex check (zone-injected scripts) remains post-deploy.

---

## ERP + Patient Portal programme (planned 2026-10-03) — PROPOSED, nothing built

Owner decisions: connect the site to a clinic **ERPNext + Marley Health** instance
(self-hosted VPS, origin behind a Cloudflare Tunnel) as the system of record, and
later ship a **patient PWA** (journey timeline, digital prescription, medicine
reminders; chat + articles deferred). Full plan: **`docs/ERP-INTEGRATION-PLAN.md`**.

- **Not OpenMRS + Ozone** (hospital-scale ops, wrong for a solo operator) and
  **not from-scratch** (would reimplement billing/inventory/records). ERPNext +
  Marley Health is one stack, one DB, one operator.
- **Seam:** site writes the booking locally → `D1 erp_outbox` → new
  `workers/erp-sync` adapter (token auth, idempotent, retry, DLQ) → ERP. Inbound
  changes via an HMAC-verified webhook. The public site never blocks on ERP.
- **Phase 1 here folds into this programme's Phase 2 booking schema** (adds
  `external_ref`/`erp_patient_id`/`sync_status`/`erp_outbox`) — one migration.
- **Portal:** PWA-first (agent-built); a BFF on Workers/Durable Objects is the
  per-patient authorization boundary (ERPNext portal permissions are not
  patient-scoped). Prescription = signed clinical record + QR, *not* the legal
  e-prescription (BMDC legal check pending). Chat = no guaranteed response SLA.
- **Next:** owner provisions Phase 0 (VPS + ERPNext + backups + rehearsed
  restore); agents then build the D1 seam and `workers/erp-sync`. No ERP code
  exists yet; the live site is unaffected.

---

## The site is LIVE on `drsumyapervin.com` (deployment **`a5077cb3`** — F13/F14, commit `3a00d4f`; **247/247
node tests + 14/14 Playwright e2e green**; Self-Service CMS with PIN Reset, TOTP 2FA, and Site-Content Editing built & fully tested), **F9 security headers are live** (CSP with no
'unsafe-inline' in `script-src`, HSTS, zero inline handlers left in `public/`),
and **the F8 digest worker is DEPLOYED, crons registered, recipient verified,
Workers Logs on** — nothing blocks it; its first live run was **2026-08-04 08:30
UTC (14:30 Dhaka)** and is now **proven end-to-end in production from its own
logs** — see the "Digest first run" row. **L6 is done** — the owner's
`+8801725196101` is live in production D1, so booking confirmations reach
WhatsApp. **FIXPLAN Phase 2 (F8, F9, F10, F11, F12) + Self-Service CMS (2FA, PIN Reset, Site Content) are built, verified, and ready.**

✅ **Production D1 is clean** — the operator deleted the three deploy-verification
bookings on 2026-08-04; re-probed as 0 appointments, 0 gallery. The digest can no
longer email the doctor a list of fake patients.

## Verified right now

| Fact | State | Verified |
|---|---|---|
| Serving deployment | **`a5077cb3`** (commit `3a00d4f`, pushed to origin) — F13/F14: `admin_email` wired through Settings + PIN autocomplete hardening | `pages deploy` + apex curl, 2026-08-05 |
| Previous deploy | `42aa5567` — F11 logging + the `[hidden]` fix. Back out to this if F13/F14 misbehaves | `pages deploy`, 2026-08-05 |
| Rollback target | **`5423d45e`** (last pre-Phase-1 known-good) — full id `5423d45e-78fd-48ea-abe8-1ce5d5bd0917`, re-confirmed against `pages deployment list` | 2026-08-03 |
| Previous good deploy | `f64b9221` (pre-F9), if F9 alone needs backing out | same |
| Apex / www / HTTPS | apex 200; www → 301 apex; http → 301 https | curl, 2026-08-03 |
| Tests | **276/276 green** as of 2026-10-02 (was 275 after audit round 5; A11 adds the nav-containment markup guard). Plus **35/35 `npm run test:e2e`** (was 33; A11 adds +2 sticky-nav geometry specs, which assert the bar's *viewport position* after a deep anchor jump — the class-based scrollspy specs stayed green through the entire bug). Audit round 5 vs 247/14: +4 service-copy, +10 contrast, +10 hardening, +4 schedule-mirror units; e2e +6 dialog a11y, +2 lazy-admin, +2 scrollspy, +3 rich-text, +1 closed-weekday, +1 focus-race, +2 service-modal/CSV. Stable across 8 consecutive full e2e runs. Previously **247/247** (`npm test`; Miniflare + real compiled worker, plus 24 TOTP/Reset/Content units, 16 digest units, 18 F9 header/inline-handler/exposure units, 5 structured-log units, 13 probe units, and 6 F13 config/admin_email units). Plus **14/14 `npm run test:e2e`** (F10). All pass green under Node 24 | `npm test` + `npm run test:e2e`, 2026-10-02 |
| **F13 + F14** | ✅ **DONE 2026-08-05, deployed `a5077cb3`, commit `3a00d4f` pushed.** F13: the Settings form was unsaveable — `adminEmailInput` is `required` but `loadCMSConfigForm()` never populated it, so native validation blocked every save, and whatever was typed was discarded (the only writer was operator SQL). Now wired end-to-end: `/api/config` GET returns `admin_email`, PUT accepts/validates it (same regex as the forgot-password path, ≤254, `''` clears) and persists it in the same single UPDATE as the PIN rotation / channel writes; `loadCMSConfigForm()` fills the field, the submit handler sends `admin_email`. Logged as `admin_email_set: <bool>` — never the address (redaction contract in `functions/lib/log.js`). `/api/config/public` is untouched — still exactly `{whatsapp, telegram}` (leak-guard test added). F14: `autocomplete="new-password"` on `cmsPinInput`/`resetNewPin`/`resetConfirmPin`, `autocomplete="email"` on `forgotEmailInput` — closes the 2026-08-03 PIN-autofill/transcript vector (HUMAN-TASKS Task 0's "related, smaller" item). F15 recorded only (no app-level login throttle is a deliberate decision; Turnstile-first ordering is the fast-path defense). Specs + owner note (mailer `ALLOWED_RECIPIENT` must change before `admin_email` may differ from `dr.enamtalha@gmail.com`): `FIXPLAN-2026-08-05.md`. Smoke verified on pages.dev: public route exactly two keys, admin route 401, 4 autocomplete attrs served. **Remaining manual (operator, PIN+TOTP):** Settings loads the stored `admin_email` and Save works without typing it | `npm test` + e2e + curl, 2026-08-05 |
| **F10 DOM layer** | **DONE.** `tests/e2e/` — 14 Playwright tests over the five required areas: real pointer-click booking, XSS inert in the CMS, booking-failure state, WhatsApp CTA gating, pre-hydration submit guard; plus the UX batch's assertions. Runs on the **Miniflare harness, not `wrangler pages dev`** — `pages dev` cannot intercept siteverify, so every DOM booking test would 403 under it for a non-DOM reason. `npm run test:e2e`, kept out of `npm test` so the deploy gate stays ~3 s | `npm run test:e2e`, 2026-08-04 |
| **F11 ops** | **DONE — see the Uptime monitor row.** `.github/workflows/ci.yml` (`npm test` + e2e on push/PR; **never deploys**) ✅, `npm run backup:d1` + `docs/RUNBOOK-BACKUP.md` (**restore drill proven**: exported 4/4 tables, replayed into a wiped local D1, counts matched) ✅, JSON write logs ✅, uptime monitor ✅ (**now `workers/probe`, deployed**) | see rows below, 2026-08-05 |
| ✅ **Uptime monitor** | **FIXED 2026-08-05.** The GH-Actions monitor failed **9/9** scheduled runs: the zone's Bot Fight Mode (auto-enabled, non-disableable on this plan) challenges Azure datacenter IPs with a `cf-mitigated` 403 while real clients get 200. It was **worse than no monitor** — a probe that always cried wolf gets ignored. **The authoritative monitor is now `workers/probe`** (`dr-sumya-probe`, version **`c7d0aced`**, deployed 2026-08-05 15:30 UTC): a Worker on its own `*/30 * * * *` cron that probes `/api/config/public` **from Cloudflare's own network** — a vantage Bot Fight Mode cannot challenge (verified live from a throwaway Worker: 200 + the JSON contract, 4/4 runs; GH runners got 403 on every attempt). It asserts the **JSON shape**, not a bare 200, and **emails the doctor once on the DOWN transition and once on RECOVERY** (consecutive-failure state in the `uptime_state` single-row table, `migrations/002_uptime_state.sql`). `.github/workflows/uptime.yml` is **demoted to a third-party canary**: it treats a cf-mitigated edge block on any of its three steps as the expected state of its own vantage and passes, so scheduled runs go green and stop spamming the owner, while a dead Function (5xx/timeout/wrong shape), a broken homepage, or lost HSTS/CSP still fail it. 13 new probe tests (217 total). Note: `HEAD` on the endpoint still 404s while `GET` 200s — do not write a HEAD probe | `wrangler deploy` + D1 SELECT + live probe, 2026-08-05 15:30 UTC |
| CI on GitHub | ✅ **GREEN on its first real run** — run `30874041644` on push of `c6da817`: both jobs passed (`npm test` 28 s; **Playwright DOM layer 59 s**, browser download and all, on a bare runner). Red is **proven locally**: renaming `validateSlot` made `npm test` exit **1**; reverting returned exit **0** and 204/204. The Node-20 deprecation annotation is **cleared**: all three actions bumped to `@v5` (checkout, setup-node, **and upload-artifact** — that one never appeared in the annotation only because it sits behind `if: failure()` and had not run, so it would have bitten on the first red build, exactly when the traces are needed). `@v5` is the version that moves to Node 24; note **v7 is the current latest** if a future bump is wanted, and setup-node v5+ auto-caches when `package.json` has a `packageManager` field — this repo has none, and `cache: npm` is set explicitly | `gh run view`, 2026-08-05 |
| Write logs live | **proven in production.** A real apex booking emitted `{"evt":"appointment.create","ts":"…","id":"book-5f67ef11","chamber":"Alliance…","appointment_date":"2026-08-08","service":"…","ok":true,"ms":88}` — **no patient name, no phone**. Read with `npx wrangler pages deployment tail <full-uuid> --project-name=dr-sumya-pervin-portfolio --format json`; `--environment production` alone is rejected non-interactively | `pages deployment tail`, 2026-08-04 |
| **Bug found by F10** | `.fab-btn { display: grid }` outranked the `[hidden]` attribute (a UA rule), so `main.js:164`'s `fab.hidden = !digits` **hid nothing** — with no WhatsApp number configured the floating button still rendered as a live link to `href="#"`, the exact "live link to nobody" the gating was written to remove. `#navTel` escaped only because `.nav-tel` sets no `display`. Fixed with `[hidden] { display: none !important; }`, deployed in `42aa5567`, verified on the apex | `tests/e2e/whatsapp-gating.spec.mjs` + apex probe, 2026-08-04 |
| **F9 security headers** | **LIVE on apex.** CSP (`script-src 'self' 'nonce-…' challenges.cloudflare.com static.cloudflareinsights.com`, no `'unsafe-inline'`; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`/`form-action 'self'`), `Permissions-Policy`, `HSTS max-age=31536000; includeSubDomains` (no preload), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` | `curl -I` + browser console, 2026-08-03 |
| Inline event handlers | **zero in `public/`** — 12 removed (8 `onclick` + 1 `onsubmit` in index.html, 3 generated `onclick` in main.js). `tests/headers.test.mjs` fails if one returns | `npm test` + DOM probe, 2026-08-03 |
| CSP violations in browser | **0** across a full local click-through and a full production pass | Playwright console capture, 2026-08-03 |
| F8 digest worker | **DEPLOYED** — `dr-sumya-digest`, live version **`0f6d80cd`** (2026-08-03 22:16 UTC; supersedes `e89ceefb`), crons `30 8 * * SUN-WED,SAT` + `30 10 * * SUN-THU,SAT` registered; no public URL (`workers_dev = false`, probe 404) | `wrangler deployments list`, 2026-08-03 22:2x UTC |
| Digest observability | **ON** — `[observability] enabled = true, head_sampling_rate = 1` in `workers/digest/wrangler.toml`, confirmed on the deployed script (`logs.enabled true`, `persist true`, `invocation_logs true`). Enabled *before* the first scheduled run for one reason: this Worker's only trigger is cron and its only output is an email nobody in this repo can read, so **"no mail arrived" and "nothing to report" are the same observation** without logs | Cloudflare API, 2026-08-03 22:16 UTC |
| **Digest first run** | ✅ **OBSERVED AND GREEN — Phase 2's last open item, now closed.** Both crons fired on 2026-08-04 and both sent: `digest: sent Alliance Hospital Limited (Shyamoli) 2026-08-04 (0 bookings) to dr.enamtalha@gmail.com` and the same for `Dhaka Central International Medical College (DCIMCH)`. Cron strings in the logs match the registered pair (`30 8 * * SUN-WED,SAT`, `30 10 * * SUN-THU,SAT`). **Zero errors or warnings** — all logs for the whole of 2026-08-04 are `level: info`, count 2. The Dhaka date resolved to `2026-08-04`, so the date logic is right in production, not just under `--test-scheduled`. **Note it emails on empty days by design** (`digest.js:134` — "No appointments were booked for today."), so silence from now on means *breakage*, not "no bookings" — the inverse of the pre-observability situation | Workers Logs via observability API, 2026-08-05 06:15 UTC |
| **F11 probe worker** | **DEPLOYED 2026-08-05 15:30 UTC** — `dr-sumya-probe`, version **`c7d0aced`**, cron `*/30 * * * *` registered, `workers_dev = false` (no HTTP entry point). Bindings: `DB` (the same `dr-sumya-pervin-db`, used only for the single `uptime_state` row), `EMAIL` (send_email), vars `PROBE_FROM`/`PROBE_TO` (same verified recipient as the digest) / `PROBE_URL`. First scheduled run writes `id=1` into `uptime_state`; verify with `npx wrangler d1 execute dr-sumya-pervin-db --remote --command "SELECT * FROM uptime_state"`. Logs via Workers observability (`head_sampling_rate = 1`). The same `wrangler tail` / observability caveats as the digest apply — its output is an email + a log line, not a URL | `wrangler deployments list` + D1 SELECT, 2026-08-05 |
| Reading digest logs (method) | `wrangler tail` is **live-stream only** and cannot reach a past run; use the observability API. The Cloudflare MCP `query_worker_observability` **`events` view fails schema validation** on this worker (`outcome` undefined → zod `invalid_union`) — that error means the tool cannot *parse* the logs, **not** that no logs exist. The `calculations` view works: `count` grouped by `$metadata.message`, filter `$metadata.service eq dr-sumya-digest`. Group by `$metadata.level` to check for errors | 2026-08-04 |
| Digest end-to-end | **proven up to the send**: forced scheduled run on remote bindings routed Alliance → Dhaka date 2026-08-03 → production D1 query OK → both send paths rejected only with "destination address is not a verified address" | `wrangler dev --remote --test-scheduled`, 2026-08-03 |
| Email Routing (zone) | **enabled, status `ready`** — MX ×3 + SPF + DKIM (`cf2024-1._domainkey`) created automatically | Cloudflare API, 2026-08-03 |
| Digest recipient | `dr.enamtalha@gmail.com` — **`verified` 2026-08-03 16:13 UTC** (owner opened the link). The send path is now unblocked; **no cron has fired since the 15:10 UTC deploy**, so the first live digest is 2026-08-04 08:30 UTC / 14:30 Dhaka | Cloudflare API, 2026-08-03 22:07 UTC |
| Inbound `digest@` rule | **not created, and not required** — proven by the 2026-08-04 run, which sent from `digest@drsumyapervin.com` with no such rule. The `send_email` binding is authorised by **Email Routing being enabled on the zone**, not by an inbound rule (`workers/digest/wrangler.toml:47`). The zone has only a disabled catch-all `drop`, so the sole consequence is that **a Reply to a digest reaches nobody** — it bounces or is rejected. Create it only if the doctor might reply; needs an API token with Email Routing edit scope (wrangler OAuth lacks it) | Cloudflare API + live run, 2026-08-04 |
| L7 login rule | ✅ **done — nothing outstanding.** This row is a *doc correction*, not an open task: L7 had been recorded as a rate limit, but it is a `managed_challenge` on every `POST /api/auth/login`, which is live and protecting the endpoint. The zone's one rate-limiting rule is `Leaked credential check` (block, 5/10s); the free plan allows exactly one and that is the better use of the slot. **Deliberately kept as-is — do not "fix" this** | zone rulesets, 2026-08-03 |
| Booking guard live | tokenless POST on apex → 403; real widget booking succeeded | curl + D1, 2026-08-03 |
| Repo-root exposure | closed — internals all 404 @ 2,589 B (the 404 page grew when F9's markup changed; still 404, still nothing internal served) | curl, 2026-08-04 |
| SEO/OG | canonical, OG/Twitter, JSON-LD, robots.txt, sitemap.xml, favicon.svg live | curl, 2026-08-02 |
| Production D1 | ✅ **clean — 0 appointments, 0 gallery.** The three deploy-verification smoke rows (`book-af0a8c84` 08-05, `book-e879acc5` 08-06, `book-5f67ef11` 08-08, all named `ZZ TEST — …`) were deleted by the operator on 2026-08-04, hours before the 08-05 row would have surfaced in that day's digest. Agents remain SELECT-only on remote D1 | D1 `SELECT COUNT(*)` ×2 (`served_by: v3-prod`), 2026-08-05 06:05 UTC |
| WhatsApp/Telegram | **SET — L6 done.** `whatsapp = 8801725196101`, `telegram = +8801725196101` (owner-supplied `+8801725196101`, stored WhatsApp-style without `+` because `main.js` strips non-digits and the CMS field asks for it that way). Written straight to production D1, not through the CMS — the row now reads back on `/api/config/public` | D1 UPDATE (`changes: 1`) + curl, 2026-08-03 22:1x UTC |
| ~~Telegram button caveat~~ | ✅ **FIXED in audit round 5 (not yet deployed).** It used to build `https://t.me/share/url?...` unconditionally — the generic share sheet, which opens the *patient's* Telegram to pick any recipient and never routes to the doctor. It is now the same shape as the WhatsApp link: the stored `telegram` value is normalised (strips `@` and a `t.me/` prefix), validated against Telegram's username rules, and rendered as a direct `https://t.me/<user>` chat link — or omitted entirely if no valid handle is configured. `t.me/<user>` cannot carry prefilled text, so it is labelled "Message Dr. Pervin on Telegram" rather than presented as a forward of the booking | code + `npm run test:e2e`, 2026-08-27 |
| Launch steps L1–L8 | L1 ✅ L2 ✅ L4 ✅ L5 ✅ **L6 ✅ L8 ✅** (re-closed 2026-08-04 — smoke rows deleted, D1 back to 0/0) **L7 ✅** (a `managed_challenge`, not a rate limit — see row above; not an open item) · L3 contingency unused | FIXPLAN marks + probes |
| git | **in sync and clean** — `origin/master` and local `master` both at the latest `git log --oneline -1`; verify with `git ls-remote origin master`, and do not paste a bare hash here, this row is deliberately hash-stable. The Phase-2 work was pushed 2026-08-04 with operator confirmation, which is what first activated the CI gate and the uptime cron. Note the deployed code is live regardless of git: `wrangler pages deploy` uploads the working tree, not a git ref | `git ls-remote` + `git push`, 2026-08-04 |
| Browser clicks | **Whole CMS exercised locally** on the F9 build against local D1/R2 — login, Update Status, **Upload Photo** (R2 + D1 + image served back), Settings save, Gallery delete, Logout. **On production, only the public surface was exercised**; the production CMS was NOT logged into (its PIN and its D1/R2 writes are operator-only) | Playwright, 2026-08-03 |
| Zone-injected scripts | The apex HTML gets **two scripts this repo does not contain**: Cloudflare JavaScript Detections (inline, per-request ray id — a CSP hash can never match it) and the Web Analytics beacon. Both were blocked by F9's first deploy; fixed with a per-request CSP nonce + `static.cloudflareinsights.com`. **Neither appears on `pages.dev`**, so preview testing cannot catch this class of break. (2026-08-04 re-probe: only the JSD inline script appeared in curl fetches — the beacon is request-dependent; CSP allows it either way) | curl + browser, 2026-08-03 |
| **Doc-validity audit** | **Every row of this table re-probed against live state** — apex/www/http redirects, all six security headers, serving deploy + both rollback ids, zero inline handlers, 403 on tokenless booking, digest version/crons/observability/bindings, workers.dev 404, Email Routing (`ready`; recipient verified to the minute; only the disabled catch-all rule), D1 counts (0 appointments, 0 gallery), `/api/config/public`, L7 challenge behavior (`cf-mitigated: challenge`), exposure sweep. **All accurate** except two stale cells, fixed: git hash (`3a2e864`→`4460d34`) and 404 size (1,512→2,589 B). Not re-verifiable read-only: zone rulesets API (wrangler OAuth scope) — L7 was confirmed *behaviorally* instead | curl + wrangler + CF API, 2026-08-04 |
| **Audit round 5** | ⚠️ **BUILT AND GREEN, NOT DEPLOYED — the serving deploy is still `a5077cb3`.** Scope approved by the owner as *correctness + a11y + perf*; the design-aesthetic recommendations are written up but deliberately **not** implemented, and the content-integrity items are flagged as owner actions only (same handling as the "1,500+ procedures" claim removed 2026-08-02). Full findings and the execution plan: `~/.claude/plans/run-a-comprehensive-audit-peaceful-blossom.md`. **The defects found during (or, for A11, after) the work rather than the audit are the ones worth reading**: **A8** — `#forgotModal`/`#resetModal` carried an inline `style="display:none"` that `.active` never cleared, so adding `.active` set `opacity:1` on a `display:none` box and the whole F13 self-service PIN-recovery path was unreachable from the UI while every one of its API tests passed; **A9** — with all modals closed, 14 controls inside them (the entire booking form, the CMS PIN field) were still reachable by Tab, because the modals hid on `opacity` alone, which removes nothing from the tab order; **A10** — `richtext.js` uses ES exports but was loaded as a *classic* script, so it threw `Unexpected token 'export'` on every page load, never reached its `window.RichText` assignment, and `loadSiteContent()`'s `if (window.RichText …)` guard silently fell back to `textContent` — the doctor's `**bold**` in the hero tagline, about intro and band text had never rendered in production. **A11** — reported by the owner on the live site 2026-10-02: `.nav-sticky-wrapper` sat inside `<header class="hero">`, and `position:sticky` only works within the parent's box; the hero is one viewport tall, so past ~628px the "stuck" bar scrolled off with it and never returned — every anchor deeper than the hero (About, Chambers, Services, Results, FAQ) landed with no navigation, while the scrollspy kept highlighting a bar nobody could see. Fixed by hoisting the wrapper to a sibling of the hero (direct child of `.shell`; the `height:0` wrapper and absolutely-positioned `.nav` keep the transparent over-hero look unchanged) plus `section[id], header[id] { scroll-margin-top: 104px }` so jumps land below the bar. Pinned by `tests/e2e/sticky-nav.spec.mjs` (viewport *geometry*, not the class — the class assertions were green the whole time) and a containment guard in `tests/headers.test.mjs`. **A12** — owner-requested About refinement (same day): "Quick Stats" pill deleted; both stat cards (sienna/butter, the rotated FCPS&DDV diploma decal, hospital tags) replaced by a type-only `.statrow` — sienna numerals, small-caps grey labels, `--hair` separators that never enclose, stacked with horizontal rules at ≤820px; ~125 lines of dead card CSS purged; `context.md` Experience fact updated to the owner's three figures. Each is now covered by an e2e spec proven red against the pre-fix state. Payload: eager images **2.19 MB → 251 KB** (WebP + JPEG fallback, 400 px variants for the 78–132 px thumb/face uses, `width`/`height` everywhere, hero preloaded); patient JS **32.3 KB gz → 18.5 KB gz** (`cms.js` and `qrcode.min.js` both now load on demand). **Remaining: deploy to `pages.dev`, smoke, then apex** — `a5077cb3` stays the rollback target | `npm test` + `npm run test:e2e` + Playwright console/overflow capture at 1280 px and 375 px, 2026-08-27; A11 fixed and re-verified on a local `pages dev` at 1280 px, 2026-10-02 |
| **UX audit + fixes** | ✅ **DEPLOYED 2026-08-04 as `fb1b3aa8`, verified on the live apex**: a real booking with a live Turnstile token (752-char) → confirmation-only modal + `wa.me` link + `book-` reference, fresh form on reopen; **all four quiz outcomes** land on a valid `#serviceType.selectedIndex` (acne→4, pigmentation→3, hair→9, aging→2); 375px pass with every measured tap target ≥24px and no horizontal overflow; no-JS render proven (all 38 `[data-r]` visible without the gate); **zero CSP violations** — every console message came from `challenges.cloudflare.com`. Original batch of 8 fixes: booking modal shows only the confirmation on success (form + header hidden, restored on reopen; failure path unchanged); **quiz-driven bookings were all server-rejected** — rec names weren't select options; now mapped, plus new `Hair Loss & Scalp Treatments` option; `role=status`/`aria-live` on result regions, `role=dialog` on modals; 17 below-fold images lazy (2.19 MB → ~0.7 MB warm); step dots/faq-send/modal-close/tst-nav tap targets ≥24–44px; no-JS blank page fixed (`html.reveal` gate); Process-heading duplicate and toggle-label copy fixed. Full findings + 11 open recommendations: `docs/audits/UX-AUDIT-2026-08-04.md`. Handoff: `docs/handoffs/HANDOFF-2026-08-04-v2.md` | local click-throughs (puppeteer + system Chrome), 2026-08-04 |

## Active documents

- **`HUMAN-TASKS.md`** — step-by-step guide for everything that needs a person (browser clicks, dashboard launch, owner content, Phase 2 prereqs). **Start here.**
- **`FIXPLAN-2026-08-02.md`** — the execution plan. Phase 1 ✅, **Phase 2 ✅ (F8, F9, F10, F11, F12) — fully closed, nothing outstanding.**
- **`docs/RUNBOOK-BACKUP.md`** — F11. D1 export, verification, and the restore drill. Operator-run.
- `agent.md` — architecture, security rules, deploy/verify checklist.
- `context.md` — domain and medical-content facts; source of truth for credentials and schedules.
- `docs/` — dated archive; see `docs/README.md` for the map. **Latest session log: `docs/handoffs/HANDOFF-2026-08-04-v3.md`** (the two deploys, F10, F11, F12, and the `[hidden]` bug) — read `-v2` before it for the UX audit, `-2026-08-04.md` for L6 and the digest, `-v4` for F9 and `-v3` for F8.
- `docs/prompts/NEXT-PROMPT.md` — **fully spent, history now.** Tasks B and C were
  deployed, F10 shipped, and **Task A (read the digest's first-run logs) was
  closed 2026-08-04**. There is no current kickoff prompt; this file is the truth.
- `docs/prompts/F9-HEADERS-PROMPT.md` — the kickoff prompt for F9. **Done**; kept for the record.

## Standing owner actions

0. ~~Delete the three deploy-verification bookings from production D1~~ **DONE
   2026-08-04**, with hours to spare before the 08-05 digest that would have
   reported the first of them. Re-probed: `SELECT COUNT(*)` → **0 appointments,
   0 gallery**. Standing rule, unchanged: **deploy-verification bookings against
   the live apex are the only way to exercise a genuine Turnstile token, and
   agents are SELECT-only on remote D1** — so any future deploy smoke test leaves
   rows that only the operator can remove. Delete them the same day, and check
   their `appointment_date` against the digest crons before assuming there is
   time.

1. ⚠️ **Rotate the admin PIN.** During F9's browser pass the machine's saved-password
   autofill re-populated the CMS PIN field on `localhost`, so the production PIN
   appeared in an agent session transcript. Nothing was written down and no
   production login was attempted, but transcripts persist — change it in
   CMS Settings (needs the current PIN, min 8 chars). The autofill half of this is
   **fixed 2026-08-05 (F14)**: the PIN fields now carry `autocomplete="new-password"`,
   so browsers no longer offer to save/re-fill them — only the rotation itself
   remains.
2. ~~CMS Settings → real WhatsApp number + Telegram @username~~ **DONE
   2026-08-03** — `+8801725196101` supplied by the owner and written to
   production D1. Booking confirmations and the floating button now reach
   WhatsApp. **Telegram is DEFERRED by the owner (2026-08-03)** — the button
   stays a generic share sheet and the stored value stays unused. Do not treat
   it as a bug; revisit only when the owner supplies a real @username, which
   also needs a code change at `main.js:726`.
3. ~~Open Cloudflare's verification email in `dr.enamtalha@gmail.com`~~ **DONE
   2026-08-03 16:13 UTC.** The digest is fully wired, and its first live run
   (2026-08-04 08:30 UTC / 14:30 Dhaka) **has been read from the logs and was
   green** — see the "Digest first run" row. Dr. Sumya now receives two emails
   per chamber-day, **including on days with no bookings**. Still open, and
   optional: create the `digest@` inbound rule; nothing depends on it.
4. **Confirm chamber schedules** (Alliance Sat–Thu 5–8 PM; DCIMCH Sat–Wed 3–5 PM)
   — F4's enforcement and F8's digest both depend on these. **Agent side
   re-verified 2026-08-05**: all three sources agree — `schedule.js` (`days` +
   `startMin` + `scheduleLabel`), `context.md`, and the printed HTML (card
   `:158-159`/`:169-170` + booking `<option>` labels `:540-541`). Only the
   owner's real-world confirmation remains.
5. ~~**Leaked token**~~ **✅ CLOSED 2026-08-05** — no token in the dashboard carries
   id `b17d8b1322d3a80ddeebb36d76ae8ba5`, which is the documented "end of it"
   (either already deleted — the 07-31 attempt may have been the right one — or a
   different login's token). Turnstile-only scope; value no longer on this machine;
   `.bashrc` comment trimmed. See Task 11.
6. ~~**R2 dashboard glance**~~ **✅ DONE 2026-08-05** — verified read-only via the
   R2 Objects API: `dr-sumya-gallery` contains **zero objects**, so there is no
   orphan (D1 also confirms 0 gallery rows). Nothing to glance at; Task 12 closed.

## If a booking ever 403s in production

Roll back to **`5423d45e`** first, debug after. A Turnstile hostname
misconfiguration rejects every patient silently and looks identical to the
system working. Since F9 there is a second way to produce the same silent
failure: a CSP that blocks `challenges.cloudflare.com` in `script-src` or
`frame-src` stops the widget minting a token, and every booking 403s with no
console error a patient would ever see. **If the symptom appeared right after a
header change, roll back to `f64b9221` (the last pre-F9 deploy) rather than all
the way to `5423d45e`.**

## Before you add markup or build HTML in JS

`script-src` has no `'unsafe-inline'`. An `onclick=` (or any `on*=`) attribute is
dropped silently — no console error, no failed request, no failing test, the
button just does nothing. Use a listener or a `data-` attribute.
`tests/headers.test.mjs` scans `public/` and fails if one reappears.

```bash
npx wrangler pages deployment list --project-name=dr-sumya-pervin-portfolio
```

Then redeploy `5423d45e` from the Pages dashboard.
