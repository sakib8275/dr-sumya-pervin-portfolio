# Change Request 2026-10-02 — decisions, reconciliation, and governance

Programme: rebuild the one-pager as the multi-page site defined by the owner's
Change Request folder. This file records what was decided, what the source
documents govern, and what is still open. `STATUS.md` carries execution state.

## Sources

| File | Role |
|---|---|
| `Change Request/Dr Sumya - Sample Layout - Home.html` | Home wireframe + copy (annotated 1–12) |
| `Change Request/Dr Sumya - Sample Layout - Prices.html` | Prices wireframe + copy (annotated 1–9) |
| `Change Request/Dr Sumya - Interlinking Pathway Map.html` | 5-stage pathway model + retention loop |
| `Change Request/Dr Sumya - Website Content Service Pages  Price List.docx` | **Source of truth**: strategy, sitemap (3.2), page-by-page copy (5.1–5.40), master price list (Part 6), layouts, sign-off register (Part 9) |

The docx is extracted (tables included) to `content/source/website-content.md`
by `scripts/extract_change_docx.py` — rerun it whenever the docx is edited;
never hand-edit the markdown.

## Owner decisions (2026-10-02)

1. **Visual identity: the current gold/Outfit design system remains.** The
   mockups' teal/Fraunces/Manrope look is wireframe-only — structure, content
   and commercial logic are adopted; typography, palette and components are not.
2. **Scope of first deliverable: full skeleton, then fill.** Every URL in the
   docx sitemap exists on day one; Home and Prices carry real content, the rest
   are marked stubs until Phase 3.
3. **Pricing truth: the docx.** Figures publish only after reconciliation
   (below); discrepancies are flagged, never guessed.
4. **The 2027 Centre is real and public** — utility bar note + Centre pages,
   with current chambers remaining the bookable locations.
5. **Booking is rebuilt for tiers now** (Specialist / Comprehensive / Signature /
   Procedure Assessment), not deferred.

## Price reconciliation: mockups vs docx (Part 6)

Every figure the mockups show matches the docx master list:

- Consultations ৳2,000 / ৳3,500 / ৳6,000; Procedure Assessment ৳1,500 adjusted
  against session 1; follow-ups ৳1,200 (≤30d) / ৳1,500 (31–90d); ৳0 report and
  complication reviews.
- Care Plans: Core ৳6,500 (anchor ৳8,400) / Complete ৳12,500 (anchor up to ৳20,900).
- Laser bands XS/S/M/L = ৳3,000/5,000/9,000/14,000, courses 15k/25k/45k/70k,
  full body ৳35,000 (course ৳1,75,000), +25% doctor-performed.
- Bridal/Groom ৳26,000 / ৳32,000 / ৳55,000 (single-price anchors 31,900 /
  37,900 / 66,600 — arithmetic verified in docx 6.7).

**No discrepancies found.** The docx is strictly larger: tests (6.3), skin
surgery bands (6.4), aesthetic treatments (6.5), pigment laser + Year-2 devices
(6.6), and pricing policies (6.8). Prices page renders all of Part 6 with each
row carrying its docx **tag** (see gates below).

## Governance found in the docx (Part 9) — read before any deploy

1. **Publish gates.** The docx's closing instruction: publish in gates —
   *doctor pages and condition pages now; Centre and consultation prices at
   OPENING; procedures at LICENCE; laser at LASER*; price rows carry OPENING /
   LICENCE / LASER / YEAR 2 tags. Implementation: every price row and gated
   page is tagged in the build data and rendered according to one
   `ACTIVE_GATE` constant in the page build. **The site is built complete;
   which gates are public is a one-line owner decision at deploy time.**
2. **Sign-offs D-01 … D-12 are pending** (fees changed from an older tracker —
   D-01 notes the old ৳1,500/৳1,000; mystery-shop validation D-04; EMI banks
   D-10; centre name/phone/photos D-12). None of these block building; all of
   them block *publishing* the affected figures.
