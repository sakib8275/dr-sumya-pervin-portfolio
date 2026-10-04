// Site-wide configuration for the multi-page build (Change Request 2026-10-02).
//
// The visual identity is Nil & Haldi (adopted 2026-10-03, approved by the
// owner 2026-10-04 — see PRODUCT.md). The token block at the top of
// public/css/site.css is mirrored verbatim into style.css for the admin
// panel, and tests/pages.test.mjs fails if the two drift apart.
//
// BASE is the site-root prefix. The multi-page build served from /new/ while
// the incumbent one-pager was live; the cutover (2026-10-03) flipped it to ''
// and moved the build to public/ root, so links, canonicals and sitemap URLs
// now match the live domain exactly.

import { CHAMBERS } from '../functions/lib/schedule.js';

export const BASE = '';

export const SITE = {
  name: 'Dr. Sumya Pervin',
  strapline: 'Skin · Hair · Nail · Laser',
  domain: 'https://drsumyapervin.com',
  title: 'Dr. Sumya Pervin — Dermatologist in Dhaka',
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

// Where Dr. Sumya consults until the Centre opens (copy from /chambers/). The
// schedule facts — days, hours, session — come from functions/lib/schedule.js,
// the same module the booking API validates against, so they cannot drift;
// only the location facts (name, address) are site content. `key` is the
// exact chamber string the booking API validates. Each chamber runs one
// session, so the booking form derives it instead of asking.
const CHAMBER_PLACES = {
  'Alliance Hospital Limited (Shyamoli)': {
    name: 'Alliance Hospital Limited',
    address: '24/3 Khilji Road (Ring Road), Shyamoli, Dhaka',
  },
  'Dhaka Central International Medical College (DCIMCH)': {
    name: 'Dhaka Central International Medical College (DCIMCH)',
    address: '2/1 Ring Road, Shyamoli, Dhaka',
  },
};
export const CHAMBERS_NOW = Object.entries(CHAMBERS).map(([key, c]) => ({
  key,
  short: c.short,
  ...CHAMBER_PLACES[key],
  days: c.daysLabel,
  daysShort: c.daysShort,
  hours: c.hours,
  session: c.session,
}));

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
      feature: ['Not sure what it is? Try the skin check', '/tools/skin-check/', 'Five questions: what it often turns out to be, how soon to be seen, and which visit fits.'],
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
  ['Learn', '/learn/'],
  {
    label: 'About',
    href: '/about/',
    menu: {
      cols: [
        {
          head: 'Dr. Sumya',
          links: [
            ['About Dr. Sumya', '/about/'],
            ['What we don’t offer', '/what-we-do-not-offer/'],
            ['Community work', '/community/'],
            ['Photo &amp; consent policy', '/photo-consent-policy/'],
          ],
        },
        {
          head: 'Visit',
          links: [
            ['Current chambers', '/chambers/'],
            ['Contact &amp; directions', '/contact/'],
            ['Questions patients ask', '/faq/'],
            ['The Centre (opening 2027)', '/the-centre/'],
          ],
        },
      ],
    },
  },
];

// Hub labels for the drawer's expandable groups (the desktop mega menus
// reach the hubs through the nav button's own page; the drawer needs a row).
export const HUB_LABEL = {
  Conditions: 'All conditions',
  'Skin Surgery': 'All skin surgery',
  'Aesthetic &amp; Laser': 'All aesthetic &amp; laser',
};

// Which nav family a page belongs to. One source for three consumers: the
// breadcrumb hub fallback (article.mjs), the stub page's hub link
// (build-pages.mjs) and the current-section state in the nav and drawer.
// A page whose content entry carries an explicit `crumb` overrides the hub
// this maps to (see content/pages/content/treatments.mjs).
const SURGICAL_TREATMENTS = new Set([
  '/treatments/skin-biopsy/',
  '/treatments/excision-surgery/',
  '/treatments/electrosurgery/',
  '/treatments/cryotherapy/',
  '/treatments/intralesional-injection/',
  '/treatments/skin-cancer-treatment/',
]);
const ABOUT_PAGES = new Set([
  '/about/', '/what-we-do-not-offer/', '/photo-consent-policy/', '/chambers/',
  '/contact/', '/faq/', '/the-centre/', '/community/',
]);
export function sectionOf(path) {
  if (!path) return null;
  if (path.startsWith('/conditions/') || path === '/medical-dermatology/'
    || path === '/tools/mole-check/' || path === '/tools/skin-check/') return 'conditions';
  if (path.startsWith('/concerns/') || path === '/aesthetic-and-laser/' || path === '/bridal-and-groom/') return 'aesthetic';
  if (path === '/skin-surgery/' || path === '/your-procedure/' || SURGICAL_TREATMENTS.has(path)) return 'surgery';
  if (path.startsWith('/treatments/')) return 'aesthetic';
  if (path.startsWith('/learn/') || path === '/tools/skin-type-guide/') return 'learn';
  if (path === '/prices/') return 'prices';
  if (ABOUT_PAGES.has(path)) return 'about';
  return null;
}

// The hub page each family's leaf pages breadcrumb back to.
export const SECTION_HUB = {
  conditions: ['Medical dermatology', '/medical-dermatology/'],
  surgery: ['Skin Surgery', '/skin-surgery/'],
  aesthetic: ['Aesthetic &amp; laser', '/aesthetic-and-laser/'],
};

export const FOOTER = {
  care: [
    ['Medical dermatology', '/medical-dermatology/'],
    ['Skin surgery', '/skin-surgery/'],
    ['Aesthetic &amp; laser', '/aesthetic-and-laser/'],
    ['Prices', '/prices/'],
  ],
  visit: [
    ['Current chambers', '/chambers/'],
    ['Book a consultation', '/book/'],
    ['Prepare for your visit', '/consultation-prep/'],
    ['Contact &amp; directions', '/contact/'],
    ['The Centre (opening 2027)', '/the-centre/'],
    ['Skin care products', '/skin-care-products/'],
  ],
  learn: [
    ['Articles', '/learn/'],
    ['Skin check', '/tools/skin-check/'],
    ['Mole check', '/tools/mole-check/'],
    ['Skin type guide', '/tools/skin-type-guide/'],
    ['Questions patients ask', '/faq/'],
  ],
  trust: [
    ['What we don’t offer', '/what-we-do-not-offer/'],
    ['Photo &amp; consent policy', '/photo-consent-policy/'],
    ['Community work', '/community/'],
    ['Privacy', '/privacy/'],
    ['Terms · Disclaimer', '/terms/'],
  ],
};
