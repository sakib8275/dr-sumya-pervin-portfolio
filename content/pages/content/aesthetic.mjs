// Aesthetic & Laser workstream — docx §5.26 hub, §5.27 concern pages,
// §5.28–5.35 treatments, §5.36 bridal & groom.
// Copy transcribed from content/source/website-content.md (docx Part 5).
export const aesthetic = {
  '/aesthetic-and-laser/': {
    crumbLabel: 'Aesthetic &amp; laser',
    h1: 'Aesthetic dermatology, planned by a dermatologist',
    lede: 'Aesthetic treatment on brown skin carries real risk of burns and dark marks in the wrong hands. Every plan here starts with a doctor’s assessment and a patch test where needed. Every price shows who performs the treatment.',
    sections: [
      {
        h2: 'Browse by concern',
        cards: [
          ['Acne scars', 'Marks fade with time and the right creams; scars need procedures. Expect 40–70% improvement, not perfect skin.', '/concerns/acne-scars/', 'Procedure'],
          ['Wrinkles &amp; ageing skin', 'Daily sunscreen and a retinoid do the most. Microneedling and peels improve texture; injectables are not offered at launch.', '/concerns/wrinkles-ageing-skin/', 'Procedure'],
          ['Sun damage &amp; pigmentation', 'Different spots need different tools. Diagnose melasma versus freckles versus post-acne marks first.', '/concerns/sun-damage-pigmentation/', 'Procedure · Laser'],
          ['Unwanted hair', '6–8 sessions reduce hair by most of its density; occasional maintenance is needed. Hormonal causes are checked first.', '/concerns/unwanted-hair/', 'Laser'],
          ['Hair thinning', 'Medical treatment comes first; PRP is an add-on, not a replacement for minoxidil.', '/concerns/hair-thinning/', 'Procedure'],
          ['Redness &amp; visible vessels', 'Rosacea and steroid-induced redness need medical treatment first; vascular laser or IPL is a later option.', '/concerns/redness-visible-vessels/', 'From Year 2'],
          ['Body contouring', 'Not offered yet — devices reduce small fat bulges at a stable weight; they are not weight loss. Join the waitlist.', '/concerns/body-contouring/', 'Not yet offered'],
        ],
      },
      {
        h2: 'Browse by treatment',
        cards: [
          ['Medical facial', 'A clinical facial that cleans, exfoliates and hydrates without harsh scrubs, bleaching agents or “whitening” products.', '/treatments/medical-facial/', 'Procedure'],
          ['Chemical peels', 'A controlled acid solution matched to brown skin for acne, marks, oiliness and texture.', '/treatments/chemical-peel/', 'Procedure'],
          ['Microneedling', 'Fine sterile needles trigger new collagen — one of the safest scar treatments for brown skin.', '/treatments/microneedling/', 'Procedure'],
          ['PRP', 'Prepared from your own blood and injected into the scalp to support hair growth in pattern hair loss.', '/treatments/prp-therapy/', 'Procedure'],
          ['Laser hair removal', 'A diode laser targets the hair root while sparing the skin around it, priced by area band.', '/treatments/laser-hair-removal/', 'Laser'],
          ['Pigment laser', 'A very short-pulse laser for freckles, sun spots, nevus of Ota and tattoos; melasma toning as an add-on only.', '/treatments/pigment-laser/', 'Laser'],
          ['Fractional CO2 laser', 'The most powerful option for acne scars, with more downtime. A Year-2 device.', '/treatments/fractional-co2-laser/', 'From Year 2'],
          ['Light therapy', 'Narrowband UVB for psoriasis, vitiligo and eczema, with carefully selected IPL. A Year-2 service.', '/treatments/light-therapy/', 'From Year 2'],
          ['Bridal &amp; groom', 'Doctor-planned 8–12 week programmes at a fixed price, with every session scheduled backwards from your date.', '/bridal-and-groom/', 'Procedure'],
        ],
      },
      { h2: 'Start with a Procedure Assessment, ৳1,500, fully adjusted against your first session', body: 'Dr. Sumya checks suitability, skin type and medicines, does a patch test if needed, and gives you a written plan with the total course cost. If you don’t go ahead, you only paid for a specialist opinion.' },
    ],
    links: [['Prices', '/prices/'], ['Book a Procedure Assessment', '/book/']],
  },

  '/concerns/acne-scars/': {
    crumbLabel: 'Acne scars',
    h1: 'Acne scars — what can realistically improve',
    lede: 'Types of scars (rolling, boxcar, ice-pick) and dark marks. Marks fade with time and the right creams; scars need procedures. Expect 40–70% improvement over several sessions, not perfect skin. Active acne must be controlled first.',
    sections: [
      { h2: 'Treatment options, ranked', body: 'Subcision is also performed in clinic.', cards: [
        ['Microneedling (± PRP)', 'Fine sterile needles trigger new collagen — one of the safest scar treatments for brown skin.', '/treatments/microneedling/', 'Procedure'],
        ['Chemical peel', 'A controlled peel matched to brown skin for marks, oiliness and texture.', '/treatments/chemical-peel/', 'Procedure'],
        ['Fractional CO2 laser', 'The most powerful option for scars, with more downtime. A Year-2 device.', '/treatments/fractional-co2-laser/', 'From Year 2'],
      ] },
    ],
    links: [['Medical acne care', '/conditions/acne/'], ['Prices', '/prices/'], ['Book a Procedure Assessment', '/book/']],
  },

  '/concerns/wrinkles-ageing-skin/': {
    crumbLabel: 'Wrinkles &amp; ageing skin',
    h1: 'Ageing skin — sensible, evidence-based options',
    lede: 'Daily sunscreen and a retinoid do the most. Microneedling and peels improve texture. Injectables (botulinum toxin, fillers) are not offered at launch, and if added will only use DGDA-registered products.',
    sections: [
      { h2: 'Options, ranked', body: 'A prescribed retinoid plan (by consultation) and daily sunscreen do the most. RF microneedling is a Year-2 option.', cards: [
        ['Microneedling', 'Improves texture and fine lines; RF microneedling is a Year-2 option.', '/treatments/microneedling/', 'Procedure'],
        ['Chemical peel', 'Improves texture and tone, matched to brown skin.', '/treatments/chemical-peel/', 'Procedure'],
      ] },
    ],
    links: [['Prices', '/prices/'], ['Book a Procedure Assessment', '/book/']],
  },

  '/concerns/sun-damage-pigmentation/': {
    crumbLabel: 'Sun damage &amp; pigmentation',
    h1: 'Uneven tone, freckles and sun spots',
    lede: 'Different spots need different tools. Diagnose first — melasma versus freckles versus post-acne marks. Lasers help freckles and sun spots; melasma needs a medical plan.',
    sections: [
      { h2: 'Options, ranked', cards: [
        ['Melasma', 'Manageable, not curable — a medical plan first, and why sun protection is the whole game.', '/conditions/melasma/', 'Care Plan'],
        ['Chemical peel', 'A controlled peel matched to brown skin for marks and uneven tone.', '/treatments/chemical-peel/', 'Procedure'],
        ['Pigment laser', 'Works for freckles and sun spots; for melasma it is only an add-on to a medical plan.', '/treatments/pigment-laser/', 'Laser'],
        ['Medical facial', 'Cleans, exfoliates and hydrates without harsh scrubs or “whitening” products.', '/treatments/medical-facial/', 'Procedure'],
      ] },
    ],
    links: [['Prices', '/prices/'], ['Book a Procedure Assessment', '/book/']],
  },

  '/concerns/unwanted-hair/': {
    crumbLabel: 'Unwanted hair',
    h1: 'Laser hair reduction for brown skin',
    lede: '6–8 sessions reduce hair by most of its density; occasional maintenance is needed. Hormonal causes (e.g. PCOS) are checked first. Female patients are treated by female staff.',
    sections: [
      { h2: 'Options, ranked', body: 'A hormone check (by consultation) is advised first where a hormonal cause such as PCOS is suspected.', cards: [
        ['Laser hair removal', 'A diode laser targets the hair root while sparing the skin around it, priced by area band.', '/treatments/laser-hair-removal/', 'Laser'],
      ] },
    ],
    links: [['Prices', '/prices/'], ['Book a Procedure Assessment', '/book/']],
  },

  '/concerns/hair-thinning/': {
    crumbLabel: 'Hair thinning',
    h1: 'Thinning hair: medical first, procedures second',
    lede: 'Hair thinning is treated medically first. PRP is an add-on, not a replacement for minoxidil.',
    sections: [
      { h2: 'Options, ranked', body: 'The medical hair-loss plan comes first; a Signature Review is also available.', cards: [
        ['Hair loss (alopecia)', 'Pattern loss, telogen effluvium and alopecia areata have distinct causes and treatments.', '/conditions/hair-loss/', 'Care Plan'],
        ['PRP therapy', 'Prepared from your own blood and injected into the scalp to support hair growth in pattern hair loss.', '/treatments/prp-therapy/', 'Procedure'],
      ] },
    ],
    links: [['Prices', '/prices/'], ['Book a Procedure Assessment', '/book/']],
  },

  '/concerns/redness-visible-vessels/': {
    crumbLabel: 'Redness &amp; visible vessels',
    h1: 'Facial redness and thread veins',
    lede: 'Rosacea and steroid-induced redness need medical treatment first; vascular laser or IPL is a later option (Year 2) with careful selection for brown skin.',
    sections: [
      { h2: 'Options, ranked', body: 'A consultation comes first. Vascular laser or IPL is a Year-2 option, used with careful selection for brown skin.', cards: [
        ['Light therapy', 'Narrowband UVB and carefully selected IPL for redness and some pigment. A Year-2 service.', '/treatments/light-therapy/', 'From Year 2'],
      ] },
    ],
    links: [['Prices', '/prices/'], ['Book a Comprehensive Assessment', '/book/']],
  },

  '/concerns/body-contouring/': {
    crumbLabel: 'Body contouring',
    h1: 'Body contouring — not offered yet, and why',
    lede: 'Devices can reduce small fat bulges in people at a stable weight; they are not weight loss. We will add a device only if we can offer it with evidence, fair pricing and aftercare. Join the waitlist to be told first.',
    sections: [
      { h2: 'Not offered at launch', body: 'We will add a body-contouring device only when we can offer it with evidence, fair pricing and aftercare. Join the waitlist to be told first.' },
    ],
    links: [['Book a Procedure Assessment', '/book/']],
  },

  '/treatments/medical-facial/': {
    crumbLabel: 'Medical facial',
    h1: 'Medical facials, designed by a dermatologist',
    lede: 'A clinical facial that cleans, exfoliates and hydrates without harsh scrubs, bleaching agents or “whitening” products. It is good for congested or dull skin and as preparation before an event.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Tiers', 'Essential ৳4,000 (45 min): cleanse, hydradermabrasion, extraction, hydration, SPF. Advanced ৳6,000 (60 min): Essential + targeted serum infusion + LED light (blue for acne or red for calming).'],
        ['Who performs', 'Trained nurse under Dr. Sumya’s written protocol (N), doctor on site.'],
        ['Downtime', 'None.'],
        ['Frequency', 'Every 3–4 weeks if desired.'],
      ] },
      { h2: 'How it works', body: 'A vortex-suction tip exfoliates and clears pores while infusing serums chosen for your skin type. Products and settings follow a written protocol.' },
      { h2: 'Before and after', body: 'Avoid strong actives for 24 hours; wear sunscreen.' },
      { h2: 'Possible side effects', body: 'Temporary redness. Not suitable during active eczema, infection or flaring acne. These are treated medically first.' },
    ],
    cost: 'Essential ৳4,000 (45 min) · Advanced ৳6,000 (60 min).',
    links: [['Acne', '/conditions/acne/'], ['Chemical peels', '/treatments/chemical-peel/'], ['Bridal &amp; groom', '/bridal-and-groom/'], ['Prices', '/prices/']],
  },

  '/treatments/chemical-peel/': {
    crumbLabel: 'Chemical peels',
    h1: 'Chemical peels matched to brown skin',
    lede: 'A controlled acid solution removes damaged surface layers and improves acne, marks, oiliness and texture. In brown skin, the right peel at the right strength, after skin preparation, is what prevents dark marks.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Tiers per session', 'Superficial ৳4,500 (glycolic, salicylic, mandelic, lactic). Targeted ৳7,000 (combination or TCA-based peels for melasma, acne or texture, doctor-applied). Back / body ৳8,000.'],
        ['Sessions', 'Usually 4–6, every 2–4 weeks.'],
        ['Course', 'Pay per session, or a course of 4 with the 4th session half price (Superficial ৳15,750 · Targeted ৳24,500). Offered only after assessment.'],
        ['Who performs', 'Superficial: Dr or N · Targeted and body: Dr.'],
        ['Downtime', 'Superficial: mild flaking 2–3 days · Targeted: 4–7 days.'],
      ] },
      { h2: 'How it works', body: 'Skin preparation with prescribed creams for 2–4 weeks, a test spot if needed, then the peel is applied for a timed period and neutralised.' },
      { h2: 'Is it safe for brown skin?', body: 'Yes, with preparation, conservative strengths and strict sun protection. We avoid deep peels on darker skin.' },
      { h2: 'Before and after', body: 'No scrubbing or picking; gentle cleanser and moisturiser; sunscreen every 2–3 hours outdoors.' },
      { h2: 'Possible side effects', body: 'Redness, stinging, dark marks (PIH) if the skin is not prepared or protected, rarely blistering.' },
    ],
    cost: 'Superficial ৳4,500 · Targeted ৳7,000 · Back / body ৳8,000 per session.',
    links: [['Acne', '/conditions/acne/'], ['Melasma', '/conditions/melasma/'], ['Acne scars', '/concerns/acne-scars/'], ['Prices', '/prices/']],
  },

  '/treatments/microneedling/': {
    crumbLabel: 'Microneedling',
    h1: 'Microneedling for acne scars and texture',
    lede: 'Fine sterile needles create controlled micro-injuries that trigger new collagen. It is one of the safest scar treatments for brown skin.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Tiers per session', 'Face ৳7,500 · Face + PRP ৳12,000 · RF microneedling full face ৳18,000 (Year 2).'],
        ['Sessions', '3–6, every 4–6 weeks.'],
        ['Who performs', 'Dr. Sumya (Dr).'],
        ['Downtime', '1–3 days of redness.'],
        ['Included', 'Numbing cream, single-use sterile cartridge, post-care kit.'],
      ] },
      { h2: 'How it works', body: 'After numbing for 45 minutes, a device with a new sterile cartridge treats the scarred areas at depths set for each zone.' },
      { h2: 'Is it safe for brown skin?', body: 'Yes. It carries a lower risk of dark marks than ablative lasers.' },
      { h2: 'Before and after', body: 'No make-up for 24 hours, gentle skincare, sunscreen.' },
      { h2: 'Possible side effects', body: 'Redness, pinpoint bleeding, temporary breakouts, rarely dark marks or infection.' },
    ],
    cost: 'Face ৳7,500 · Face + PRP ৳12,000 · RF full face ৳18,000 (Year 2).',
    links: [['Acne scars', '/concerns/acne-scars/'], ['PRP therapy', '/treatments/prp-therapy/'], ['Prices', '/prices/']],
  },

  '/treatments/prp-therapy/': {
    crumbLabel: 'PRP therapy',
    h1: 'PRP therapy, used where the evidence supports it',
    lede: 'Platelet-rich plasma is prepared from a small sample of your own blood and injected into the scalp to support hair growth in pattern hair loss. It works best alongside medical treatment, not instead of it.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Price', 'Scalp ৳9,000 per session · 3 sessions ৳24,000 (you keep ৳3,000) · Under-eye / face ৳10,000.'],
        ['Sessions', '3 sessions a month apart, then maintenance every 4–6 months.'],
        ['Who performs', 'Dr. Sumya (Dr).'],
        ['Included', 'Blood draw, closed-system kit, centrifuge processing, numbing.'],
      ] },
      { h2: 'How it works', body: 'Blood is drawn, spun in a closed sterile kit in our lab, and the plasma layer is injected with fine needles.' },
      { h2: 'Before and after', body: 'No hair wash for 12 hours; avoid painkillers like ibuprofen for 3 days unless prescribed.' },
      { h2: 'Possible side effects', body: 'Tenderness, headache, minor bruising. Results vary; we review with standardised photos at 3 months.' },
    ],
    cost: 'Scalp ৳9,000 per session · 3 sessions ৳24,000 · under-eye / face ৳10,000.',
    links: [['Hair loss', '/conditions/hair-loss/'], ['Hair thinning', '/concerns/hair-thinning/'], ['Microneedling', '/treatments/microneedling/'], ['Prices', '/prices/']],
  },

  '/treatments/laser-hair-removal/': {
    crumbLabel: 'Laser hair removal',
    h1: 'Laser hair removal for brown skin — priced by area',
    lede: 'A diode laser targets the hair root while sparing the skin around it. On brown skin, the right wavelength, cooling and settings make it both effective and safe.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Price per session', 'XS ৳3,000 · S ৳5,000 · M ৳9,000 · L ৳14,000 · Full body ৳35,000 (areas listed on Prices).'],
        ['Course', '6 sessions for the price of 5; maintenance at 50% of the band price.'],
        ['Sessions', '6–8, every 4–6 weeks (face more often).'],
        ['Who performs', 'Laser nurse (N), first session supervised by Dr. Sumya; Dr. Sumya performing every session +25%.'],
        ['Downtime', 'None; mild redness for a few hours.'],
      ] },
      { h2: 'How it works', body: 'Shave the evening before. We test-patch, set parameters for your skin type and record them every session.' },
      { h2: 'Is it safe for brown skin?', body: 'Yes. Diode and long-pulsed Nd:YAG lasers are the preferred types for brown skin. We do not use IPL for hair removal on darker skin.' },
      { h2: 'Is it permanent?', body: 'It is long-term hair reduction. Most patients have a large, lasting reduction, with fine regrowth that may need an occasional maintenance session. Hormonal conditions can cause regrowth, so we check for them.' },
      { h2: 'Before and after', body: 'No sun exposure or waxing between sessions; sunscreen on treated areas.' },
      { h2: 'Possible side effects', body: 'Temporary redness and bumps, rarely blistering or colour change. Every setting is logged and reviewed.' },
    ],
    cost: 'XS ৳3,000 · S ৳5,000 · M ৳9,000 · L ৳14,000 · Full body ৳35,000 per session; 6 sessions for the price of 5.',
    links: [['Unwanted hair', '/concerns/unwanted-hair/'], ['Prices', '/prices/'], ['What “permanent” really means', '/learn/laser-hair-removal-permanent/']],
  },

  '/treatments/pigment-laser/': {
    crumbLabel: 'Pigment laser',
    h1: 'Laser for pigment and tattoos',
    lede: 'A very short-pulse laser breaks pigment into tiny particles that the body clears. It works well for freckles, sun spots, nevus of Ota and tattoos. For melasma it is only an add-on to a medical plan.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Price per session', 'Spot (up to 5 lesions) ৳5,000 · Full-face toning ৳9,000 · Nevus of Ota / Hori’s ৳12,000 · Tattoo small (≤ 5 cm²) ৳5,000, medium (5–25 cm²) ৳9,000, large (> 25 cm²) ৳14,000 · Carbon laser peel ৳6,500.'],
        ['Sessions', 'Freckles 1–3 · Nevus of Ota 6–10 · Tattoos 6–12 · Toning 4–6.'],
        ['Who performs', 'Dr. Sumya (Dr); toning may be Dr+N.'],
      ] },
      { h2: 'How it works', body: 'Protective eyewear, cooling, then rapid pulses across the area.' },
      { h2: 'Is it safe for brown skin?', body: 'Yes, at conservative settings. Over-treating melasma can cause rebound darkening, which is why toning is used sparingly.' },
      { h2: 'Before and after', body: 'Gentle skincare, strict sunscreen, no picking crusts.' },
      { h2: 'Possible side effects', body: 'Redness, crusting, temporary dark or light marks; rarely blistering.' },
    ],
    cost: 'Spot ৳5,000 · Full-face toning ৳9,000 · Nevus of Ota / Hori’s ৳12,000 · Tattoo ৳5,000–৳14,000 · Carbon laser peel ৳6,500.',
    links: [['Melasma', '/conditions/melasma/'], ['Sun damage &amp; pigmentation', '/concerns/sun-damage-pigmentation/'], ['Prices', '/prices/']],
  },

  '/treatments/fractional-co2-laser/': {
    crumbLabel: 'Fractional CO2 laser',
    h1: 'Fractional CO2 laser resurfacing',
    lede: 'Fractional CO2 treats thousands of tiny columns of skin, stimulating deep collagen remodelling. It is the most powerful option for acne scars, with more downtime.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Price per session', 'Spot scars ৳8,000 · Full face ৳20,000 · Full face + PRP ৳26,000.'],
        ['Sessions', '2–4, every 6–8 weeks.'],
        ['Downtime', '5–7 days.'],
        ['Who performs', 'Dr. Sumya (Dr).'],
        ['Availability', 'Year 2.'],
      ] },
      { h2: 'How it works', body: 'Numbing for an hour, then laser passes at conservative density for brown skin, with pre- and post-treatment pigment prevention.' },
      { h2: 'Is it safe for brown skin?', body: 'Yes, with preparation, lower density and strict aftercare. The risk of dark marks is higher than with microneedling, so we discuss both.' },
      { h2: 'Before and after', body: 'Ointment and gentle cleansing; no sun; follow-up review at day 7 (৳0).' },
      { h2: 'Possible side effects', body: 'Redness for weeks, dark marks, infection, rarely scarring.' },
    ],
    cost: 'Spot scars ৳8,000 · Full face ৳20,000 · Full face + PRP ৳26,000 per session.',
    links: [['Acne scars', '/concerns/acne-scars/'], ['Microneedling', '/treatments/microneedling/'], ['Prices', '/prices/']],
  },

  '/treatments/light-therapy/': {
    crumbLabel: 'Light therapy',
    h1: 'Light therapy for psoriasis, vitiligo and eczema',
    lede: 'Narrowband UVB is a medical light treatment that calms inflammation and can bring back colour in vitiligo. It is safe and effective, and avoids many tablets.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Price', '৳800 per session · 12-session card ৳8,800 (12 for the price of 11).'],
        ['Frequency', '2–3 times a week for 2–4 months.'],
        ['Who performs', 'Trained nurse under protocol (N); doses set and reviewed by Dr. Sumya.'],
        ['IPL', 'Used selectively for redness and some pigment, with careful selection for skin type; not for hair removal on darker skin.'],
        ['Availability', 'Year 2.'],
      ] },
      { h2: 'How it works', body: 'You stand in the cabin for seconds to minutes with eye protection; the dose rises gradually and is logged.' },
      { h2: 'Before and after', body: 'Moisturise; avoid extra sun on treatment days.' },
      { h2: 'Possible side effects', body: 'Redness like mild sunburn, dryness, darker skin around patches. Long-term risks are low and monitored.' },
    ],
    cost: '৳800 per session · 12-session card ৳8,800 (12 for the price of 11).',
    links: [['Psoriasis', '/conditions/psoriasis/'], ['Vitiligo', '/conditions/vitiligo/'], ['Eczema', '/conditions/eczema/'], ['Care plans', '/prices/']],
  },

  '/bridal-and-groom/': {
    crumbLabel: 'Bridal &amp; groom',
    h1: 'Your skin, at its healthiest, on the day',
    lede: 'A wedding is a deadline, and good skin needs time. These doctor-planned programmes run 8–12 weeks, at a fixed price, with every session scheduled backwards from your date. There are no whitening products at any tier, because healthy, even skin photographs better than bleached skin.',
    sections: [
      { h2: 'Choose your programme', defs: [
        ['Groom Programme ৳26,000', '(value at single prices ৳31,900): Comprehensive Assessment · 2 Advanced medical facials · 2 targeted peels · 2 follow-ups.'],
        ['Bridal Essential ৳32,000', '— recommended for most brides (value ৳37,900): Comprehensive Assessment · 3 Advanced medical facials · 2 targeted peels · 2 follow-ups + week-of-event check.'],
        ['Bridal Signature ৳55,000', '(value ৳66,600): Signature Skin &amp; Hair Review · 4 Advanced facials · 3 targeted peels · 1 microneedling with PRP · 3 follow-ups + event-week priority slot.'],
      ] },
      { h2: 'How it works', body: '1 Book a Comprehensive Assessment at least 10 weeks before the event (the fee is credited if you join) · 2 Receive a dated calendar of sessions · 3 Home-care plan with products at MRP (optional) · 4 Final check in event week.' },
      { h2: 'Add-ons', body: 'Quoted from the price list: laser hair removal course (laser stage), acne treatment. Family members joining together: a family scheduling day on request.' },
    ],
    cost: 'Groom Programme ৳26,000 · Bridal Essential ৳32,000 · Bridal Signature ৳55,000.',
    links: [['Medical facial', '/treatments/medical-facial/'], ['Chemical peel', '/treatments/chemical-peel/'], ['Laser hair removal', '/treatments/laser-hair-removal/'], ['Prices', '/prices/']],
  },
};
