// Site-wide configuration for the multi-page build (Change Request 2026-10-02).
//
// The gold identity stays: these constants and the token block at the top of
// public/css/site.css are copied from the incumbent one-pager, and
// tests/pages.test.mjs fails if the two token blocks drift apart.
//
// BASE is the site-root prefix. The multi-page build served from /new/ while
// the incumbent one-pager was live; the cutover (2026-10-03) flipped it to ''
// and moved the build to public/ root, so links, canonicals and sitemap URLs
// now match the live domain exactly.

export const BASE = '';

export const SITE = {
  name: 'Dr. Sumya Pervin',
  strapline: 'Skin · Hair · Nail · Laser',
  domain: 'https://drsumyapervin.com',
  title: 'Dr. Sumya Pervin, MD — Dermatologist in Dhaka',
  bmdc: 'BMDC Reg. A-59492',
  // Owner-supplied contact details. phone is the display form; phoneTel is the
  // dialable E.164 form for tel: links. The prices-reviewed date is still a
  // placeholder until the owner supplies it.
  phone: '01353-787080',
  phoneTel: '+8801353787080',
  email: 'appointments@drsumyapervin.com',
  whatsapp: '8801353787080', // site WhatsApp links (wa.me) — follows the new phone
  // Owner-supplied: the price list is approved for November 2026. Displayed
  // prices exclude VAT; 15% is added at checkout.
  pricesReviewed: 'November 2026',
  vatRate: 0.15,
  // docx §1.4: every clinical page carries a byline and a review date. Owner
  // supplied October 2026 as the month the clinical content was reviewed.
  reviewed: 'October 2026',
  centre: {
    name: "Dr. Sumya Pervin's Dermatology Centre",
    address: 'Ring Road, Mohammadpur, Dhaka',
    opening: 'Opening 2027',
  },
  credentials: ['MBBS', 'DDV (BSMMU)', 'FCPS (Skin & VD)'],
};

// Publish gates from docx Part 9. 'staging' renders every section with its
// gate badge; the cutover config sets the live gate (now | opening | licence
// | laser) and the build hides anything not yet cleared.
export const ACTIVE_GATE = 'opening';
export const GATES = {
  web: 0, // "now": doctor pages and condition pages
  opening: 1, // Centre + consultation prices
  licence: 2, // procedures
  laser: 3, // laser devices
  year2: 4, // Year-2 devices
};

// Human-readable reason shown wherever a gated figure is withheld.
export const GATE_NOTE = {
  opening: 'From Centre opening, 2027',
  licence: 'With procedure licensing',
  laser: 'When the laser suite opens',
  year2: 'Year-2 device',
};

// Resolves a sitemap path against the staging BASE. Cutover flips BASE to ''
// and every link, canonical and sitemap URL follows.
export function href(path) {
  return path === '/' ? (BASE === '' ? '/' : `${BASE}/`) : `${BASE}${path}`;
}

export function gateVisible(tag) {
  if (ACTIVE_GATE === 'staging') return true;
  if (!tag) return true;
  return GATES[tag] <= GATES[ACTIVE_GATE];
}

export const NAV = [
  {
    label: 'Conditions',
    href: '/medical-dermatology/',
    menu: {
      cols: [
        {
          head: 'Common',
          links: [
            ['Acne', '/conditions/acne/'],
            ['Eczema', '/conditions/eczema/'],
            ['Psoriasis', '/conditions/psoriasis/'],
            ['Fungal infection', '/conditions/fungal-infection/'],
            ['Hives &amp; allergy', '/conditions/urticaria-allergy/'],
          ],
        },
        {
          head: 'Pigment &amp; hair',
          links: [
            ['Melasma', '/conditions/melasma/'],
            ['Vitiligo', '/conditions/vitiligo/'],
            ['Hair loss', '/conditions/hair-loss/'],
          ],
        },
        {
          head: 'Growths &amp; screening',
          links: [
            ['Mole check (tool)', '/tools/mole-check/'],
            ['Skin cancer', '/conditions/skin-cancer/'],
            ['Precancerous lesions', '/conditions/precancerous-skin-lesions/'],
            ['Seborrhoeic keratosis &amp; DPN', '/conditions/seborrhoeic-keratosis-dpn/'],
          ],
        },
      ],
      foot: ['Confidential sexual health', '/conditions/sexual-health/'],
    },
  },
  {
    label: 'Skin Surgery',
    href: '/skin-surgery/',
    menu: {
      cols: [
        {
          head: 'Procedures',
          links: [
            ['Skin biopsy', '/treatments/skin-biopsy/'],
            ['Mole &amp; cyst removal', '/treatments/excision-surgery/'],
            ['Skin tags &amp; DPN removal', '/treatments/electrosurgery/'],
            ['Wart freezing', '/treatments/cryotherapy/'],
            ['Keloid &amp; scar injections', '/treatments/intralesional-injection/'],
            ['Skin cancer treatment', '/treatments/skin-cancer-treatment/'],
          ],
        },
      ],
      feature: ['Before and after your procedure', '/your-procedure/', 'Prepare, aftercare and what to watch for — the guide every procedure page links to.'],
    },
  },
  {
    label: 'Aesthetic &amp; Laser',
    href: '/aesthetic-and-laser/',
    menu: {
      cols: [
        {
          head: 'By concern',
          links: [
            ['Acne scars', '/concerns/acne-scars/'],
            ['Pigmentation &amp; sun damage', '/concerns/sun-damage-pigmentation/'],
            ['Unwanted hair', '/concerns/unwanted-hair/'],
            ['Ageing skin', '/concerns/wrinkles-ageing-skin/'],
            ['Hair thinning', '/concerns/hair-thinning/'],
            ['Redness', '/concerns/redness-visible-vessels/'],
          ],
        },
        {
          head: 'By treatment',
          links: [
            ['Medical facial', '/treatments/medical-facial/'],
            ['Chemical peels', '/treatments/chemical-peel/'],
            ['Microneedling', '/treatments/microneedling/'],
            ['PRP', '/treatments/prp-therapy/'],
            ['Laser hair removal', '/treatments/laser-hair-removal/'],
            ['Pigment laser', '/treatments/pigment-laser/'],
          ],
        },
      ],
      feature: ['Bridal &amp; Groom programmes', '/bridal-and-groom/', 'Doctor-planned 8–12 week programmes. Start at least 10 weeks before the event.'],
    },
  },
  ['Prices', '/prices/'],
  ['The Centre', '/the-centre/'],
  ['About', '/about/'],
];

export const FOOTER = {
  care: [
    ['Medical dermatology', '/medical-dermatology/'],
    ['Skin surgery', '/skin-surgery/'],
    ['Aesthetic &amp; laser', '/aesthetic-and-laser/'],
    ['Prices', '/prices/'],
  ],
  visit: [
    ['The Centre (opening 2027)', '/the-centre/'],
    ['Current chambers', '/chambers/'],
    ['Book a consultation', '/book/'],
    ['Prepare for your visit', '/consultation-prep/'],
  ],
  trust: [
    ['What we don’t offer', '/what-we-do-not-offer/'],
    ['Photo &amp; consent policy', '/photo-consent-policy/'],
    ['Privacy', '/privacy/'],
    ['Terms · Disclaimer', '/terms/'],
  ],
};
