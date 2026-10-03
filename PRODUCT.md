# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Prospective patients in Dhaka looking for a dermatologist they can trust, usually choosing on a phone and often deciding with family. The docx (Part 1.2) sizes the audiences:

- **Chronic and clinical** (eczema, psoriasis, fungal infection, hives, vitiligo), 40–45%. They need a plain explanation, how diagnosis works, honest timelines, follow-up fees and Care Plans.
- **Acne and acne scars**, 20–25%. Ages 16–30, often with a parent. They need realistic timelines, what not to use, and a staged plan with costs.
- **Pigmentation and melasma**, 15–20%. Women aged 28–50. They need "manageable, not curable", sun protection, and the true role of lasers.
- **Premium aesthetic**, about 10%. Affluent and English-first. They need credentials, hygiene and safety, who performs each treatment, and total course prices.
- **Bridal and groom**, seasonal (November–February). They need a doctor-planned programme with a fixed price and timeline.
- **Confidential sexual health**, 5–10%. They need discretion, the freedom to book without giving a reason, and a plain billing description.

Secondary user: Dr. Sumya and her staff, who use the `/admin/` console to review booking requests and manage gallery and site copy.

## Product Purpose

The site for Dr. Sumya Pervin's dermatology practice. Its promise: **specialist dermatology, diagnosis first, with prices you can see and a plan you can follow.** It turns a visit into an informed booking request at one of her two current Shyamoli chambers. It also prepares the public for her Dermatology Centre, which opens in 2027.

Success means a patient can do three things before they call. Understand their condition in plain language. See exactly what a visit costs and includes. Book at a real chamber on a real consulting day.

## Positioning

The practice is the third option between two flawed ones. The hospital OPD has sound medicine, but you wait two hours for six minutes. The beauty clinic has hospitality, but no dermatologist is in the room and the price changes once you sit down. This practice offers hospital-grade clinical judgement, delivered on time, explained fully, priced in the open and followed up. A beauty clinic could not truthfully copy these:

- **Diagnosis before treatment.** The 5-step consultation is published, tests are ordered only if they change treatment, and nothing is prescribed from a photo.
- **Doctor-led, always disclosed.** Every price shows who performs it (Dr, Dr+N or N).
- **Prices in the open.** Inclusions, operator and course totals are published. There are no "starting from" prices.
- **Ethical limits in public.** A "What we don't offer" page refuses whitening drips, steroid creams without a diagnosis, "instant fairness", treatment from a photo, unregistered injectables and guaranteed results.

## Operating Context

- **Current chambers** (the only bookable locations until the Centre opens):
  - Alliance Hospital Limited, Shyamoli: Saturday–Thursday, 5:00–8:00 PM. Same-day bookings close at 4:30 PM.
  - DCIMCH, Shyamoli: Saturday–Wednesday, 3:00–5:00 PM. Same-day bookings close at 2:30 PM.
  - All times are Dhaka time (UTC+6, no DST). The schedule source is `functions/lib/schedule.js`.
- **The Centre, opening 2027:** Dr. Sumya Pervin's Dermatology Centre, Ring Road, Mohammadpur. Its published fees apply to the Centre. At the current chambers, fees follow each hospital's own tariff.
- **Booking is a request, not a confirmed slot.** The practice replies within 2 working hours by SMS or WhatsApp with a serial number, a time window and what to bring. WhatsApp is the main channel.
- **Local realities** (docx 4.2):
  - Serial-number culture and unpredictable waits.
  - Family decides together.
  - Women often prefer female staff; a chaperone is always available.
  - Cash, card, bKash and Nagad are everyday payment methods.
  - Directions are given by landmark.
  - Monsoon brings fungal infections; wedding season brings aesthetic demand.
- **Publish gates** (docx Part 9): content and prices publish by gate.
  - OPENING: consultations, Care Plans, tests and policies.
  - LICENCE: procedures.
  - LASER: laser treatments.
  - YEAR 2: further devices.
  - The live gate is `opening`. Surgery, aesthetic, laser and bridal prices are withheld until their gates pass.

## Capabilities and Constraints

- **Hosting:** a multi-page static site (63 pages) on Cloudflare Pages + Functions + D1 + R2. It is built from `content/` by `scripts/build-pages.mjs` into `public/`. Only `public/` is published.
- **Security:**
  - The CSP has no `'unsafe-inline'`, so inline event handlers silently fail. Use listeners only.
  - Every `innerHTML` interpolation must be escaped.
  - Public endpoints are protected by Turnstile.
  - The admin uses PIN plus TOTP.