3. **D-06 drops exosome, carboxytherapy and mesotherapy** (weak evidence,
   conflicts with the ethics page). The current one-pager offers *Facial & Neck
   Mesotherapy* and *Carboxytherapy* as bookable services — the rebuild removes
   them from the service list and booking options.
4. The sitemap follows docx §3.2 verbatim (slugs were specified there); it
   references a "Developer Change Request v1.0" **not present in the folder** —
   §3.2's URL table is used as the authority. If v1.0 exists elsewhere, supply
   it before Phase 3 fill.

## Open inputs (owner)

- Real phone number (mockups and docx carry placeholders; D-12).
- Centre name, address details, photos (D-12; existing assets reused meanwhile).
- SMS provider decision — tiered booking promises "serial + time window by SMS"
  (docx 1.1); the stack has email + WhatsApp only. Fallback: email + WhatsApp
  deep-link confirmation until supplied.
- EMI partner-bank list (D-10) before showing EMI lines as anything but generic.
- Gate flips (when D-01–D-08 sign off).

## Effect on the current site

- The one-pager keeps serving until cutover; nothing deploys without the owner.
- Nav/footer/booking UI are replaced by the multi-page shell (Phase 1–2); the
  A13 nav idea is superseded by the docx §3.1 navigation (mega-menus, mobile
  sticky Call/WhatsApp/Book bar).
- Booking tiers (Phase 2) change the D1 schema, the appointments API, the CMS
  list and the digest; validation rules and Turnstile carry over.

## M1 mobile pass (2026-10-03) — docx §7.3 compliance

The owner rejected the first phone layout ("Don't like the mobile view at all",
2026-10-03). M1 closes the gap against the docx's own mobile rules:

| §7.3 rule | State |
|---|---|
| Single column; recommended card **first** | Done — `.rec` tiers/plans get `order:-1` ≤820px |
| Price tables → stacked cards (band → price → inclusions → who badge) | Done — builder emits `data-th`, CSS card-ises rows ≤820px |
| Sticky bottom bar Call · WhatsApp · Book, ≥44px targets | Done — kept, now 48px cells + safe-area padding + top hairline |
| Tabs become horizontal scroll strip | Already true; fixed the `top:0` bug that hid them under the sticky header |
| Drawer ≥44px rows | Done — 48px rows (was 37px); light ivory panel + scrim, Prices & About added (both were missing), focus trap + focus return |
| Hero under 150 KB, LCP < 2.5 s | No hero image on phones (compact credential strip); text LCP |
| Estimator becomes a 4-step wizard | **Deferred deviation** — the flat 3-control form works at 375px; revisit with Phase 2's booking JS rebuild |

Also: the utility bar renders one slim line on phones (was a 5-line wall), and
both hero CTAs fit the first phone screen. Pinned by
`tests/e2e/mobile-site.spec.mjs` (6 specs at 375×667) and the mobile-shell node
test. Screenshots for owner review: `.zcode/m1-shots/` (untracked).

## Phase 3 content fill (2026-10-03) — all 57 pages carry real copy

The honest stub template is gone: **zero pages render "In preparation".** A generic
renderer (`content/pages/article.mjs`) turns structured content
(`content/pages/content.mjs`, split into `conditions` / `treatments` / `aesthetic`
/ `visit`) into HTML using the existing gold components. The docx page-by-page copy
(Part 5) maps 1:1 onto the content shape:

| Docx § | Pages | Content module |
|---|---|---|
| 5.5–5.17 | Medical hub + 12 conditions | `content/conditions.mjs` |
| 5.18–5.25 | Skin surgery hub + 6 procedures + patient guide | `content/treatments.mjs` |
| 5.26–5.36 | Aesthetic hub + 7 concerns + 8 treatments + bridal | `content/aesthetic.mjs` |
| 5.3, 5.4, 5.39, 5.40 | The Centre, chambers, products, tools, FAQ, contact, legal | `content/visit.mjs` |

