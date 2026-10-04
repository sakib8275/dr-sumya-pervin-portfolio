// Learn articles — docx §3.2 (/learn · /learn/[slug]) and the §3.4 launch set.
// The docx gives the six titles and their one-line briefs but no article bodies,
// so each is written from the matching condition/treatment page already in this
// repo, in the §1.4 voice (plain English, numbers over adjectives, no
// superlatives, no guarantees, no colourism). No clinical claim here is new.
//
// Each article follows the §3.4 Learn rulebook: one primary condition page,
// one tool, and Book.
export const learn = {
  '/learn/melasma-manageable-not-curable/': {
    crumb: ['Learn', '/learn/'],
    crumbLabel: 'Melasma',
    h1: 'Melasma is manageable, not curable — what actually works',
    lede: 'Melasma is a long-term pigment condition, not a failure of willpower or hygiene. It can be controlled well, but anyone promising to remove it for good is not telling you the truth.',
    sections: [
      { h2: 'What melasma is', body: 'Brown or grey-brown patches on the cheeks, forehead, upper lip and nose. It is commonest in women aged 25–50 and very common in South Asian skin. It is different from freckles, sun spots and the dark marks left by acne, and those need different treatment.' },
      { h2: 'What triggers it', bullets: [
        'Sun and visible light, including through windows',
        'Heat: kitchens, saunas, hot yoga',
        'Hormonal pills and pregnancy',
        'Harsh scrubs and unprescribed bleaching creams',
      ] },
      { h2: 'The single most important step', body: 'A daily tinted, broad-spectrum sunscreen with iron oxides, which blocks the visible light that drives melasma. No cream or laser makes up for skipping it.' },
      { h2: 'What treatment adds', defs: [
        ['Prescription creams:', 'short supervised courses of a combination cream, then maintenance with azelaic acid and similar'],
        ['Tranexamic acid tablets', 'for suitable patients, after screening for clot risk'],
        ['Chemical peels', 'as a booster to the plan'],
        ['Laser toning', 'only as an add-on to the medical plan, never on its own, because melasma can rebound'],
      ] },
      { h2: 'What does not work', bullets: [
        'Bleaching or “whitening” creams bought without a prescription',
        'Glutathione drips',
        'Aggressive lasers as the first treatment',
      ] },
      { h2: 'When to see a doctor quickly', body: 'A single dark spot that is changing, bleeding, or looks different from the rest. Use the mole check tool, or book a consultation.' },
    ],
    links: [['Melasma and pigmentation', '/conditions/melasma/'], ['Skin type guide', '/tools/skin-type-guide/'], ['Book a consultation', '/book/']],
  },

  '/learn/ringworm-keeps-coming-back/': {
    crumb: ['Learn', '/learn/'],
    crumbLabel: 'Fungal infection',
    h1: 'Why ringworm keeps coming back — and the cream that makes it worse',
    lede: 'Fungal skin infections (tinea, ringworm) have become harder to treat across South Asia. A common reason is a cream that contains a steroid: it calms the itch for a few days while the infection spreads underneath.',
    sections: [
      { h2: 'What it looks like', body: 'Itchy, ring-shaped or spreading patches in the groin, waist, under the breasts, buttocks, or on the body, feet and nails. It spreads within families through shared towels and clothes.' },
      { h2: 'The cream that makes it worse', body: 'Steroid or “mixed” creams hide the infection instead of clearing it. If a cream seems to work for a few days and then the rash returns worse, suspect a steroid. Antifungal treatment needs to continue for weeks, not days.' },
      { h2: 'How it is confirmed', body: 'A scraping looked at under our microscope (a KOH test), with a result in the same visit, from the licence stage onwards. Sometimes a culture is sent to a partner lab.' },
      { h2: 'How it is treated', defs: [
        ['Antifungal creams', 'for limited infection, used two weeks beyond clearing'],
        ['Antifungal tablets', 'for widespread or recurrent infection, at the right dose and duration'],
        ['Household plan:', 'treat close contacts, wash laundry at high temperature, use separate towels'],
        ['Nails', 'need months of treatment; we explain realistic outcomes'],
      ] },
      { h2: 'What will not work', bullets: [
        'Any cream with a steroid in it',
        'Stopping when the itch stops',
        'Treating yourself but not your family',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Painful, pus-filled patches on the scalp (especially in children), or infection in people with diabetes or low immunity.' },
    ],
    links: [['Fungal infection (ringworm, tinea)', '/conditions/fungal-infection/'], ['Prepare for your visit', '/consultation-prep/'], ['Book a consultation', '/book/']],
  },

  '/learn/abcde-rule-brown-skin/': {
    crumb: ['Learn', '/learn/'],
    crumbLabel: 'Mole check',
    h1: 'The ABCDE rule — plus the palms, soles and nails rule for South Asian skin',
    lede: 'Most people know to watch their moles. In brown skin, the more dangerous melanomas often appear where nobody looks: the palms, the soles and under the nails. Here is how to check both.',
    sections: [
      { h2: 'The ABCDE rule', defs: [
        ['A — Asymmetry:', 'one half of a mole does not match the other'],
        ['B — Border:', 'edges that are ragged, blurred or irregular'],
        ['C — Colour:', 'more than one shade, or a new colour, within one mole'],
        ['D — Diameter:', 'larger than about 6 mm, though some harmful spots are smaller'],
        ['E — Evolving:', 'any change in size, shape, colour, or new itching or bleeding'],
      ] },
      { h2: 'The brown-skin rule', body: 'Check the palms, the soles and under the nails as well. A new dark stripe in a nail, or a dark spot on the sole that is changing, deserves a dermatologist’s look even if it is small.' },
      { h2: 'What is normal', body: 'Most moles are harmless and stay the same for years. The thing worth acting on is change — a spot that is new, growing, bleeding or simply different from the others.' },
      { h2: 'What to do', body: 'Use the free mole check tool for a two-minute guide. If something has changed, book a mole check; suspicious moles get priority slots. A dermatologist’s check with dermoscopy takes minutes and a biopsy confirms anything doubtful.' },
      { h2: 'When to see a doctor quickly', body: 'A new dark stripe in a nail, a changing dark spot on the sole, any sore that has not healed in 4 weeks, or a mole that bleeds.' },
    ],
    links: [['Skin cancer and mole checks', '/conditions/skin-cancer/'], ['Mole check tool', '/tools/mole-check/'], ['Book a consultation', '/book/']],
  },

  '/learn/laser-hair-removal-permanent/': {
    crumb: ['Learn', '/learn/'],
    crumbLabel: 'Laser hair removal',
    h1: 'Laser hair removal: what “permanent” really means',
    lede: 'Laser hair removal is one of the most searched treatments in Dhaka, and one of the most oversold. It is long-term hair reduction, not a one-off promise of zero hair forever.',
    sections: [
      { h2: 'What the laser does', body: 'A diode laser targets the hair root while sparing the skin around it. On brown skin, the right wavelength, cooling and settings make it both effective and safe.' },
      { h2: 'Is it permanent?', body: 'It is long-term hair reduction. Most patients have a large, lasting reduction, with fine regrowth that may need an occasional maintenance session. Hormonal conditions can cause regrowth, so we check for them first.' },
      { h2: 'How many sessions', body: 'Usually 6–8, every 4–6 weeks (face more often). Hair grows in cycles, so sessions are timed to catch the active phase; a course is 6 sessions for the price of 5.' },
      { h2: 'Safety on brown skin', body: 'Diode and long-pulsed Nd:YAG lasers are the preferred types for brown skin. We do not use IPL for hair removal on darker skin. Settings are test-patched and recorded every session.' },
      { h2: 'Before and after', body: 'Shave the evening before. No sun exposure or waxing between sessions, and sunscreen on treated areas. Female patients are treated by female staff.' },
    ],
    links: [['Laser hair removal', '/treatments/laser-hair-removal/'], ['Unwanted hair', '/concerns/unwanted-hair/'], ['Skin type guide', '/tools/skin-type-guide/'], ['Book a consultation', '/book/']],
  },

  '/learn/hair-fall-after-illness/': {
    crumb: ['Learn', '/learn/'],
    crumbLabel: 'Hair fall',
    h1: 'Hair fall after illness or childbirth — and when it is something else',
    lede: 'Heavy shedding a few months after a fever, surgery, crash diet or childbirth is common, and it usually settles. But hair loss has several types, and each is treated differently.',
    sections: [
      { h2: 'The commonest type', body: 'Telogen effluvium: shedding after illness, stress, dieting or childbirth. It usually recovers as the trigger passes, and it is worth treating the cause rather than the shed.' },
      { h2: 'Other types', body: 'Pattern hair loss (in men and women), patchy loss (alopecia areata), and scalp disease such as dandruff or fungal infection all look different and need different treatment.' },
      { h2: 'How the type is found', body: 'Trichoscopy (a magnified look at the scalp), a pull test, and blood tests only when they change treatment — for example iron, thyroid or vitamin D.' },
      { h2: 'What helps', defs: [
        ['Minoxidil', 'topical, or low-dose tablets for suitable patients'],
        ['Finasteride', 'for suitable men'],
        ['PRP therapy', 'as an add-on for pattern hair loss'],
        ['Steroid injections', 'for alopecia areata'],
        ['Treating the trigger', 'such as low iron, thyroid problems or scalp inflammation'],
      ] },
      { h2: 'What does not work', bullets: [
        'Hair oils marketed as “regrowth” treatments',
        'Supplements without a proven deficiency',
        'PRP for shedding that will settle on its own',
      ] },
      { h2: 'When to see a doctor quickly', body: 'Rapid patchy loss, a painful or scarring scalp, or hair loss with other symptoms such as weight change.' },
    ],
    links: [['Hair loss (alopecia)', '/conditions/hair-loss/'], ['Prepare for your visit', '/consultation-prep/'], ['Book a consultation', '/book/']],
  },

  '/learn/arsenic-and-skin/': {
    crumb: ['Learn', '/learn/'],
    crumbLabel: 'Arsenic &amp; skin',
    h1: 'Arsenic and your skin — the spots that matter in Bangladesh',
    lede: 'Long-term arsenic in drinking water leaves marks on the skin, and some of those marks are early warning signs. Knowing them matters for you and for your family.',
    sections: [
      { h2: 'What arsenic does to the skin', body: 'Hard, yellowish, corn-like bumps on the palms and soles (arsenical keratosis), and sometimes spotty dark and light skin on the body. Over years, arsenic exposure can also lead to skin cancer.' },
      { h2: 'Why it matters here', body: 'Bangladesh’s arsenic history makes regular skin checks more important, especially for anyone who drank from an affected tube-well for years. The skin is often the first place the damage shows.' },
      { h2: 'What to check', body: 'Rough spots on the palms and soles; and any spot that grows, bleeds, ulcerates or becomes painful. A biopsy confirms anything thick or doubtful.' },
      { h2: 'What we do', defs: [
        ['Examination and dermoscopy', 'to tell early changes from harmless growths'],
        ['Treatment', 'cryotherapy or curettage for thin lesions, excision for thick or suspicious ones'],
        ['Safe water:', 'we tell you how to get your tube-well tested (local DPHE/upazila arrangements) and why it matters for your family'],
      ] },
      { h2: 'What does not work', bullets: [
        'Cutting or filing them at home',
        'Ignoring a lesion that becomes an ulcer',
      ] },
      { h2: 'When to see a doctor quickly', body: 'A spot that grows, bleeds, ulcerates or becomes painful. Use the mole check tool, or book a consultation.' },
    ],
    links: [['Precancerous skin lesions', '/conditions/precancerous-skin-lesions/'], ['Mole check tool', '/tools/mole-check/'], ['Book a consultation', '/book/']],
  },
};
