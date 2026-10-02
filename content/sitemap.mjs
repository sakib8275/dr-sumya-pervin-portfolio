// The full sitemap, docx §3.2 verbatim (slugs, page names), with title tags
// and meta descriptions taken from the docx page-by-page copy (Part 5) where
// specified and written to its voice otherwise. `gate` mirrors the docx
// Status rows; `body` names the bespoke body module — everything else renders
// the Phase-1 stub template with its real metadata and links.
import { SITE } from './site.mjs';
export { href } from './site.mjs';

const T = (s) => `${s} | ${SITE.name}, Dermatologist in Dhaka`;

export const PAGES = [
  // — Real pages (Phase 1) —
  { path: '/', title: 'Dermatologist in Dhaka | Dr. Sumya Pervin, FCPS (Skin & VD)',
    desc: 'Specialist dermatology in Dhaka, diagnosis first. Published prices, written plans, doctor-led procedures. Dr. Sumya Pervin, FCPS, BMDC A-59492.',
    body: 'home' },
  { path: '/prices/', title: 'Prices | Dermatology Centre, Dhaka — What Each Fee Includes',
    desc: 'Every fee published: consultations, care plans, tests, skin surgery, aesthetic and laser treatments, with inclusions and who performs them.',
    body: 'prices' },
  { path: '/about/', title: 'Dr. Sumya Pervin — Dermatologist, FCPS (Skin & VD), Dhaka',
    desc: 'Dr. Sumya Pervin, FCPS (Skin & VD), DDV (BSMMU). Consultant dermatologist in Dhaka. BMDC Reg. A-59492. Diagnosis-first, evidence-based care.',
    body: 'about' },
  { path: '/what-we-do-not-offer/', title: "Treatments We Don't Offer — And Why | Dr. Sumya Pervin",
    desc: 'Whitening drips, steroid creams without diagnosis, instant fairness packages: the treatments we refuse, and the evidence behind each decision.',
    body: 'ethics' },

  // — Hubs —
  { path: '/medical-dermatology/', title: T('Medical Dermatology — Skin, Hair & Nail Conditions'),
    desc: 'Diagnosed properly, treated with evidence, followed up until controlled. Explore 12 condition guides, each linked to the treatments and fees that apply.' },
  { path: '/skin-surgery/', title: T('Skin Surgery & Procedures'),
    desc: 'Moles, lumps and growths: minor skin surgery in a clean procedure room, with lab confirmation when needed.' },
  { path: '/aesthetic-and-laser/', title: T('Aesthetic & Laser — Evidence-Based, South Asian Skin'),
    desc: 'Only what the evidence supports for South Asian skin — planned by a dermatologist. Browse by concern or by treatment.' },
  { path: '/learn/', title: T('Learn — Articles Written and Reviewed by Dr. Sumya'),
    desc: 'Bylined, reviewed, referenced articles on the conditions we treat. Launch set: melasma, ringworm, the ABCDE rule for brown skin, laser hair removal, hair fall, arsenic and skin.' },

  // — Visit / trust pages —
  { path: '/the-centre/', title: T('Inside the Centre — Opening 2027, Ring Road'),
    desc: 'Consultation suites, a laser suite built to clinical standards, and an in-house lab. Built like a clinic, not a salon.', gate: 'opening' },
  { path: '/chambers/', title: T('Current Chambers in Shyamoli, Dhaka'),
    desc: 'Where Dr. Sumya consults now — Alliance Hospital and DCIMCH, Shyamoli — until the Centre opens on Ring Road in 2027.' },
  { path: '/book/', title: T('Book a Consultation'),
    desc: 'Book a Specialist, Comprehensive, Signature or Procedure Assessment consultation. Serial, time window and what to bring, by SMS/WhatsApp.' },
  { path: '/consultation-prep/', title: T('Prepare for Your Visit'),
    desc: 'Seven quick questions and a two-minute guide: what to bring, what your first visit involves, and which consultation depth likely fits.' },
  { path: '/bridal-and-groom/', title: T('Bridal & Groom Skin Programmes'),
    desc: 'Doctor-planned 8–12 week programmes for wedding preparation. No whitening products, at any tier.', gate: 'licence' },
  { path: '/skin-care-products/', title: T('Skin Care Products — Dermatologist-Selected'),
    desc: 'A small shelf of registered sunscreens, cleansers and moisturisers at MRP. Never compulsory, never bundled.', gate: 'opening' },
  { path: '/community/', title: T('Community — Skin Health Beyond the Clinic'),
    desc: 'School sun-and-skin talks, a monthly free screening hour, and public education work with the Bangladesh dermatology community.', gate: 'opening' },
  { path: '/faq/', title: T('FAQ — Fees, Visits, Safety, Privacy'),
    desc: 'Fourteen honest answers: first-visit cost, what is included, female staff, packages, refunds, EMI, pregnancy safety, photos and privacy.' },
  { path: '/contact/', title: T('Contact & Directions'),
    desc: 'Address with landmark, phone, WhatsApp, hours, parking and drop-off. We reply within 2 working hours.' },

  // — Tools —
  { path: '/tools/mole-check/', title: T('Mole Check — Check Your Moles in 5 Minutes'),
    desc: 'The ABCDE rule plus the brown-skin rule: palms, soles and nails, and the ugly-duckling sign. Nothing is stored.' },
  { path: '/tools/skin-type-guide/', title: T('Skin Type Guide — 2 Minutes'),
    desc: 'Six questions to your skin type and sun-reactivity, with a three-step routine for Dhaka’s humidity.' },

  // — 12 condition pages —
  ...[
    ['acne', 'Acne and Acne Scarring', 'Acne is a treatable medical condition, not a hygiene problem. Diagnosis first, then evidence-based treatment — and honest talk about what scarring treatments can and cannot do.'],
    ['eczema', 'Eczema (Dermatitis)', 'Eczema flares, steroid fear and the creams that make it worse: how eczema is diagnosed, controlled over months, and monitored with a written plan.'],
    ['psoriasis', 'Psoriasis', 'Psoriasis is controlled, not cured — with a clear plan and follow-up timed to the condition. Includes phototherapy and care-plan options.'],
    ['fungal-infection', 'Fungal Infection (Ringworm, Tinea)', 'Why ringworm keeps coming back — and the cream that makes it worse. Same-visit fungal microscopy, right treatment, family checks.'],
    ['melasma', 'Melasma and Pigmentation', 'Melasma is manageable, not curable — what actually works, what to avoid, and why sun protection is the whole game in Dhaka.'],
    ['hair-loss', 'Hair Loss (Alopecia)', 'Pattern loss, telogen effluvium, alopecia areata: hair loss has distinct causes with distinct treatments. Trichoscopy and a plan, not miracle oils.'],
    ['urticaria-allergy', 'Hives and Skin Allergy (Urticaria)', 'Acute and chronic hives: what triggers look like, when allergy testing helps, and how long control really takes.'],
    ['vitiligo', 'Vitiligo', 'Vitiligo treatment works better the earlier it starts. Honest expectations, medical options, and how we monitor response with photographs.'],
    ['seborrhoeic-keratosis-dpn', 'Seborrhoeic Keratosis & DPN', 'Harmless growths that are easy to remove — after a dermatologist confirms that is what they are.'],
    ['precancerous-skin-lesions', 'Precancerous Skin Lesions', 'Actinic and arsenical keratosis: why Bangladesh’s arsenic history makes regular skin checks matter, and how these are treated.'],
    ['skin-cancer', 'Skin Cancer and Mole Checks', 'The ABCDE rule plus the palms-soles-nails rule for South Asian skin. Screening, biopsy, treatment and referral — with priority slots for suspicious moles.'],
    ['sexual-health', 'Confidential Sexual Health', 'Private consultation slots, no reason needed when booking, discreet invoice wording, and evidence-based STI care.'],
  ].map(([slug, name, blurb]) => ({
    path: `/conditions/${slug}/`, title: T(`${name} — Diagnosis & Treatment`), desc: blurb,
  })),

  // — 7 concern pages —
  ...[
    ['acne-scars', 'Acne Scars', 'What each scar type responds to: microneedling, RF, peels, pigment laser — ranked for brown skin.'],
    ['wrinkles-ageing-skin', 'Wrinkles & Ageing Skin', 'Prevention that works, treatments with evidence, and what we deliberately do not offer at launch.'],
    ['sun-damage-pigmentation', 'Sun Damage & Pigmentation', 'Sun spots, uneven tone and melasma — telling them apart is the treatment decision.'],
    ['unwanted-hair', 'Unwanted Hair', 'Laser hair removal by area band, with published course prices and a doctor-supervised first session.'],
    ['redness-visible-vessels', 'Redness & Visible Vessels', 'Rosacea-like redness and vessels: diagnosis first, then what helps on South Asian skin.'],
    ['hair-thinning', 'Hair Thinning', 'Medical treatment, PRP and microneedling for thinning hair — what the evidence supports, in that order.'],
    ['body-contouring', 'Body Contouring', 'What we can honestly offer — and why most advertised body contouring is not on our list.'],
  ].map(([slug, name, blurb]) => ({
    path: `/concerns/${slug}/`, title: T(`${name} — Aesthetic Guides`), desc: blurb, gate: 'licence',
  })),

  // — 14 treatment pages (6 surgical + 8 aesthetic) —
  ...[
    ['skin-biopsy', 'Skin Biopsy', 'A small sample, taken for a reason, with the result explained at no extra charge. ৳4,000 + lab at cost.', 'web'],
    ['cryotherapy', 'Cryotherapy (Freezing)', 'Liquid nitrogen for warts and actinic keratosis, priced by lesion count.', 'licence'],
    ['excision-surgery', 'Excision Surgery (Mole, Cyst, Lipoma)', 'Local anaesthetic, layered sutures, stitch removal and one review — inside the price, by size band.', 'licence'],
    ['electrosurgery', 'Electrosurgery (Skin Tags, DPN, ED&C)', 'Numbing, treatment and a two-week WhatsApp-photo check, by number of lesions.', 'licence'],
    ['intralesional-injection', 'Intralesional Injection', 'Keloids, thick scars and cystic acne lesions — medicine, injection and follow-up interval advice.', 'licence'],
    ['skin-cancer-treatment', 'Skin Cancer Treatment & Referral', 'Confirmed diagnosis first; then the right surgery here, or a directed referral when that is better care.', 'licence'],
    ['medical-facial', 'Medical Facial (Hydradermabrasion)', 'Essential and Advanced medical facials — performed by a trained nurse under a written doctor protocol.', 'licence'],
    ['chemical-peel', 'Chemical Peels', 'Superficial, targeted and body peels — doctor-applied when the target is pigment, with course pricing.', 'licence'],
    ['microneedling', 'Microneedling (and RF Microneedling)', 'Sterile single-use cartridges, numbing, post-care kit; RF for scars and laxity.', 'licence'],
    ['prp-therapy', 'PRP Therapy (Hair and Skin)', 'Closed-system preparation, per-session and 3-session pricing, honest evidence framing.', 'licence'],
    ['laser-hair-removal', 'Laser Hair Removal', 'Diode laser by area band; course of 6 for the price of 5; first session supervised by Dr. Sumya.', 'laser'],
    ['pigment-laser', 'Pigment Laser (Q-switched Nd:YAG)', 'Spots, toning within a medical melasma plan, naevi and tattoos — per session, published.', 'laser'],
    ['fractional-co2-laser', 'Fractional CO2 Laser', 'Conservative brown-skin settings, day-7 review included. Year-2 device.', 'year2'],
    ['light-therapy', 'Light Therapy: NB-UVB and IPL', 'Doctor-set doses, logged sessions, 12-for-11 cards. IPL for selected vascular cases.', 'year2'],
  ].map(([slug, name, blurb, gate]) => ({
    path: `/treatments/${slug}/`, title: T(`${name} — Treatment Guide & Price`), desc: blurb, gate,
  })),

  // — Patient guide + legal —
  { path: '/your-procedure/', title: T('Before and After Your Procedure'),
    desc: 'Preparation, aftercare by procedure, what is normal, what is not, and how to reach us. The guide every procedure page links to.' },
  { path: '/privacy/', title: T('Privacy Policy'), desc: 'How patient information, messages and photographs are handled, under Bangladesh’s data-protection law.' },
  { path: '/terms/', title: T('Terms of Service'), desc: 'Appointments, cancellation and refund rules, course price lock, and what the prices on this site include.' },
  { path: '/medical-disclaimer/', title: T('Medical Disclaimer'), desc: 'Information on this site is educational and does not replace an examination.' },
  { path: '/photo-consent-policy/', title: T('Photograph & Consent Policy'), desc: 'Before-and-after photographs: consent first, honest crops, no editing, and your right to withdraw.' },
];
