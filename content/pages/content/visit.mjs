// Visit / trust / tools / legal workstream — docx §5.3 The Centre, §5.4 chambers,
// §5.39 products & skin type, §5.40 booking/prep/tools/legal. Where the docx
// gives only a one-line brief (FAQ, contact, legal), the copy is authored from
// verified site facts and the docx voice rules (§1.4), not invented.
import { SITE } from '../../site.mjs';

export const visit = {
  '/learn/': {
    crumbLabel: 'Learn',
    h1: 'Articles written and reviewed by Dr. Sumya',
    lede: 'Bylined, referenced explanations of the conditions we treat. Every article is written or reviewed by Dr. Sumya Pervin, FCPS (Skin &amp; VD), and links back to the page where you can act on it.',
    sections: [
      { h2: 'Pigmentation &amp; pigment', bullets: [
        '**Melasma is manageable, not curable — what actually works** — 6 min read · Reviewed by Dr. Sumya Pervin, FCPS',
        '**Arsenic and your skin** — 7 min read · Reviewed by Dr. Sumya Pervin, FCPS',
      ] },
      { h2: 'Skin, hair &amp; nails', bullets: [
        '**Why ringworm keeps coming back — and the cream that makes it worse** — 5 min read · Reviewed by Dr. Sumya Pervin, FCPS',
        '**Hair fall after illness or childbirth** — 5 min read · Reviewed by Dr. Sumya Pervin, FCPS',
      ] },
      { h2: 'Screening &amp; aesthetics', bullets: [
        '**The ABCDE rule — plus the palms, soles and nails rule for South Asian skin** — 4 min read · Reviewed by Dr. Sumya Pervin, FCPS',
        '**Laser hair removal: what “permanent” really means** — 6 min read · Reviewed by Dr. Sumya Pervin, FCPS',
      ] },
    ],
    links: [['Mole check tool', '/tools/mole-check/'], ['Skin type guide', '/tools/skin-type-guide/'], ['All conditions', '/medical-dermatology/']],
  },

  '/the-centre/': {
    crumbLabel: 'The Centre',
    h1: 'Built like a clinic, not a salon.',
    lede: 'Every room has a clinical reason to exist. Here is what you will see, and why it matters to your care.',
    sections: [
      { h2: 'Inside the Centre', defs: [
        ['Reception:', 'The full price list is on the wall, not in a drawer. Pay by cash, card, bKash or Nagad. Our front-office team is not paid sales commission, so nobody here has a reason to upsell you.'],
        ['Waiting lounge:', 'A live screen shows your serial and the expected wait. Water and tea are on us. Short skin-health videos replace television noise. A family corner keeps companions comfortable.'],
        ['Consultation suites:', 'Private, quiet rooms with dermoscopy and magnified lighting. Your first visit runs 20–60 minutes depending on the depth you choose. You leave with a written plan.'],
        ['In-house lab:', 'Fungal microscopy (KOH) gives an answer while you wait, so treatment starts on a confirmed diagnosis. PRP is prepared in a closed, sterile system in front of you.'],
        ['Clinical photography studio:', 'Fixed lighting and background, so progress photos are honest comparisons. Photos are taken only with your signed consent and kept in your medical record.'],
        ['Procedure room:', 'Autoclave-sterilised instruments, single-use consumables and a sterile field for biopsies, mole and cyst removal, and injections.'],
        ['Medical aesthetics room:', 'Facials and peels performed by trained nurses following Dr. Sumya’s written protocols, with the doctor on site.'],
        ['Laser suite:', 'Interlocked door, warning light, eye protection for everyone in the room and smoke-plume extraction. Settings are chosen for brown skin and recorded every session.'],
        ['Phototherapy cabin (Year 2):', 'Narrowband UVB for psoriasis, vitiligo and eczema. Doses are measured and logged.'],
      ] },
      { h2: 'Our team', body: 'Roles at opening: Medical Director, registered nurse, dermatology assistant, two front-office executives. The laser nurse and visiting consultants join at full launch. Every team member is credentialed against the same written standards, so your care does not depend on who is on duty.' },
      { h2: 'Getting here', body: `Ring Road / Tajmahal Road corridor, Mohammadpur, Dhaka. Landmark: [LANDMARK — owner to confirm]. Parking: [details — owner to confirm]. Rickshaw and CNG drop-off at the gate. The Centre opens in 2027; until then Dr. Sumya consults at the chambers in Shyamoli.` },
    ],
    links: [['Prices', '/prices/'], ['Laser hair removal', '/treatments/laser-hair-removal/'], ['Skin surgery', '/skin-surgery/'], ['Light therapy', '/treatments/light-therapy/']],
  },

  '/chambers/': {
    crumbLabel: 'Chambers',
    h1: 'Where Dr. Sumya consults now',
    lede: 'Until the Centre opens in 2027, Dr. Sumya consults at two chambers in Shyamoli. Fees at these chambers follow each hospital’s own tariff; the published prices on this website apply to the Centre.',
    sections: [
      { h2: 'Alliance Hospital Limited', body: '24/3 Khilji Road (Ring Road), Shyamoli, Dhaka. Visiting days: Saturday – Thursday, 5:00 – 8:00 PM.' },
      { h2: 'Dhaka Central International Medical College (DCIMCH)', body: '2/1, Ring Road, Shyamoli, Dhaka. Visiting days: Saturday – Wednesday, 3:00 – 5:00 PM. Friday closed.' },
      { h2: 'What to bring', bullets: [
        'Every cream, ointment, oil or soap you use — bring the tubes, not the names',
        'Previous prescriptions and reports',
        'A list of other medicines you take',
        'For hair problems, come without oil; for nails, come without polish',
        'Photos of the problem at its worst, if it comes and goes',
      ] },
    ],
    links: [['Prepare for your visit', '/consultation-prep/'], ['Book a consultation', '/book/']],
  },

  '/skin-care-products/': {
    crumbLabel: 'Skin care products',
    h1: 'Skin care, simplified',
    lede: 'A small shelf of products we actually recommend: sunscreens, gentle cleansers, moisturisers and barrier creams. All are registered under the Drugs and Cosmetics Act 2023 and sold at MRP. You are never required to buy them, and a prescription is never tied to a purchase here.',
    sections: [
      { h2: 'What we stock', bullets: [
        'Sunscreens suitable for Dhaka’s UV and humidity, including tinted and non-tinted options',
        'Gentle, fragrance-free cleansers and soap substitutes',
        'Moisturisers and barrier creams for eczema-prone and dry skin',
      ] },
      { h2: 'What we do not do', bullets: [
        'We do not sell whitening creams, “fairness” products or unregistered imports',
        'We do not bundle products into treatment prices or make them a condition of care',
      ] },
    ],
    links: [['Skin type guide', '/tools/skin-type-guide/'], ['Conditions we treat', '/medical-dermatology/'], ['What we don’t offer', '/what-we-do-not-offer/']],
  },

  '/community/': {
    crumbLabel: 'Community',
    h1: 'Skin health beyond the clinic',
    lede: 'Public education and screening work with the Bangladesh dermatology community — because most skin harm we see is preventable and starts outside a clinic.',
    sections: [
      { h2: 'What we do', bullets: [
        'School sun-and-skin talks',
        'A monthly free screening hour for arsenical keratosis and moles (first Saturday)',
        'Public talks with the Bangladesh dermatology community',
        'Volunteer and partner enquiries',
      ] },
    ],
    links: [['Contact us', '/contact/'], ['Mole check tool', '/tools/mole-check/'], ['Precancerous skin lesions', '/conditions/precancerous-skin-lesions/']],
  },

  '/faq/': {
    crumbLabel: 'FAQ',
    h1: 'Questions we are asked most',
    lede: 'Fourteen honest answers about fees, visits, safety and privacy. If your question is not here, message us on WhatsApp.',
    sections: [],
    faqs: [
      ['How much is a first visit?', 'A Specialist Consultation is ৳2,000, a Comprehensive Assessment ৳3,500, and a Signature Skin &amp; Hair Review ৳6,000. A Procedure Assessment for a specific mole, lump or scar is ৳1,500, fully adjusted against session 1 if you proceed. Every fee is published on the Prices page with its inclusions.'],
      ['What is included in the consultation fee?', 'Examination, dermoscopy where it helps, a written diagnosis and care plan, and a report review within 14 days at no extra charge. Deeper tiers add baseline photographs, costed options, included follow-ups and WhatsApp check-ins.'],
      ['Do I need a referral to book?', 'No. You can book directly. If you have reports or previous prescriptions, bring them — they save time and often change the plan.'],
      ['Can I bring a family member?', 'Yes. Companions are welcome, and the Centre has a family corner. For sensitive concerns such as sexual health, you may prefer to come alone; the consultation is private either way.'],
      ['Is there female staff?', 'Yes. A registered female nurse and female front-office staff are part of the team, and a female attendant is present for examinations when requested.'],
      ['How long does a visit take?', 'Between 20 and 60 minutes depending on the depth you choose, plus any same-visit tests. Waiting time is shown on the screen in the lounge.'],
      ['Will I be pushed into packages?', 'No. No package is sold at a first visit. A 6-month Care Plan is offered only after a diagnosis, only if it suits your condition, and never with sales pressure.'],
      ['What is your refund policy?', 'Unused course sessions are refundable. Course prices are locked for 12 months. Full cancellation and refund rules are on the Terms page.'],
      ['Do you offer EMI?', 'Yes. Card, bKash and Nagad are accepted, with 0% EMI options at the Centre. EMI partner banks are confirmed at the time of treatment.'],
      ['Are treatments safe in pregnancy or breastfeeding?', 'Tell us first. Many treatments are deferred during pregnancy and breastfeeding, but safe options exist for most problems. We plan around your situation rather than refusing care.'],
      ['How are results measured?', 'With standardised photographs (only with your consent), a written plan, and reviews timed to the condition. We give honest ranges, never guarantees.'],
      ['How are my photos and information handled?', 'Photos are taken only with signed consent, kept in your medical record, and never edited. You can withdraw consent at any time. Full details are in the Privacy Policy and the Photograph &amp; Consent Policy.'],
      ['What if I have a side effect after treatment?', 'Contact us. A complication review is ৳0, and we will see you promptly. Do not wait for a scheduled follow-up if something worries you.'],
      ['Do you treat children?', 'Yes. Children’s skin is part of general dermatology here, from eczema and birthmarks to infections and hair problems.'],
    ],
    links: [['Book a consultation', '/book/'], ['See prices', '/prices/'], ['Privacy policy', '/privacy/']],
  },

  '/contact/': {
    crumbLabel: 'Contact',
    h1: 'Contact &amp; directions',
    lede: 'We reply within 2 working hours. For a booking, use the booking page and you will receive your serial, time window and what to bring.',
    sections: [
      { h2: 'Current chambers', defs: [
        ['Alliance Hospital Limited:', '24/3 Khilji Road (Ring Road), Shyamoli, Dhaka · Saturday – Thursday, 5:00 – 8:00 PM'],
        ['DCIMCH:', '2/1, Ring Road, Shyamoli, Dhaka · Saturday – Wednesday, 3:00 – 5:00 PM · Friday closed'],
      ] },
      { h2: 'Reach us', defs: [
        ['Phone:', `<a class="tlink" href="tel:${SITE.phoneTel}">${SITE.phone}</a>`],
        ['WhatsApp:', 'Message us and we will reply within 2 working hours during chamber days.'],
        ['Email:', `<a class="tlink" href="mailto:${SITE.email}">${SITE.email}</a> — monitored on working days.`],
      ] },
      { h2: 'Getting here', body: 'Both chambers are on the Ring Road / Khilji Road corridor in Shyamoli. Rickshaw and CNG drop-off is at the gate. Parking is limited — arrive a few minutes early on busy evenings.' },
    ],
    links: [['Book a consultation', '/book/'], ['Current chambers', '/chambers/'], ['Prepare for your visit', '/consultation-prep/']],
  },

  '/privacy/': {
    crumbLabel: 'Privacy policy',
    h1: 'Privacy policy',
    lede: 'How patient information, messages and photographs are handled at Dr. Sumya Pervin’s practice, under Bangladesh’s data-protection law (PDPO 2025).',
    sections: [
      { h2: 'What we collect', body: 'When you book or contact us, we collect your name, mobile number, chosen chamber, preferred day and session, and any reason you choose to give. If you become a patient, we also keep clinical notes, test results and — only with your signed consent — clinical photographs.' },
      { h2: 'How it is used', body: 'Only to provide your care, to contact you about your appointment and follow-up, and to meet legal and medical-record obligations. We do not sell data, and we do not use it for advertising.' },
      { h2: 'Messages and reminders', body: 'By giving your mobile number you consent to appointment and follow-up messages by SMS or WhatsApp. You can ask us to stop non-essential messages at any time; essential clinical contact may still be required for your safety.' },
      { h2: 'Photographs', body: 'Clinical photographs are taken only with signed consent, stored in your medical record, and never edited. You may withdraw consent at any time; see the Photograph &amp; Consent Policy.' },
      { h2: 'Sharing', body: 'We share information only with the clinicians involved in your care, or where the law requires it. Reports you ask us to send to another doctor are sent with your agreement.' },
      { h2: 'Your rights', body: 'You can ask to see the information we hold about you, ask for corrections, or ask us to delete what we are not legally required to keep. Contact the practice to make a request.' },
    ],
    links: [['Photograph &amp; consent policy', '/photo-consent-policy/'], ['Terms of service', '/terms/'], ['Medical disclaimer', '/medical-disclaimer/']],
  },

  '/terms/': {
    crumbLabel: 'Terms of service',
    h1: 'Terms of service',
    lede: 'The rules that apply to appointments, cancellations, refunds and the prices published on this site.',
    sections: [
      { h2: 'Appointments', body: 'A booking request is confirmed when we send your serial and time window by SMS or WhatsApp. Please arrive a few minutes early. If you are late, we will fit you in where we can, but the consultation may be shortened to protect other patients’ time.' },
      { h2: 'Cancellation and refunds', body: 'Please give us as much notice as you can if you cannot attend. Consultation fees for attended visits are not refundable. For treatment courses, unused sessions are refundable. Course prices are locked for 12 months from the date of purchase.' },
      { h2: 'Prices', body: 'Published prices list what each fee includes. Fees at the current hospital chambers follow each hospital’s own tariff; the published prices apply to the Centre. Prices are reviewed periodically and the review date is shown on the Prices page.' },
      { h2: 'Care plans and packages', body: 'A 6-month Care Plan is offered only after a diagnosis and only if it suits your condition. No package is sold at a first visit, and you may always pay session by session instead.' },
      { h2: 'Consent and safety', body: 'Some treatments require written consent, pre-treatment tests, or a pregnancy check. We will explain why before anything is done, and you are free to decline any part of a plan.' },
      { h2: 'Governing law', body: 'These terms are governed by the laws of Bangladesh. Any dispute is subject to the jurisdiction of the courts of Dhaka.' },
    ],
    links: [['Prices', '/prices/'], ['Privacy policy', '/privacy/'], ['Book a consultation', '/book/']],
  },

  '/medical-disclaimer/': {
    crumbLabel: 'Medical disclaimer',
    h1: 'Medical disclaimer',
    lede: 'Information on this site is educational and does not replace an examination.',
    sections: [
      { h2: 'No doctor–patient relationship', body: 'Reading this website, using a tool, or messaging the practice does not create a doctor–patient relationship. A diagnosis can only be made after a proper history and examination.' },
      { h2: 'No prescribing from a photo', body: 'Skin conditions that look alike in a photograph are often treated very differently. We will advise you on what to do next, but we will not prescribe treatment from an image alone.' },
      { h2: 'Tools are guides, not diagnoses', body: 'The mole check and skin type guide are educational tools. They can tell you whether something deserves a professional look; they cannot tell you what it is.' },
      { h2: 'Emergencies', body: 'This site is not for emergencies. If you have severe pain, rapid swelling, difficulty breathing, fever with a rash, or a rapidly changing mole, seek urgent medical care or call the chamber.' },
    ],
    links: [['Book a consultation', '/book/'], ['Privacy policy', '/privacy/'], ['What we don’t offer', '/what-we-do-not-offer/']],
  },

  '/photo-consent-policy/': {
    crumbLabel: 'Photograph &amp; consent policy',
    h1: 'Photograph &amp; consent policy',
    lede: 'Before-and-after photographs: consent first, honest crops, no editing, and your right to withdraw.',
    sections: [
      { h2: 'Consent comes first', body: 'No clinical photograph is taken without your signed consent, and consent for your medical record is separate from consent for any public use. You can decline either without affecting your care.' },
      { h2: 'How photographs are taken', body: 'Clinical photography uses fixed lighting and a fixed background, so progress photos are honest comparisons rather than flattering ones. We do not edit, smooth, brighten or retouch clinical images.' },
      { h2: 'Where they are kept', body: 'Clinical photographs are stored in your medical record and used only for your care. Public before-and-after images, where you have agreed to them, are shown with a consistent crop and without editing.' },
      { h2: 'Withdrawing consent', body: 'You may withdraw consent at any time. We will stop using the images publicly and remove them where we can; images that form part of your legal medical record are retained as required by law.' },
      { h2: 'What we will never do', bullets: [
        'Publish a before-and-after without signed consent',
        'Use photographs taken under different lighting or angles to exaggerate a result',
        'Edit or retouch a clinical image',
        'Use your images in advertising you have not agreed to',
      ] },
    ],
    links: [['Privacy policy', '/privacy/'], ['Terms of service', '/terms/'], ['What we don’t offer', '/what-we-do-not-offer/']],
  },
};
