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