- **Renderer blocks:** h2+body, bullet lists, bold-lead definition lists, card
  grids (hubs), a "What it typically costs here" note, FAQ `<details>` accordions,
  and a related-links row. Home / Prices / About / What-we-don't-offer stay bespoke.
- **Fidelity:** copy is transcribed from `content/source/website-content.md`; where
  the docx gives only a one-line brief (FAQ, contact, legal) the copy is authored
  from verified site facts and the §1.4 voice rules, never invented clinical claims.
- **Guard:** `tests/pages.test.mjs` still pins that every internal link resolves —
  docx "Links out" targets with no page are rendered as body text, never as links.
- **Interactive tools (2026-10-03):** the mole check, skin-type guide and
  prepare-for-visit are now working tools — bespoke bodies in
  `content/pages/tools.mjs`, client-side logic in `public/js/site.js` (CSP-safe,
  nothing stored). Pinned by `tests/e2e/site-tools.spec.mjs` (4 specs).
## Phase 2 booking tiers (2026-10-03) — `/book/` is a working form

- `migrations/004_consultation_tiers.sql` adds `consultation_type` and
  `preferred_session` (both optional — the one-pager omits them, so its rows keep
  `''` and its tests are untouched).
- `POST /api/appointments` validates the tier against a fixed allowlist
  (Specialist / Comprehensive / Signature / Procedure Assessment / Private) and
  the session (Morning / Afternoon / Evening), and stores both.
- The form is a bespoke body (`content/pages/book.mjs`) with Turnstile (action
  `booking`, the same widget the one-pager uses) and the pre-hydration
  disabled-button guard; `public/js/site.js` submits to the same endpoint. The
  CMS appointment row shows the tier and session.
- **Verified:** 4 new API tests + `tests/e2e/site-booking.spec.mjs` (2 specs).

## Admin console (2026-10-03) — the multi-page site had no CMS

The admin panel (login/2FA, appointments, gallery, edit-copy, settings, backup,
PIN reset) existed only in the one-pager. Before cutover, a standalone
**`public/admin/index.html`** (noindex, login-gated) now carries the CMS markup
and boots the existing `js/cms.js` through a small bridge, `public/js/admin.js`.
It reuses the one-pager `style.css` for the CMS component styles and
`<base href="/">` so cms.js's on-demand qrcode path resolves. Pinned by
`tests/e2e/admin-console.spec.mjs`.

## Cutover (2026-10-03) — the multi-page site now serves from the root

`BASE` is `''` and `npm run build:site` writes the 57-page site to `public/` root,
replacing the one-pager's `index.html`. The builder cleans only its own outputs
(page directories, root `index.html`, `sitemap.xml`, the retired `/new/` tree) and
never the hand-maintained `css/`, `js/`, `assets/`, `admin/`.

The one-pager suites were **migrated, not just dropped**: `booking-submit`/
`booking-failure` fold into `site-booking`; `cms-xss`, `csv-export`, `lazy-admin`
now drive `/admin/`; `a11y-dialogs` moved to the admin dialogs + the site skip
link; `formguard` became the /book/ disabled-button guard. `whatsapp-gating`,
`service-modal`, `scrollspy`, `sticky-nav`, `richtext-render`, `hero-reveal`, and
the `services`/`schedule-mirror` node tests retired with the surfaces they pinned.
`forgot-password.js` now mails `/admin/#reset?token=`, and the dead one-pager
scripts (`main.js`, `richtext.js`, `formguard.js`) were removed (`style.css` and
`cms.js` stay — the admin console uses them).

- **Still open (owner inputs, before deploy):** the D-12 phone/prices-date
  placeholders, the live `ACTIVE_GATE` decision, and the `/admin/` URL hand-off.
  Deploy is owner-gated; the live site is untouched until then.
- **Verified:** `npm run build:site` → 57 pages; `npm test` → 276/276;
  `npm run test:e2e` → 26/26.
