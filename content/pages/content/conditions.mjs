// Medical dermatology workstream — docx §5.5 hub, §5.6–5.17 conditions.
// Copy transcribed from content/source/website-content.md (docx Part 5).
export const conditions = {
  '/medical-dermatology/': {
    crumbLabel: 'Medical dermatology',
    h1: 'Skin, hair and nail conditions',
    lede: 'Most skin conditions are common, treatable and badly served by guesswork. Here you get a diagnosis first, an explanation you understand, and a plan that is checked over time, not just one prescription.',
    sections: [
      {
        h2: 'Conditions',
        cards: [
          ['Acne and acne scarring', 'A treatable medical condition, not a hygiene problem. Diagnosis first, then evidence-based treatment.', '/conditions/acne/', 'Care Plan'],
          ['Eczema (dermatitis)', 'Flares, steroid fear and the creams that make it worse — controlled over months with a written plan.', '/conditions/eczema/', 'Care Plan'],
          ['Psoriasis', 'Controlled, not cured — with a plan and follow-up timed to the condition.', '/conditions/psoriasis/', 'Care Plan'],
          ['Fungal infection (ringworm, tinea)', 'Why it keeps coming back — and the cream that makes it worse. Same-visit microscopy.', '/conditions/fungal-infection/'],
          ['Melasma and pigmentation', 'Manageable, not curable — what works, what to avoid, and why sun protection is the whole game.', '/conditions/melasma/'],
          ['Hair loss (alopecia)', 'Distinct causes, distinct treatments. Trichoscopy and a plan, not miracle oils.', '/conditions/hair-loss/'],
          ['Hives and skin allergy (urticaria)', 'What triggers look like, when allergy testing helps, and how long control takes.', '/conditions/urticaria-allergy/', 'Care Plan'],
          ['Vitiligo', 'Treatment works better the earlier it starts. Honest expectations and monitored response.', '/conditions/vitiligo/', 'Care Plan'],
          ['Seborrhoeic keratosis & DPN', 'Harmless growths, easy to remove — once a dermatologist confirms that is what they are.', '/conditions/seborrhoeic-keratosis-dpn/'],
          ['Precancerous skin lesions', 'Why Bangladesh’s arsenic history makes regular skin checks matter, and how these are treated.', '/conditions/precancerous-skin-lesions/'],
          ['Skin cancer and mole checks', 'The ABCDE rule plus the palms-soles-nails rule for South Asian skin, with priority slots.', '/conditions/skin-cancer/'],
          ['Confidential sexual health', 'Private slots, no reason needed when booking, discreet invoice wording, evidence-based care.', '/conditions/sexual-health/'],
        ],
      },
      {
        h2: 'Conditions that last months deserve a plan that lasts months',
        body: 'For eczema, psoriasis, acne, hives and vitiligo, a 6-month Care Plan bundles your follow-ups and photo reviews for less than paying visit by visit. It is offered only after diagnosis.',
      },
    ],
    links: [['Care plans', '/prices/'], ['Mole check tool', '/tools/mole-check/']],
  },

  '/conditions/acne/': {
    crumbLabel: 'Acne',
    h1: 'Acne treatment in Dhaka — a plan, not a cream of the month',
    lede: 'Acne is a long-term condition of the oil glands and hair follicles. It is very treatable, but most treatments take 8–12 weeks to show their full effect. Most of our work is choosing the right combination for your skin and keeping you on it long enough for it to work.',
    sections: [
      { h2: 'What it is', body: 'Blocked pores (blackheads, whiteheads), inflamed spots and, in more severe acne, deep painful lumps that can leave marks and scars. Hormones, genetics, some cosmetics and some medicines all play a part.' },
      { h2: 'What makes it worse', bullets: [
        'Heavy, oily make-up and hair oils on the forehead',
        'Picking and squeezing (the main cause of dark marks)',
        'Steroid creams and “mixed” creams from the pharmacy',
        'Some gym supplements and anabolic steroids',
        'Stopping treatment as soon as it starts working',
      ] },
      { h2: 'How we diagnose it', body: 'We grade your acne, check for scarring and dark marks, and ask about periods, hair growth and medicines. Hormone tests are ordered only if there are signs of a hormonal cause (such as polycystic ovary syndrome).' },
      { h2: 'Treatment options', defs: [
        ['Creams and gels:', 'retinoids, benzoyl peroxide, azelaic acid. These are the foundation for almost everyone.'],
        ['Tablets:', 'antibiotics for a limited course, always combined with a cream to prevent resistance. Hormonal treatment for suitable women.'],
        ['Isotretinoin', 'for severe or scarring acne, with blood monitoring and strict pregnancy prevention.'],
        ['In-clinic help:', 'extraction, chemical peels, steroid injection for painful cysts.'],
        ['Afterwards:', 'treating marks and scars once the acne is controlled.'],
      ] },
      { h2: 'What will not work', bullets: [
        'Toothpaste, lemon, or “anti-acne” face packs',
        'Antibiotic tablets alone, or repeated without a review',
        'Steroid creams, which can cause a stubborn rash that looks like acne',
        'Facials as the main treatment for active acne',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Painful nodules, sudden severe acne, acne with fever or joint pain, or low mood linked to your skin.' },
    ],
    cost: 'Specialist Consultation ৳2,000 · follow-up ৳1,200 · Core Care Plan ৳6,500 for 6 months · acne extraction ৳2,500 · [[licence:targeted peel ৳7,000 (from licence)]].',
    faqs: [
      ['Will my acne come back?', 'It can. A maintenance cream after clearing reduces the chance considerably.'],
      ['How soon will I see a change?', 'Usually some improvement by week 6 and a clear difference by week 12.'],
      ['Is isotretinoin safe?', 'In the right patient, with monitoring, it is one of the most effective medicines in dermatology. We explain every risk before prescribing.'],
    ],
    links: [['Acne scars', '/concerns/acne-scars/'], ['Chemical peels', '/treatments/chemical-peel/'], ['Care plans', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: skin articles', '/learn/']],
  },

  '/conditions/sexual-health/': {
    crumbLabel: 'Confidential sexual health',
    h1: 'Confidential sexual health care',
    lede: 'Dr. Sumya is a specialist in Skin & Venereal Diseases. If you are worried about a sore, a rash, discharge, warts or a possible infection, you can see her privately, without judgement, and without giving a reason when you book.',
    sections: [
      { h2: 'What it is', body: 'Common concerns: genital warts, herpes, syphilis, fungal and bacterial infections, itching, and worries after a risk. Many are easily treated. Some need tests and partner care.' },
      { h2: 'How we diagnose it', body: 'A private examination and the right tests, explained before they are done. Results are shared only with you.' },
      { h2: 'Treatment options', defs: [
        ['Treatment', 'of the infection, with a written plan'],
        ['Wart treatment', 'by freezing or electrosurgery'],
        ['Testing,', 'including referral for HIV and hepatitis testing where needed'],
        ['Advice', 'on protecting partners'],
      ] },
      { h2: 'What will not work', bullets: [
        'Buying antibiotics without a diagnosis',
        'Delaying because of embarrassment. Everything here is confidential.',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Severe pain, fever with genital sores, or symptoms in pregnancy.' },
    ],
    cost: 'Private consultation ৳2,000 (a private time slot; your invoice reads “Specialist consultation”).',
    links: [['Privacy policy', '/privacy/'], ['Prices', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Book a consultation', '/book/'], ['Learn: skin articles', '/learn/']],
  },

  '/conditions/eczema/': {
    crumbLabel: 'Eczema',
    h1: 'Eczema — calm the itch, then keep it calm',
    lede: 'Eczema (dermatitis) is an itchy, inflamed skin condition that comes and goes. It can’t be cured once and for all, but it can usually be controlled well, and most flare-ups can be prevented.',
    sections: [
      { h2: 'What it is', body: 'Dry, itchy, red or darkened patches, often in skin folds, on hands or on the face. Types include atopic eczema (often since childhood), contact dermatitis (from something touching the skin) and hand eczema.' },
      { h2: 'What makes it worse', bullets: [
        'Hot showers, harsh soaps and detergents',
        'Sweat and synthetic fabrics in Dhaka’s humidity',
        'Stopping moisturiser once the skin looks better',
        'Strong steroid creams used without guidance',
      ] },
      { h2: 'How we diagnose it', body: 'A careful history and examination. Where an allergy to something touching the skin is suspected, we may recommend a patch test, which takes three visits in one week.' },
      { h2: 'Treatment options', defs: [
        ['Daily emollients', 'and soap substitutes, which is the foundation'],
        ['Topical steroids', 'of the right strength, for the right number of days, with a written plan for stepping down'],
        ['Steroid-free creams', '(calcineurin inhibitors) for the face and folds'],
        ['Phototherapy (NB-UVB)', 'for widespread eczema (Year 2)'],
        ['Tablets or injections', 'for severe eczema, with blood monitoring where required'],
      ] },
      { h2: 'What will not work', bullets: [
        'Switching cream every week',
        'Herbal or “cooling” oils with fragrance',
        'Antibiotic–steroid–antifungal “mixed” creams',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Weeping, crusted or painful eczema (possible infection), sudden spread with fever, or eczema around the eyes.' },
    ],
    cost: 'Comprehensive Assessment ৳3,500 recommended for long-standing eczema · patch test ৳6,500 · Core Care Plan ৳6,500 / Complete ৳12,500.',
    links: [['Hives &amp; allergy', '/conditions/urticaria-allergy/'], ['Phototherapy', '/treatments/light-therapy/'], ['Care plans', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: skin articles', '/learn/']],
  },

  '/conditions/psoriasis/': {
    crumbLabel: 'Psoriasis',
    h1: 'Psoriasis — long-term control, properly monitored',
    lede: 'Psoriasis is a long-term immune condition that speeds up skin turnover, causing thick, scaly patches. It is not contagious. With the right plan, most people get their skin clear or nearly clear.',
    sections: [
      { h2: 'What it is', body: 'Well-defined red or dark, scaly plaques, often on elbows, knees, scalp and lower back. Nails and joints can be affected. Psoriasis is also linked with heart and metabolic health, so we look at the whole person.' },
      { h2: 'How we diagnose it', body: 'Clinical examination, a severity score, and questions about joint pain. Before tablets we arrange blood tests, and for some treatments a chest X-ray.' },
      { h2: 'Treatment options', defs: [
        ['Creams:', 'steroid plus vitamin D combinations, scalp treatments'],
        ['Phototherapy (NB-UVB)', 'two to three sessions a week (Year 2)'],
        ['Tablets:', 'methotrexate, acitretin or ciclosporin, with monitoring'],
        ['Biologic injections', 'for severe psoriasis, where suitable and affordable'],
      ] },
      { h2: 'What will not work', bullets: [
        'Long-term strong steroid creams on large areas',
        'Oral steroid tablets (these can trigger severe flares)',
        '“Permanent cure” treatments',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Rapidly spreading redness over most of the body, pustules with fever, or swollen painful joints.' },
    ],
    cost: 'Comprehensive Assessment ৳3,500 · follow-up ৳1,200 · [[year2:NB-UVB ৳800 per session or 12 for ৳8,800 (Year 2)]] · Care Plans from ৳6,500.',
    links: [['Eczema', '/conditions/eczema/'], ['Phototherapy', '/treatments/light-therapy/'], ['Care plans', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: skin articles', '/learn/']],
  },

  '/conditions/fungal-infection/': {
    crumbLabel: 'Fungal infection',
    h1: 'Ringworm that keeps coming back? Let’s confirm it first.',
    lede: 'Fungal skin infections (tinea, ringworm) have become harder to treat across South Asia. A big reason is cream that contains a steroid, which hides the infection while letting it spread. We confirm the diagnosis with a quick test, then treat it properly.',
    sections: [
      { h2: 'What it is', body: 'Itchy, ring-shaped or spreading patches in the groin, waist, under the breasts, buttocks, or on the body, feet and nails. It spreads within families and through shared towels and clothes.' },
      { h2: 'What makes it worse', bullets: [
        'Steroid or “mixed” creams',
        'Tight, damp clothing in hot weather',
        'Stopping treatment when the itch settles',
        'Untreated family members',
      ] },
      { h2: 'How we diagnose it', body: 'A scraping looked at under our microscope (KOH test), with results in the same visit, from the licence stage onwards. Sometimes a culture is sent to a partner lab.' },
      { h2: 'Treatment options', defs: [
        ['Antifungal creams', 'for limited infections, used two weeks beyond clearing'],
        ['Antifungal tablets', 'for widespread or recurrent infection, at the right dose and duration'],
        ['Household plan:', 'treating close contacts, laundry at high temperature, separate towels'],
        ['Nails', 'need months of treatment; we explain realistic outcomes'],
      ] },
      { h2: 'What will not work', bullets: [
        'Any cream with a steroid in it',
        'Stopping when the itch stops',
        'Treating yourself but not your family',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Painful, pus-filled patches on the scalp (especially in children), or infection in people with diabetes or low immunity.' },
    ],
    cost: 'Specialist Consultation ৳2,000 · KOH microscopy ৳500 (included in the Signature Review) · follow-up ৳1,200.',
    links: [['Eczema', '/conditions/eczema/'], ['Prices: tests', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: why ringworm returns', '/learn/ringworm-keeps-coming-back/']],
  },

  '/conditions/melasma/': {
    crumbLabel: 'Melasma',
    h1: 'Melasma — manageable, not curable. Here’s what actually works.',
    lede: 'Melasma causes brown or grey-brown patches on the cheeks, forehead, upper lip and nose. It is triggered by sunlight, visible light, heat and hormones. Anyone promising to remove it forever is not telling you the truth. With the right plan, most patients see clear lightening within 3 months.',
    sections: [
      { h2: 'What it is', body: 'A long-term pigment condition, commonest in women aged 25–50 and very common in South Asian skin. It is different from freckles, sun spots and the dark marks left by acne. Those need different treatment.' },
      { h2: 'What makes it worse', bullets: [
        'Sun and visible light (including through windows)',
        'Heat: kitchens, saunas, hot yoga',
        'Hormonal pills, pregnancy',
        'Harsh scrubs and unprescribed bleaching creams',
      ] },
      { h2: 'How we diagnose it', body: 'Examination under Wood’s lamp and dermoscopy to tell melasma from other pigment problems and judge how deep it is.' },
      { h2: 'Treatment options', defs: [
        ['Daily tinted, broad-spectrum sunscreen', '(iron oxides block visible light), the single most important step'],
        ['Prescription creams:', 'short supervised courses of combination cream, then maintenance with azelaic acid and similar'],
        ['Tranexamic acid tablets', 'for suitable patients, after screening for clot risk'],
        ['Chemical peels', 'as a booster'],
        ['Laser toning', 'only as an add-on to the plan, never on its own, because melasma can rebound'],
      ] },
      { h2: 'What will not work', bullets: [
        'Bleaching or “whitening” creams bought without a prescription',
        'Glutathione drips',
        'Aggressive lasers as the first treatment',
      ] },
      { h2: 'When to see a doctor quickly', body: 'A single dark spot that is changing, bleeding, or looks different from the rest (see Mole check).' },
    ],
    cost: 'Comprehensive Assessment ৳3,500 (includes baseline photos for honest comparison) · [[licence:targeted peel ৳7,000 · ]][[laser:full-face laser toning ৳9,000 (laser stage)]].',
    links: [['Sun damage', '/concerns/sun-damage-pigmentation/'], ['Chemical peel', '/treatments/chemical-peel/'], ['Pigment laser', '/treatments/pigment-laser/'], ['Skin type guide', '/tools/skin-type-guide/'], ['Prices', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: melasma', '/learn/melasma-manageable-not-curable/']],
  },

  '/conditions/hair-loss/': {
    crumbLabel: 'Hair loss',
    h1: 'Hair fall — find the type first, then treat it',
    lede: 'Hair loss has many causes, and each is treated differently. A scalp examination with trichoscopy, plus a few targeted blood tests, usually tells us which type you have and what will help.',
    sections: [
      { h2: 'What it is', body: 'Common types: pattern hair loss (men and women), shedding after illness, stress or childbirth (telogen effluvium), patchy loss (alopecia areata), and scalp disease such as dandruff or fungal infection.' },
      { h2: 'How we diagnose it', body: 'Trichoscopy (a magnified look at the scalp), a pull test, and blood tests when they change treatment (for example iron, thyroid, vitamin D).' },
      { h2: 'Treatment options', defs: [
        ['Minoxidil', '(topical, or low-dose tablets for suitable patients)'],
        ['Finasteride', 'for suitable men'],
        ['PRP therapy', 'as an add-on for pattern hair loss'],
        ['Steroid injections', 'for alopecia areata'],
        ['Treating the trigger', 'such as low iron, thyroid problems or scalp inflammation'],
      ] },
      { h2: 'What will not work', bullets: [
        'Hair oils marketed as “regrowth” treatments',
        'Supplements without a proven deficiency',
        'PRP for shedding that will settle on its own',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Rapid patchy loss, a painful or scarring scalp, or hair loss with other symptoms like weight change.' },
    ],
    cost: 'Signature Skin & Hair Review ৳6,000 (includes trichoscopy) or Specialist ৳2,000 + trichoscopy ৳1,500 · [[licence:PRP ৳9,000 per session, 3 sessions ৳24,000]].',
    links: [['Hair thinning', '/concerns/hair-thinning/'], ['PRP therapy', '/treatments/prp-therapy/'], ['Intralesional injection', '/treatments/intralesional-injection/'], ['Prices', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: hair fall', '/learn/hair-fall-after-illness/']],
  },

  '/conditions/urticaria-allergy/': {
    crumbLabel: 'Hives and allergy',
    h1: 'Hives that won’t go away',
    lede: 'Hives (urticaria) are itchy, raised welts that come and go, sometimes with swelling of the lips or eyes. If they last more than six weeks, they are usually not caused by a food allergy. A clear plan controls them in most people.',
    sections: [
      { h2: 'What it is', body: 'Short-lived welts that move around the body. Acute hives often follow an infection or medicine. Chronic hives are usually driven by the immune system, not by something you ate.' },
      { h2: 'How we diagnose it', body: 'A careful history matters more than an allergy panel. Blood tests are limited to what will change treatment.' },
      { h2: 'Treatment options', defs: [
        ['Non-drowsy antihistamines', 'taken daily at the correct dose (sometimes higher than the packet says, under supervision)'],
        ['Avoid triggers', 'such as some painkillers (NSAIDs)'],
        ['Specialist injections', 'for hives that do not respond'],
      ] },
      { h2: 'What will not work', bullets: [
        'Large “allergy panels” that test hundreds of foods',
        'Repeated steroid injections',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Emergency: swelling of the tongue or throat, difficulty breathing, or feeling faint. Go to the nearest emergency department now.' },
    ],
    cost: 'Specialist Consultation ৳2,000 · follow-up ৳1,200 · Core Care Plan ৳6,500.',
    links: [['Eczema', '/conditions/eczema/'], ['Prices', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: skin articles', '/learn/']],
  },

  '/conditions/vitiligo/': {
    crumbLabel: 'Vitiligo',
    h1: 'Vitiligo — treatment, and respect',
    lede: 'Vitiligo causes white patches where the skin has lost its pigment. It is not contagious, it is not caused by food, and it is nobody’s fault. Treatment can bring colour back in many patients, especially on the face, and can stop it spreading.',
    sections: [
      { h2: 'What it is', body: 'An autoimmune condition. It may stay stable for years or spread. Sometimes it occurs with thyroid problems, which we check.' },
      { h2: 'How we diagnose it', body: 'Wood’s lamp examination to map active areas, photographs to track change, and a thyroid test where indicated.' },
      { h2: 'Treatment options', defs: [
        ['Creams:', 'steroid or calcineurin-inhibitor creams'],
        ['NB-UVB phototherapy', 'the most effective treatment for widespread vitiligo (Year 2)'],
        ['Short courses of tablets', 'to stop rapid spread'],
        ['Surgical grafting', 'for small patches that have been stable for at least a year (referral)'],
      ] },
      { h2: 'What will not work', bullets: [
        'Fish-and-milk food myths',
        'Unproven herbal pastes on the skin',
        'Promises of complete repigmentation',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Rapidly spreading new patches: early treatment can slow this.' },
    ],
    cost: 'Comprehensive Assessment ৳3,500 (includes photo mapping) · [[year2:NB-UVB card 12 for ৳8,800 (Year 2)]] · Care Plans from ৳6,500.',
    links: [['Phototherapy', '/treatments/light-therapy/'], ['Care plans', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: skin articles', '/learn/']],
  },

  '/conditions/seborrhoeic-keratosis-dpn/': {
    crumbLabel: 'Seborrhoeic keratosis &amp; DPN',
    h1: 'Small dark bumps on the face and neck',
    lede: 'Dermatosis papulosa nigra (DPN) and seborrhoeic keratoses are harmless growths that become more common with age. Removing them is optional and cosmetic, but it is quick, and done well it leaves little trace.',
    sections: [
      { h2: 'What it is', body: 'DPN: small dark, smooth bumps on the cheeks, around the eyes and on the neck, very common in brown skin and often in families. Seborrhoeic keratoses: larger, “stuck-on” waxy spots on the body.' },
      { h2: 'How we diagnose it', body: 'Dermoscopy confirms they are benign. Anything unusual is biopsied first.' },
      { h2: 'Treatment options', defs: [
        ['Electrosurgery / radiofrequency', 'removal, the usual choice for DPN'],
        ['Cryotherapy', 'for larger keratoses on the body'],
        ['Fine curettage', 'for raised lesions'],
      ] },
      { h2: 'What will not work', bullets: [
        'Home removal with threads, acids or “wart pens”',
        'Removing a changing spot without checking it first',
      ] },
      { h2: 'When to see a doctor quickly', body: 'If a spot bleeds, grows quickly or looks different from the others, have it checked.' },
    ],
    cost: '[[licence:Electrosurgery by number of lesions: up to 10 ৳3,500 · 11–30 ৳6,000 · 31+ / full face and neck ৳9,000 (from licence).]]',
    links: [['Electrosurgery', '/treatments/electrosurgery/'], ['Cryotherapy', '/treatments/cryotherapy/'], ['Mole check', '/tools/mole-check/'], ['Prices', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: skin articles', '/learn/']],
  },

  '/conditions/precancerous-skin-lesions/': {
    crumbLabel: 'Precancerous lesions',
    h1: 'Rough spots that need a closer look',
    lede: 'Some rough or scaly patches are early warning signs that can turn into skin cancer if ignored. In Bangladesh, an important cause is long-term arsenic in drinking water. That causes hard, corn-like spots on the palms and soles (arsenical keratosis).',
    sections: [
      { h2: 'What it is', body: 'Arsenical keratosis: hard, yellowish, rough bumps on palms and soles, sometimes with spotty dark and light skin on the body. Actinic keratosis: rough, sun-damaged spots on the face and hands, less common in brown skin. Bowen’s disease: a slowly growing scaly patch.' },
      { h2: 'How we diagnose it', body: 'Examination and dermoscopy, a biopsy if any spot is thick, painful, bleeding or growing, and questions about current and past water sources.' },
      { h2: 'Treatment options', defs: [
        ['Cryotherapy', 'or curettage for thin lesions'],
        ['Prescription creams', 'for multiple lesions'],
        ['Excision', 'for thick or suspicious lesions'],
        ['Safe water:', 'we tell you how to get your tube-well tested (local DPHE/upazila arrangements) and why it matters for your family'],
      ] },
      { h2: 'What will not work', bullets: [
        'Cutting or filing them at home',
        'Ignoring a lesion that becomes an ulcer',
      ] },
      { h2: 'When to see a doctor quickly', body: 'A spot that grows, bleeds, ulcerates or becomes painful.' },
    ],
    cost: 'Specialist Consultation ৳2,000 · [[licence:cryotherapy from Band A ৳2,000 · ]]biopsy ৳4,000 + lab at cost.',
    links: [['Skin cancer', '/conditions/skin-cancer/'], ['Skin biopsy', '/treatments/skin-biopsy/'], ['Cryotherapy', '/treatments/cryotherapy/'], ['Prices', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: arsenic and skin', '/learn/arsenic-and-skin/']],
  },

  '/conditions/skin-cancer/': {
    crumbLabel: 'Skin cancer',
    h1: 'Mole checks and skin cancer screening',
    lede: 'Skin cancer is less common in brown skin, but when it happens it is often found late, partly because it appears in places people don’t check: the palms, soles and under the nails. A dermatologist’s check with dermoscopy takes minutes.',
    sections: [
      { h2: 'What it is', body: 'Basal cell carcinoma (BCC): a slow-growing, often shiny or pigmented bump that does not heal; in Asian skin it is often dark. Squamous cell carcinoma (SCC): a growing, crusted or ulcerated lump, sometimes on old scars, burns or arsenical keratoses. Melanoma: a changing dark spot. In brown skin the commonest type appears on the soles, palms or as a dark stripe in a nail.' },
      { h2: 'How we diagnose it', body: 'Full skin check with dermoscopy. The ABCDE rule: Asymmetry, Border, Colour, Diameter, Evolving. Plus our extra rule for brown skin: check palms, soles and nails. A biopsy confirms any suspicion.' },
      { h2: 'Treatment options', defs: [
        ['Surgical removal', 'of small, low-risk cancers here (see Excision)'],
        ['Referral', 'to surgical oncology, plastic surgery or radiation oncology for larger or high-risk cancers, Mohs surgery or radiation therapy. We help you through it and stay involved in follow-up'],
        ['Prevention:', 'sun protection, safe water, and covering and checking old burns and scars'],
      ] },
      { h2: 'What will not work', bullets: [
        'Home “mole removal” creams',
        'Waiting to see if a changing spot settles',
      ] },
      { h2: 'When to see a doctor quickly', body: 'A new dark stripe in a nail, a dark spot on the sole that is changing, any sore that has not healed in 4 weeks, or a mole that bleeds.' },
    ],
    cost: 'Specialist Consultation ৳2,000 · digital mole record (up to 5 lesions) ৳2,500 · full-body mole map in the Signature Review ৳6,000 · biopsy ৳4,000 + lab at cost.',
    links: [['Mole check tool', '/tools/mole-check/'], ['Skin biopsy', '/treatments/skin-biopsy/'], ['Excision', '/treatments/excision-surgery/'], ['Prices', '/prices/'], ['Prepare for your visit', '/consultation-prep/'], ['Learn: the ABCDE rule', '/learn/abcde-rule-brown-skin/']],
  },
};