- **Source of truth for prices and copy:** `Change Request/…Price List.docx`, extracted to `content/source/website-content.md`. Figures publish verbatim; discrepancies are flagged, never guessed.
- **Price display:** prices exclude 15% VAT, which is shown beside them. The Taka sign goes before the number, with lakh grouping (৳1,75,000).
- **Pending owner sign-off:**
  - The nav departs from the docx menu (The Centre sits under About; Learn was added).
  - The Signature SP mark (see Brand Commitments).
  - The skin-check clinical wording (`content/pages/tools.mjs` `skinCheck`, urgency copy in `public/js/site.js`).
- **Not deployed:** the live `drsumyapervin.com` is untouched until the owner deploys.

## Brand Commitments

- **Name and credentials:** Dr. Sumya Pervin, MD. MBBS (SSMC), BCS (Health), DDV (BSMMU), FCPS (Skin & VD), BMDC A-59492. Assistant Professor, Department of Skin & VD, Sir Salimullah Medical College & Mitford Hospital.
- **The doctor's photograph is not published** (her request). A credential nameplate stands in for it.
- **Voice** (docx 1.4):
  - Plain English and short sentences; medical terms explained once, in brackets.
  - Numbers over adjectives.
  - No superlatives, comparisons or guarantees.
  - **No colourism** ("fair", "white", "brightening", "glow-up"; use "even tone", "pigmentation").
  - Every clinical page carries a byline and review date.
  - We say what we don't do.
- **Tactics never used** (docx 4.3):
  - False scarcity or countdowns.
  - "Starting from" prices or fake "was" prices.
  - Unconsented or edited before/after photos.
  - Invented or selected testimonials.
  - Selling packages at the first visit.
  - Advertising a service before its licence gate.
  - The test for every nudge: would we be comfortable if the patient saw exactly why it is there?
- **Visual identity, APPROVED 2026-10-04.**
  - The owner's 2026-10-02 decision kept "the current gold/Outfit design system". Outfit remains the typeface.
  - On 2026-10-03 the repo moved to the **Nil & Haldi** palette (indigo + turmeric). On 2026-10-04 Dr. Sumya approved it — she confirmed the rebrand was requested — so it **supersedes the 2026-10-02 gold decision** and is the owner-approved identity. The palette may deploy with the rest of the branch.
- **Logo, OPEN DECISION.** Since 2026-10-04 the site uses the **Signature SP** mark, concept 01 of the logo study in `design/clinic-logo/` (one definition in `content/brand.mjs`). It appears in the header, drawer, footer, hero nameplate, favicon, phone icon and share card (`public/assets/og-card.png`, which replaced the AI-looking `clinic.jpg` as the share image). Like the palette, it is **pending the doctor's sign-off**, and the study notes it is not trademark-cleared.
- **Language:** English is primary. Bangla summaries (`content/bn.mjs`) publish only after Dr. Sumya reads and approves each one. Machine-drafted Bangla never reaches a page unapproved.

## Evidence on Hand

- **Copy and prices:** full page-by-page copy and the master price list in the docx (Parts 5–6).
- **Credentials and experience** (owner-supplied): 15+ years in medical practice, 10+ years in government service (BCS Health), 7+ years as a dermatology specialist.
- **Clinical bylines:** "Written and reviewed by Dr. Sumya Pervin, FCPS (Skin & VD), BMDC A-59492 · Last reviewed October 2026".
- **Photographs:** **no real ones exist yet.** Real chamber and Centre photography is expected later.
  - `public/assets/clinic.jpg` (no longer the share image) and `treatment.jpg` appear AI-generated with non-local subjects. Do not present them, or any generated image, as the practice's real rooms, staff or patients.
- **Reviews:** none. The review section stays empty until real, verified Google reviews exist.
- **Procedure counts:** none. "1,500+ procedures annually" was removed as an unsourced claim; restore it only with a basis.
- **Before/after cases:** none. They publish only with signed consent and identical, unedited lighting.

## Product Principles

1. **Diagnosis before treatment.** Every surface moves a patient toward a proper examination, never toward a purchase made from a photo or a package.
2. **Show the whole price and who earns it.** Inclusions, operator and totals are visible before anyone calls. Ambiguity is a cost the patient should never pay.
3. **Saying no is part of the product.** Publicly refused treatments and stated limits are what make the yes believable.
4. **Respect the patient's time, family and dignity.** Serial and time windows, WhatsApp-first contact, family sharing, modest imagery, a range of brown skin, and no colourism.
5. **Only what is true today.** Gated services, future Centre facilities, reviews and photographs appear only when they are real and cleared.

## Accessibility & Inclusion

- WCAG 2.x AA for text contrast and 3:1 for non-text UI, pinned in `tests/contrast.test.mjs`.
- Every tap target is at least 44px (docx §7.3).
- Content stays visible when JavaScript fails.
- Every animation has a `prefers-reduced-motion` path.
- Bangla renders with Hind Siliguri (loaded only when Bengali text exists).
- Many patients read Bangla more easily than English, so plain English and short sentences are a requirement, not a style.
