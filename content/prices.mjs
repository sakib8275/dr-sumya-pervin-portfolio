// The master price list, docx Part 6 verbatim (figures reconciled against the
// mockups 2026-10-02 — no discrepancies; see docs/CHANGE-REQUEST-2026-10-02.md).
//
// `who` renders as the badge defined in the Prices legend: Dr / Dr+N / N.
// `gate` mirrors the docx tags (OPENING / LICENCE / LASER / YEAR 2) — rows
// whose gate is beyond the live one are hidden at build time (staging shows
// everything with its badge).

export const WHO = {
  dr: { label: 'Dr', text: 'Dr. Sumya personally' },
  drn: { label: 'Dr+N', text: 'Dr. Sumya with a trained nurse' },
  n: { label: 'N', text: 'Trained nurse under Dr. Sumya’s written protocol, doctor on site' },
};

export const FOLLOW_UPS = [
  ['৳1,200', 'Follow-up within 30 days'],
  ['৳1,500', 'Follow-up 31–90 days'],
  ['৳0', 'Report review within 14 days'],
  ['৳0', 'Complication review within 7 days of any procedure'],
];

export const SECTIONS = [
  {
    id: 'consultations', tab: 'Consultations', gate: 'opening',
    head: 'Consultations',
    lede: 'All consultations at the Centre are with Dr. Sumya personally. Choose the depth you need — the doctor will tell you honestly if a shorter visit is enough.',
    cards: [
      { name: 'Specialist Consultation', price: '৳2,000', meta: ['dr', '20–25 min'],
        incl: ['Dermoscopy', 'Written diagnosis &amp; care plan', 'Report review within 14 days ৳0'] },
      { name: 'Comprehensive Assessment', price: '৳3,500', meta: ['dr', '40 min'], rec: 'Best for long-standing concerns',
        incl: ['Everything in Specialist', 'Baseline photographs', 'Costed options, every route', '1 follow-up included'] },
      { name: 'Signature Skin &amp; Hair Review', price: '৳6,000', meta: ['dr', '60 min'],
        incl: ['Mole map or trichoscopy', 'Same-visit lab tests', 'Typed report'] },
      { name: 'Procedure Assessment', price: '৳1,500', meta: ['dr', '15–20 min'],
        incl: ['Laser / aesthetic / surgery suitability', 'Patch test if needed', 'Fully adjusted against session 1'] },
    ],
    rows: [
      ['Private consultation (sexual health)', 'Standard', '৳2,000', 'Private slot · no reason needed when booking · invoice reads “Specialist consultation”', 'dr'],
      ['Video follow-up', 'Existing patients', '৳1,200', 'Scheduled video review; prescription renewed if appropriate', 'dr'],
      ['WhatsApp photo review', 'Existing patients', '৳600', 'Photo assessed by Dr. Sumya within 24 hours with a written reply', 'dr'],
    ],
  },
  {
    id: 'care-plans', tab: 'Care Plans', gate: 'opening',
    head: '6-month Care Plans',
    lede: 'For acne, eczema, psoriasis, hives, vitiligo, hair loss and melasma — conditions controlled over months, not one visit. Offered only after diagnosis. Cancel any time; unused value is refunded pro rata.',
    plans: [
      { name: 'Core Care Plan', price: '৳6,500', was: 'Pay-as-you-go ৳8,400', save: 'You keep ৳1,900',
        incl: [['4 follow-up visits with Dr. Sumya', '৳4,800'], ['6 monthly WhatsApp photo reviews', '৳3,600'], ['Reminders matched to your prescription', 'Included'], ['Priority serial', 'Included']] },
      { name: 'Complete Care Plan', price: '৳12,500', was: 'Pay-as-you-go up to ৳20,900', save: 'You keep up to ৳8,400', rec: 'Recommended when procedures are part of the plan',
        incl: [['Everything in Core', '৳8,400'], ['Month-3 Comprehensive re-assessment', '৳3,500'], ['2 in-clinic sessions: peel, extraction, injection or 6 phototherapy', 'up to ৳9,000'], ['Progress photo timeline you keep', 'Included']] },
    ],
  },
  {
    id: 'tests', tab: 'Tests', gate: 'opening',
    head: 'Tests and diagnostics',
    lede: 'Dermoscopy and Wood’s lamp are included in every consultation. Tests are suggested only when they change treatment, and priced before anything is done.',
    table: ['Service', 'Band / tier', 'Price', 'What you get', 'Who'],
    rows: [
      ['Trichoscopy', 'Scalp', '৳1,500', 'Magnified scalp mapping with images (included in Signature)', 'dr'],
      ['Digital mole record', 'Up to 5 lesions', '৳2,500', 'Dermoscopic images stored for comparison at 3–12 months', 'dr'],
      ['Full-body mole map', 'Whole skin', '৳6,000', 'Body photography + dermoscopy of all suspicious lesions (as Signature Review)', 'dr'],
      ['KOH fungal microscopy', 'Same visit', '৳500', 'Scraping, microscopy, result explained in the same visit', 'drn'],
      ['Patch test', 'Standard series', '৳6,500', '3 visits in one week (apply, first reading, final reading), written allergen advice', 'drn'],
      ['Skin biopsy', 'Per biopsy', '৳4,000 + lab', 'Procedure, dressing, stitches and removal · histopathology at the lab’s price (typically ৳2,000–3,500, receipt shown) · result review ৳0', 'dr'],
    ],
  },
  {
    id: 'surgery', tab: 'Skin Surgery', gate: 'licence',
    head: 'Skin surgery and procedures',
    lede: 'Defined bands instead of “from ৳…” — the size or number of lesions decides your price. Numbing, dressings, stitch removal and one review are inside every price.',
    table: ['Service', 'Band / tier', 'Price', 'What you get', 'Who'],
    rows: [
      ['Cryotherapy', 'A · 1–3 lesions', '৳2,000', 'Per session · aftercare sheet · complication review ৳0', 'dr'],
      ['Cryotherapy', 'B · 4–10 lesions', '৳3,500', 'As above', 'dr'],
      ['Cryotherapy', 'C · 11+ lesions', '৳5,000', 'As above', 'dr'],
      ['Electrosurgery', 'A · up to 10', '৳3,500', 'Numbing, treatment, aftercare ointment, 2-week check by WhatsApp photo', 'dr'],
      ['Electrosurgery', 'B · 11–30', '৳6,000', 'As above', 'dr'],
      ['Electrosurgery', 'C · 31+ or full face and neck', '৳9,000', 'As above', 'dr'],
      ['Excision surgery', 'A · under 1 cm', '৳8,000', 'Local anaesthetic, sterile set, layered sutures, dressing, stitch removal, one review · histopathology at lab price', 'dr'],
      ['Excision surgery', 'B · 1–2 cm', '৳12,000', 'As above', 'dr'],
      ['Excision surgery', 'C · 2–3 cm or facial layered closure', '৳18,000', 'As above', 'dr'],
      ['Excision surgery', 'Larger or complex', 'Written quote / referral', 'After assessment', 'dr'],
      ['Intralesional injection', '1–2 lesions', '৳2,000', 'Medicine, injection, follow-up interval advice', 'dr'],
      ['Intralesional injection', '3+ or keloid &gt; 3 cm', '৳3,500', 'As above', 'dr'],
      ['Acne extraction', 'Face', '৳2,500', 'Sterile extraction of comedones and milia, calming mask', 'dr'],
      ['Ingrown toenail', 'Per toe', '৳8,000', 'Partial nail avulsion with phenol, dressing, review', 'dr'],
    ],
  },
  {
    id: 'aesthetic', tab: 'Aesthetic', gate: 'licence',
    head: 'Aesthetic treatments',
    lede: 'Evidence-based treatments for South Asian skin. Botulinum toxin and fillers are not offered at launch (Day-90 decision; DGDA-registered products only).',
    table: ['Service', 'Band / tier', 'Price', 'What you get', 'Who'],
    rows: [
      ['Medical facial', 'Essential', '৳4,000', '45 min · cleanse, hydradermabrasion, extraction, hydration, SPF', 'n'],
      ['Medical facial', 'Advanced', '৳6,000', '60 min · Essential + targeted serum infusion + LED (blue/red)', 'n'],
      ['Chemical peel', 'Superficial', '৳4,500', 'Skin prep advice, peel, neutraliser, post-peel kit · course of 4: 4th session half price (৳15,750)', 'drn'],
      ['Chemical peel', 'Targeted (melasma, acne, texture)', '৳7,000', 'Doctor-applied combination or TCA-based peel · course of 4 ৳24,500', 'dr'],
      ['Chemical peel', 'Back / body', '৳8,000', 'Back or chest acne / marks', 'dr'],
      ['Microneedling', 'Face', '৳7,500', 'Numbing, single-use sterile cartridge, post-care kit', 'dr'],
      ['Microneedling', 'Face + PRP', '৳12,000', 'Above + PRP prepared in closed system', 'dr'],
      ['Microneedling', 'RF microneedling, full face', '৳18,000', 'Insulated radiofrequency needles for scars and laxity', 'dr'],
      ['PRP therapy', 'Scalp, per session', '৳9,000', 'Blood draw, closed kit, processing, numbing · 3 sessions ৳24,000 (you keep ৳3,000)', 'dr'],
      ['PRP therapy', 'Under-eye / face', '৳10,000', 'As above', 'dr'],
    ],
  },
  {
    id: 'laser', tab: 'Laser', gate: 'laser',
    head: 'Laser and light',
    lede: 'Laser hair removal is priced by area band, not by guesswork — the course price is six sessions for the price of five. A maintenance session after a course is 50% of the band price. Prefer Dr. Sumya to perform every session: +25%. Female patients are treated by female staff.',
    table: ['Service', 'Band / tier', 'Price', 'What you get', 'Who'],
    rows: [
      ['Laser hair removal', 'XS · upper lip, chin, sideburns, between brows', '৳3,000', 'Course ৳15,000 · cooling, numbing if needed, settings logged · first session supervised by Dr. Sumya', 'n'],
      ['Laser hair removal', 'S · underarms, full face, bikini line, men’s beard line / neck', '৳5,000', 'Course ৳25,000', 'n'],
      ['Laser hair removal', 'M · forearms, lower legs, chest, abdomen, upper or lower back', '৳9,000', 'Course ৳45,000', 'n'],
      ['Laser hair removal', 'L · full arms, full legs, full back', '৳14,000', 'Course ৳70,000', 'n'],
      ['Laser hair removal', 'Full body (excluding face)', '৳35,000', 'Course ৳1,75,000 · two-room scheduling, 2–2.5 hours', 'drn'],
      ['Pigment laser', 'Spot · up to 5 lesions', '৳5,000', 'Eye protection, cooling, aftercare', 'dr'],
      ['Pigment laser', 'Full-face toning (melasma add-on only)', '৳9,000', 'Only within a medical melasma plan', 'drn'],
      ['Pigment laser', 'Nevus of Ota / Hori’s naevi', '৳12,000', 'Per session; 6–10 sessions typical', 'dr'],
      ['Pigment laser', 'Tattoo · S ≤ 5 cm² / M 5–25 cm² / L &gt; 25 cm²', '৳5,000 / 9,000 / 14,000', 'Per session; 6–12 sessions typical', 'dr'],
      ['Pigment laser', 'Carbon laser peel', '৳6,500', 'For oily, congested skin', 'drn'],
      ['Fractional CO2', 'Spot / full face / full face + PRP', '৳8,000 / 20,000 / 26,000', 'Numbing, conservative brown-skin settings, day-7 review ৳0 · Year-2 device', 'dr', 'year2'],
      ['NB-UVB phototherapy', 'Per session / 12-session card', '৳800 / ৳8,800', 'Dose set by doctor, logged each session (12 for the price of 11) · Year-2 device', 'n', 'year2'],
      ['IPL / vascular', '—', 'On device decision', 'Selective use for redness on suitable skin types · Year-2 device', 'dr', 'year2'],
    ],
  },
  {
    id: 'bridal', tab: 'Bridal & Groom', gate: 'licence',
    head: 'Bridal &amp; Groom Skin Programmes',
    lede: 'Doctor-planned 8–12 week programmes. Start at least 10 weeks before the event. No whitening products, at any tier.',
    plans: [
      { name: 'Groom Programme', price: '৳26,000', was: 'Value at single prices ৳31,900',
        incl: [['Comprehensive Assessment', '✓'], ['2 Advanced medical facials', '✓'], ['2 targeted peels', '✓'], ['2 follow-ups', '✓']] },
      { name: 'Bridal Essential', price: '৳32,000', was: 'Value at single prices ৳37,900', rec: 'Recommended for most brides',
        incl: [['Comprehensive Assessment', '✓'], ['3 Advanced medical facials', '✓'], ['2 targeted peels', '✓'], ['2 follow-ups + week-of-event check', '✓']] },
      { name: 'Bridal Signature', price: '৳55,000', was: 'Value at single prices ৳66,600',
        incl: [['Signature Skin &amp; Hair Review', '✓'], ['4 Advanced facials · 3 targeted peels', '✓'], ['1 microneedling with PRP', '✓'], ['3 follow-ups + event-week priority slot', '✓']] },
    ],
  },
  {
    id: 'policies', tab: 'Policies', gate: 'opening',
    head: 'Our pricing promises',
    lede: 'The rules every price above is governed by. Also published on the Terms page.',
    prom: [
      ['Nothing hidden', 'Consumables, numbing cream, dressings, standard aftercare kit and aftercare advice are included. Only laboratory tests are passed through at cost, with the receipt shown.'],
      ['No package at first visit', 'Courses, Care Plans and programmes are offered only after a diagnosis or Procedure Assessment. Pay-per-session is always available.'],
      ['Your money back', 'Stop a course any time; sessions already used are charged at the single price and the balance is refunded within 7 working days.'],
      ['Price lock', 'A quoted course price holds for 12 months from purchase.'],
      ['Cancellation', 'Free with 24 hours’ notice; under 24 hours, 50% of the consultation fee; no-show, full consultation fee. Procedure slots: one free reschedule.'],
      ['Payment', 'Cash, Visa/Mastercard/Amex, bKash, Nagad. 0% EMI for 3–12 months on partner bank credit cards for amounts ≥ ৳15,000. Total always shown beside the monthly figure.'],
      ['Products', 'Sold at MRP; never compulsory; never bundled into a treatment price.'],
      ['VAT &amp; review', 'Displayed prices exclude VAT; 15% VAT is added at checkout. Prices are reviewed every 6 months, the date is shown on the page, and changes never affect courses already bought.'],
    ],
  },
];

// Course-cost estimator data (docx 5.37): the concerns/areas the interactive
// estimator offers, straight from the rows above.
export const ESTIMATOR = {
  items: [
    { concern: 'Unwanted hair', areas: [
      ['XS · upper lip, chin, sideburns', 3000, 15000], ['S · underarms, full face, bikini line', 5000, 25000],
      ['M · forearms, lower legs, chest', 9000, 45000], ['L · full arms, full legs, full back', 14000, 70000],
      ['Full body (excluding face)', 35000, 175000]],
      sessions: 6, freeSession: true, doctorUplift: 1.25 },
    { concern: 'Chemical peel course', areas: [
      ['Superficial × 4 (4th half price)', 4500, 15750], ['Targeted × 4 (melasma, acne, texture)', 7000, 24500]],
      sessions: 4, freeSession: false },
    { concern: 'PRP for hair', areas: [['Scalp × 3 sessions', 9000, 24000]], sessions: 3, freeSession: false },
  ],
};
