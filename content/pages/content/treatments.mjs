// Skin Surgery & Procedures workstream — docx §5.18 hub, §5.19–5.24 procedures,
// §5.25 patient guide.
export const treatments = {
  '/skin-surgery/': {
    crumbLabel: 'Skin surgery',
    h1: 'Skin surgery and procedures',
    lede: 'Minor skin surgery performed by Dr. Sumya in a sterile procedure room, using local anaesthetic, with the lab report shared and explained. Prices are banded by size or number of lesions, so you know the cost before the day.',
    sections: [
      { h2: 'Procedures', cards: [
        ['Skin biopsy', 'A small sample of skin, so a pathologist can confirm the diagnosis under a microscope.', '/treatments/skin-biopsy/'],
        ['Mole &amp; cyst removal (excision)', 'The whole lesion is removed with a margin of normal skin and closed with stitches; the tissue goes to the lab.', '/treatments/excision-surgery/'],
        ['Skin tags &amp; DPN (electrosurgery)', 'A fine electrosurgical or radiofrequency tip removes small growths with minimal bleeding.', '/treatments/electrosurgery/'],
        ['Wart &amp; keratosis freezing (cryotherapy)', 'Liquid nitrogen freezes the lesion, which then blisters and falls off over 1–2 weeks.', '/treatments/cryotherapy/'],
        ['Keloid, alopecia &amp; cyst injections', 'A small amount of medicine injected directly into the problem area.', '/treatments/intralesional-injection/'],
        ['Skin cancer treatment &amp; referral', 'Most small, low-risk skin cancers are cured by simple surgery; some need specialised referral.', '/treatments/skin-cancer-treatment/'],
        ['Before and after your procedure', 'Prepare, aftercare and what to watch for — the guide every procedure page links to.', '/your-procedure/'],
      ] },
      { h2: 'Every procedure includes', body: 'Local anaesthetic · sterile single-use consumables · dressing · aftercare sheet · stitch removal where needed · a free complication review within 7 days. The lab fee is passed through at cost, and you see the receipt.' },
    ],
    links: [['Skin surgery prices', '/prices/']],
  },

  '/treatments/skin-biopsy/': {
    crumb: ['Skin surgery', '/skin-surgery/'],
    crumbLabel: 'Skin biopsy',
    h1: 'Skin biopsy — when the answer matters',
    lede: 'A biopsy takes a small sample of skin so a pathologist can confirm the diagnosis under a microscope. It takes about 15 minutes under local anaesthetic.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Used for', 'Suspicious moles or growths, rashes that do not respond, hair loss with scarring, some nail and mouth lesions'],
        ['Time', '15–20 minutes'],
        ['Anaesthetic', 'Local injection'],
        ['Results', 'Usually 5–10 working days; explained at a report-review visit (৳0 within 14 days)'],
        ['Who performs', 'Dr. Sumya (Dr)'],
      ] },
      { h2: 'How it works', body: 'Punch biopsy (a small round sample, 1–2 stitches), shave biopsy (no stitches), or incisional biopsy (a wedge from a larger lesion). We tell you which and why before starting.' },
      { h2: 'Before and after', body: 'Keep the dressing dry for 24 hours, then clean daily. Stitches out in 7–14 days depending on site.' },
      { h2: 'Possible side effects', body: 'Minor bleeding, infection (uncommon), a small scar. Brown skin can scar darker or form keloids; we plan the site to minimise this.' },
    ],
    cost: '৳4,000 + histopathology at the lab’s price (typically ৳2,000–3,500; receipt shown)',
    links: [['Skin cancer', '/conditions/skin-cancer/'], ['Before and after your procedure', '/your-procedure/'], ['Skin surgery prices', '/prices/']],
  },

  '/treatments/cryotherapy/': {
    crumb: ['Skin surgery', '/skin-surgery/'],
    crumbLabel: 'Cryotherapy',
    h1: 'Cryotherapy for warts and rough spots',
    lede: 'Liquid nitrogen freezes the lesion, which then blisters and falls off over 1–2 weeks. Warts usually need 2–4 sessions, 2–3 weeks apart.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Used for', 'Viral warts, seborrhoeic keratoses, thin arsenical/actinic keratoses'],
        ['Sessions', 'Warts 2–4; keratoses often 1'],
        ['Downtime', 'Blister for a few days; normal activities continue'],
        ['Who performs', 'Dr. Sumya (Dr)'],
      ] },
      { h2: 'How it works', body: 'Short, controlled freeze cycles with a spray or probe. It stings for a minute.' },
      { h2: 'Is it safe for brown skin?', body: 'Freezing can leave a lighter mark on brown skin, sometimes long-lasting. On the face we often prefer electrosurgery, and we will tell you if so.' },
      { h2: 'Before and after', body: 'Leave the blister intact, keep it clean, use a plaster if it rubs.' },
      { h2: 'Possible side effects', body: 'Pain, blistering, lighter or darker marks, rarely nail or nerve damage near fingers.' },
    ],
    cost: 'Band A 1–3 lesions ৳2,000 · Band B 4–10 ৳3,500 · Band C 11+ ৳5,000',
    links: [['Precancerous skin lesions', '/conditions/precancerous-skin-lesions/'], ['Seborrhoeic keratosis &amp; DPN', '/conditions/seborrhoeic-keratosis-dpn/'], ['Skin surgery prices', '/prices/']],
  },

  '/treatments/excision-surgery/': {
    crumb: ['Skin surgery', '/skin-surgery/'],
    crumbLabel: 'Excision surgery',
    h1: 'Mole and cyst removal, done properly',
    lede: 'Excision removes the whole lesion with a margin of normal skin and closes the wound with stitches. The tissue goes to the lab, so you know exactly what it was.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Used for', 'Moles, epidermoid (sebaceous) cysts, small lipomas, suspicious lesions, small skin cancers'],
        ['Time', '30–60 minutes'],
        ['Stitches out', '5–7 days on the face, 10–14 days on the body'],
        ['Who performs', 'Dr. Sumya (Dr)'],
        ['Included', 'Anaesthetic, sterile set, sutures, dressing, stitch removal, one review, complication review ৳0'],
        ['Not included', 'Histopathology, passed through at the lab’s price'],
      ] },
      { h2: 'How it works', body: 'An elliptical incision, removal, then closure in layers for a fine line. Cosmetic moles can sometimes be shaved instead (smaller scar, but may regrow); we discuss both.' },
      { h2: 'Delayed closure: when we close the wound later', body: 'Occasionally, for some skin cancers, the wound is dressed and closed at a second short visit once the lab confirms clear margins. You will know in advance if this applies to you.' },
      { h2: 'Before and after', body: 'Keep dry 24–48 hours; avoid heavy exercise and stretching the area for 2 weeks; sun protection on the scar for 6 months.' },
      { h2: 'Possible side effects', body: 'Bleeding, infection, a wider or raised scar (keloid risk is higher on chest, shoulders and earlobes), recurrence of cysts if the wall breaks.' },
    ],
    cost: 'Band A under 1 cm ৳8,000 · Band B 1–2 cm ৳12,000 · Band C 2–3 cm or facial layered closure ৳18,000 · larger or complex: referral or a written quote after assessment',
    links: [['Skin cancer', '/conditions/skin-cancer/'], ['Before and after your procedure', '/your-procedure/'], ['Skin surgery prices', '/prices/']],
  },

  '/treatments/electrosurgery/': {
    crumb: ['Skin surgery', '/skin-surgery/'],
    crumbLabel: 'Electrosurgery',
    h1: 'Skin tags and small bumps, removed precisely',
    lede: 'A fine electrosurgical or radiofrequency tip removes small growths with minimal bleeding. Many lesions can be treated in one sitting.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Used for', 'Skin tags, DPN, seborrhoeic keratoses, milia, syringomas; electrodesiccation and curettage (ED&amp;C) for selected superficial lesions'],
        ['Time', '20–60 minutes depending on number'],
        ['Downtime', 'Small scabs for 7–10 days'],
        ['Who performs', 'Dr. Sumya (Dr)'],
      ] },
      { h2: 'How it works', body: 'Numbing cream or a tiny injection, then each lesion is treated individually at low energy. ED&amp;C (scraping plus cautery) is used for some superficial skin cancers only after a biopsy confirms them.' },
      { h2: 'Is it safe for brown skin?', body: 'Low settings and precise treatment reduce the risk of dark marks. A sunscreen plan afterwards matters.' },
      { h2: 'Before and after', body: 'Petroleum jelly twice daily until scabs fall off; do not pick; sunscreen for 6 weeks.' },
      { h2: 'Possible side effects', body: 'Temporary dark or light marks, small scars, regrowth of new lesions over the years. Tell us if you have a pacemaker.' },
    ],
    cost: 'Up to 10 lesions ৳3,500 · 11–30 ৳6,000 · 31+ or full face and neck ৳9,000',
    links: [['Seborrhoeic keratosis &amp; DPN', '/conditions/seborrhoeic-keratosis-dpn/'], ['Before and after your procedure', '/your-procedure/'], ['Skin surgery prices', '/prices/']],
  },

  '/treatments/intralesional-injection/': {
    crumb: ['Skin surgery', '/skin-surgery/'],
    crumbLabel: 'Intralesional injection',
    h1: 'Injections for keloids, patchy hair loss and painful cysts',
    lede: 'A small amount of medicine injected directly into the problem area. It flattens keloids, regrows hair in alopecia areata and settles painful acne cysts within days.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Sessions', 'Keloids every 4–6 weeks, several sessions; alopecia areata every 4–6 weeks; acne cyst usually once'],
        ['Who performs', 'Dr. Sumya (Dr)'],
      ] },
      { h2: 'How it works', body: 'A fine needle and controlled dosing. For keloids it may be combined with freezing or silicone sheets.' },
      { h2: 'Before and after', body: 'No special care; mild soreness for a day.' },
      { h2: 'Possible side effects', body: 'Skin thinning or lightening at the site if over-used. We space and dose carefully.' },
    ],
    cost: '1–2 lesions ৳2,000 · 3+ lesions or keloid over 3 cm ৳3,500',
    links: [['Skin surgery prices', '/prices/']],
  },

  '/treatments/skin-cancer-treatment/': {
    crumb: ['Skin surgery', '/skin-surgery/'],
    crumbLabel: 'Skin cancer treatment',
    h1: 'Skin cancer treatment: what we do here, and where we refer',
    lede: 'Most small, low-risk skin cancers are cured by simple surgery. Some need more specialised care. We tell you clearly which applies to you, refer you to the right team, and remain your dermatologist for follow-up.',
    sections: [
      { h2: 'At a glance', defs: [
        ['Done here', 'Biopsy, excision of small low-risk BCC and SCC, ED&amp;C for selected superficial BCC, follow-up skin checks'],
        ['Referred', 'Mohs micrographic surgery, radiation therapy (including superficial radiation), large or facial reconstructions, melanoma care, systemic treatment'],
        ['Under evaluation', 'Photodynamic therapy (PDT) for superficial lesions'],
        ['Follow-up', 'Skin checks every 6–12 months for 5 years'],
      ] },
      { h2: 'How it works', body: 'Mohs surgery removes cancer layer by layer, checking each layer under the microscope. It keeps the most healthy skin, so it is used on the face. Radiation suits some patients who cannot have surgery. PDT uses a light-activated cream for very superficial lesions.' },
      { h2: 'Before and after', body: 'You receive a written summary of the diagnosis, the referral letter and the follow-up schedule.' },
      { h2: 'Possible side effects', body: 'Risks depend on the treatment chosen; each team explains its own consent.' },
    ],
    links: [['Skin cancer', '/conditions/skin-cancer/'], ['Excision surgery', '/treatments/excision-surgery/'], ['Skin biopsy', '/treatments/skin-biopsy/']],
  },

  '/your-procedure/': {
    crumbLabel: 'Your procedure',
    h1: 'Before and after your procedure',
    lede: 'How to prepare for a skin procedure, aftercare, what is normal, what is not, and how to reach us. Downloadable aftercare sheets.',
    sections: [
      { h2: 'Before: tell us if you', body: 'take blood thinners (aspirin, clopidogrel, warfarin, or newer anticoagulants; do not stop them without your prescribing doctor’s advice) · have diabetes, a pacemaker, or a history of keloids or cold sores · are pregnant or breastfeeding · have used isotretinoin in the last 6 months (for peels and lasers). Eat normally. Wear loose clothing. For facial procedures, come without make-up.' },
      { h2: 'After: what is normal', body: 'Mild soreness, slight oozing for 24 hours, redness, small scabs, temporary darkening of the area.' },
      { h2: 'After: contact us the same day if', body: 'bleeding that does not stop after 20 minutes of firm pressure · increasing pain, swelling, warmth or pus after day 2 · fever · blistering or burns after a laser or peel. Complication reviews within 7 days are free.' },
      { h2: 'Possible complications (in plain words)', body: 'Infection, bleeding, a visible or raised scar (keloid), lighter or darker marks, rarely numbness. Your consent form lists those specific to your procedure.' },
      { h2: 'Resources', body: 'Downloadable aftercare sheets (PDF) for each procedure · Wound-care video · Sun protection after treatment · How to read your lab report.' },
    ],
    links: [['Skin surgery', '/skin-surgery/'], ['Skin biopsy', '/treatments/skin-biopsy/'], ['Cryotherapy', '/treatments/cryotherapy/'], ['Excision surgery', '/treatments/excision-surgery/'], ['Electrosurgery', '/treatments/electrosurgery/'], ['Intralesional injection', '/treatments/intralesional-injection/'], ['Skin cancer treatment', '/treatments/skin-cancer-treatment/'], ['Skin surgery prices', '/prices/']],
  },
};
