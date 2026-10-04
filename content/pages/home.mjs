// Home body — docx §5.1 copy, laid out in the Nil & Haldi design (site.css).
// Owner 2026-10-02: the doctor does not want her photograph published, so the
// hero carries a credential panel (no face) instead of the wireframe's
// portrait. 2026-10-04: the arch is gone; the panel steps through the five
// published consultation steps (JOURNEY), the same copy as the timeline below.
//
// 2026-10-03 (critique round): the page leads with what a patient can book
// today — the two Shyamoli chambers — and the ethical-limits band, the one
// section no competitor could copy, moves up to second. Everything that
// belongs to the 2027 Centre (its fee tiers and its rooms) is labelled as such,
// with VAT shown, so "published prices" stays true for the visitor booking now.
// Each chamber column carries its consulting weekdays (from the server's own
// schedule); site.js marks the chambers consulting today in Dhaka.
import { SITE, CHAMBERS_NOW, href } from '../site.mjs';
import { CHAMBERS } from '../../functions/lib/schedule.js';
import { mark } from '../brand.mjs';
import { bnSummary } from '../bn.mjs';
import { pkgButton, pkgViews } from './pkgview.mjs';

const vatPct = Math.round(SITE.vatRate * 100);
const withVat = (taka) => {
  const n = Number(taka.replace(/[^0-9]/g, ''));
  return '৳' + Math.round(n * (1 + SITE.vatRate)).toLocaleString('en-IN');
};

// Chips name real pages: a concern chip that looks tappable is tappable.
const PILLARS = [
  {
    hub: ['Medical dermatology', '/medical-dermatology/'],
    h3: 'Skin, hair &amp; nail conditions',
    p: 'Diagnosed properly, treated with evidence, followed up until controlled.',
    chips: [['Acne', '/conditions/acne/'], ['Eczema', '/conditions/eczema/'], ['Psoriasis', '/conditions/psoriasis/'], ['Fungal infection', '/conditions/fungal-infection/'], ['Hair fall', '/conditions/hair-loss/'], ['Melasma', '/conditions/melasma/'], ['Hives', '/conditions/urticaria-allergy/'], ['Vitiligo', '/conditions/vitiligo/']],
  },
  {
    hub: ['Skin surgery &amp; procedures', '/skin-surgery/'],
    h3: 'Moles, lumps &amp; growths',
    p: 'Minor skin surgery in a clean procedure room, with lab confirmation when needed.',
    chips: [['Mole check', '/tools/mole-check/'], ['Mole / cyst removal', '/treatments/excision-surgery/'], ['Skin tags &amp; DPN', '/treatments/electrosurgery/'], ['Warts', '/treatments/cryotherapy/'], ['Keloid', '/treatments/intralesional-injection/'], ['Skin biopsy', '/treatments/skin-biopsy/']],
  },
  {
    hub: ['Aesthetic &amp; laser', '/aesthetic-and-laser/'],
    h3: 'Look like yourself, rested',
    p: 'Only what the evidence supports for South Asian skin — planned by a dermatologist.',
    chips: [['Acne scars', '/concerns/acne-scars/'], ['Pigmentation', '/concerns/sun-damage-pigmentation/'], ['Unwanted hair', '/concerns/unwanted-hair/'], ['Ageing skin', '/concerns/wrinkles-ageing-skin/'], ['Hair thinning', '/concerns/hair-thinning/'], ['Bridal prep', '/bridal-and-groom/']],
  },
];

const TIERS = [
  {
    pkg: 'specialist', name: 'Specialist Consultation', min: '20–25 minutes with Dr. Sumya', price: '৳2,000',
    incl: ['Examination + dermoscopy (a magnified skin check)', 'Written diagnosis &amp; care plan', 'Report review within 14 days — free', 'One WhatsApp check-in'],
  },
  {
    pkg: 'comprehensive', name: 'Comprehensive Assessment', min: '40 minutes with Dr. Sumya', price: '৳3,500', cls: 'rec',
    flag: 'Recommended for long-standing or cosmetic concerns',
    incl: ['Everything in Specialist', 'Standardised baseline photographs', 'Costed options for every route', 'One follow-up within 30 days — included', 'Two WhatsApp check-ins'],
  },
  {
    pkg: 'signature', name: 'Signature Skin &amp; Hair Review', value: 'Signature Skin & Hair Review', min: '60 minutes with Dr. Sumya', price: '৳6,000', cls: 'sig',
    incl: ['Everything in Comprehensive', 'Full-body mole map, or a magnified scalp check (trichoscopy)', 'Same-visit fungal &amp; Wood’s lamp (UV light) tests', 'Typed report for your records', '3-month review message'],
  },
];

const NO_LIST = [
  ['Skin-whitening drips &amp; injections', 'No safety evidence; real harms'],
  ['Steroid creams without a diagnosis', 'Cause thinning and rebound'],
  ['“Instant fairness” packages', 'Skin tone is not a disease'],
  ['Treatment from a photo alone', 'Diagnosis needs examination'],
  ['Unregistered injectables', 'Only DGDA-registered products'],
  ['Guaranteed results', 'Honest ranges, not promises'],
];

// The five consultation steps: one source for the hero panel and the timeline.
export const JOURNEY = [
  ['History', 'Bring your creams and old prescriptions. We ask what you have tried.'],
  ['Examination', 'A proper look, with dermoscopy — a magnified skin check — where it helps.'],
  ['Tests — only if useful', 'Explained and priced before anything is done.'],
  ['Written plan', 'Diagnosis, options, timeline and total cost.'],
  ['Follow-up', 'We message you to check progress.'],
];

const NO_MARK = '<svg class="no-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.6 5.6l12.8 12.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

export default function home() {
  return `
<section class="h-hero">
  <div class="wrap">
    <div class="h-hero-copy">
      <h1>Every treatment starts with a <em>diagnosis</em>.</h1>
      <p class="h-sub">Doctor-led care for skin, hair and nail conditions, plus evidence-based aesthetic and laser treatment. Published prices. A written plan at every visit. Follow-up we actually send.</p>
      ${bnSummary('/')}
      <div class="h-ctas">
        <a class="btn btn-ink" href="${href('/book/')}">Book a consultation</a>
        <a class="btn btn-ghost" href="#now">Where she consults now</a>
      </div>
      <p class="h-alt">Not sure what you need? <a class="tlink" href="${href('/consultation-prep/')}">See what your first visit will involve</a> (2-minute check)</p>
    </div>
    <div class="h-hero-figure">
      <div class="nameplate" data-journey role="group" aria-roledescription="carousel" aria-label="Your first visit, in five steps">
        <p class="jn-eyebrow">Your first visit</p>
        <ol class="jn-steps">${JOURNEY.map(([t, d], i) => `
          <li class="jn-step"><span class="jn-num" aria-hidden="true">0${i + 1}</span><b>${t}</b><p>${d}</p></li>`).join('')}
        </ol>
        <div class="np-body">
          <p class="np-role">Consultant Dermatologist</p>
          <p class="np-name">${SITE.name}</p>
          <p class="np-line">Skin, Hair, Nail, Allergy &amp; Venereal Diseases</p>
          <ul class="np-creds">
            <li class="pill">MBBS</li>
            <li class="pill">DDV (BSMMU)</li>
            <li class="pill">FCPS (Skin &amp; VD)</li>
            <li class="pill gold">${SITE.bmdc.replace('BMDC Reg. ', 'BMDC ')}</li>
          </ul>
        </div>
        <p class="np-note"><b>Consulting in Shyamoli</b> · Dermatology Centre opening 2027</p>
      </div>
    </div>
  </div>
</section>

<div class="h-promises">
  <div class="wrap">
    <div class="h-pr"><div class="h-pr-t">Prices published</div><p>See exactly what each fee includes, before you call.</p></div>
    <div class="h-pr"><div class="h-pr-t">Doctor-led, always disclosed</div><p>Every price shows who performs it: Dr. Sumya, or a trained nurse working to her protocol.</p></div>
    <div class="h-pr"><div class="h-pr-t">Written plan, every visit</div><p>Diagnosis, treatment, timeline and total cost, in writing.</p></div>
    <div class="h-pr"><div class="h-pr-t">Follow-up we send</div><p>A check-in message at the right time for your condition.</p></div>
  </div>
</div>

<section class="s-sec h-now" id="now">
  <div class="wrap">
    <div class="s-head"><h2>Where Dr. Sumya consults now</h2>
      <a class="tlink" href="${href('/chambers/')}">What to bring →</a></div>
    <p class="lede">Until the Centre opens in 2027, Dr. Sumya consults at two chambers in Shyamoli. Fees at these chambers follow each hospital’s own tariff; the published prices on this website apply to the Centre.</p>
    <div class="h-now-grid">
      ${CHAMBERS_NOW.map((c) => `
      <article class="h-ch" data-days="${CHAMBERS[c.key].days.join(',')}">
        <p class="h-ch-today" hidden><span class="h-ch-dot" aria-hidden="true"></span>Consulting today</p>
        <h3>${c.name}</h3>
        <p class="h-ch-addr">${c.address}</p>
        <p class="h-ch-when"><b>${c.days}</b><span>${c.hours}</span></p>
        <a class="btn btn-ink" href="${href('/book/')}?chamber=${encodeURIComponent(c.short.split(' ')[0])}">Book at ${c.short}</a>
      </article>`).join('')}
      <article class="h-ch h-ch-ask">
        <h3>Rather ask first?</h3>
        <p class="h-ch-addr">We reply within 2 working hours, and send your serial and time window the same way.</p>
        <p class="h-ch-links"><a class="tlink" href="tel:${SITE.phoneTel}">Call ${SITE.phone}</a><a class="tlink" href="https://wa.me/${SITE.whatsapp}" rel="noopener">WhatsApp us</a></p>
      </article>
    </div>
  </div>
</section>

<section class="h-dont" id="limits">
  <div class="wrap">
    <div class="h-dont-lead">
      <h2>Some treatments are not available here — at any price.</h2>
      <p class="h-dont-pos">Her position is simple: a skin condition should be diagnosed before it is treated, and the patient should understand both.</p>
      <p>Saying no is part of good medicine. Here is what we don’t offer, and why.</p>
      <a class="btn btn-ghost-inv" href="${href('/what-we-do-not-offer/')}">Read the full list</a>
    </div>
    <ul class="h-dont-x">
      ${NO_LIST.map(([t, why]) => `<li>${NO_MARK}<span><b>${t}</b><span>${why}</span></span></li>`).join('')}
    </ul>
  </div>
</section>

<section class="s-sec">
  <div class="wrap">
    <div class="s-head"><h2>What brings you here?</h2>
      <a class="tlink" href="${href('/medical-dermatology/')}">All conditions &amp; treatments →</a></div>
    <p class="lede">Not sure which of these it is? <a class="tlink" href="${href('/tools/skin-check/')}">Try the 2-minute skin check</a>: five questions, and it tells you how soon to be seen.</p>
    <div class="h-pillars">
      ${PILLARS.map((p) => `
      <article class="h-pil">
        <h3>${p.h3}</h3>
        <p>${p.p}</p>
        <ul class="chips">${p.chips.map(([l, h]) => `<li><a class="chip" href="${href(h)}">${l}</a></li>`).join('')}</ul>
        <a class="tlink" href="${href(p.hub[1])}">${p.hub[0]} →</a>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="s-sec tone-butter">
  <div class="wrap">
    <div class="s-head"><h2>From first visit to a plan you can follow</h2></div>
    <ol class="h-steps">
      ${JOURNEY.map(([t, d]) => `<li><b>${t}</b><p>${d}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="s-sec" id="fees">
  <div class="wrap">
    <div class="s-head"><h2>Choose the depth of your first visit</h2>
      <a class="tlink" href="${href('/prices/')}">Full price list →</a></div>
    <p class="lede h-fees-lede"><b>Centre fees, from opening in 2027.</b> Prices exclude ${vatPct}% VAT, added at checkout. At Alliance and DCIMCH today, fees follow each hospital’s own tariff.</p>
    <div class="h-tiers">
      ${TIERS.map((t) => `
      <article class="h-tier${t.cls ? ' ' + t.cls : ''}">${t.flag ? `
        <p class="h-tier-flag">${t.flag}</p>` : ''}
        <h3>${t.name}</h3><p class="h-tier-min">${t.min}</p>
        <div class="h-tier-p">${t.price}</div>
        <p class="h-tier-vat">${withVat(t.price)} with ${vatPct}% VAT</p>
        <ul class="ticks">${t.incl.map((i) => `<li>${i}</li>`).join('')}</ul>
        ${pkgButton(t.pkg, `${t.cls === 'sig' ? 'btn-ghost-inv' : t.cls === 'rec' ? 'btn-ink' : 'btn-ghost'} h-tier-book`)}
      </article>`).join('')}
    </div>
    <p class="h-note">Follow-up within 30 days ৳1,200 · No package is sold at a first visit.</p>
  </div>
</section>
${pkgViews(TIERS.map((t) => t.pkg))}

<section class="s-sec">
  <div class="wrap">
    <div class="s-head"><h2>Written and reviewed by Dr. Sumya</h2>
      <a class="tlink" href="${href('/learn/')}">All articles →</a></div>
    <div class="h-learn">
      <a class="h-learn-card" href="${href('/learn/melasma-manageable-not-curable/')}"><h3>Melasma is manageable, not curable — what actually works</h3><p class="by">Pigmentation · 6 min read · Reviewed by Dr. Sumya Pervin, FCPS</p></a>
      <a class="h-learn-card" href="${href('/learn/ringworm-keeps-coming-back/')}"><h3>Why ringworm keeps coming back — and the cream that makes it worse</h3><p class="by">Fungal infection · 5 min read · Reviewed by Dr. Sumya Pervin, FCPS</p></a>
      <a class="h-learn-card" href="${href('/learn/abcde-rule-brown-skin/')}"><h3>The ABCDE rule — plus the palms, soles and nails rule for South Asian skin</h3><p class="by">Mole check · 4 min read · Reviewed by Dr. Sumya Pervin, FCPS</p></a>
    </div>
  </div>
</section>

<section class="s-sec tone-butter h-centre">
  <div class="wrap">
    <div class="s-head"><h2>Opening 2027: a Centre built like a clinic, not a salon</h2>
      <a class="tlink" href="${href('/the-centre/')}">Take the tour →</a></div>
    <p class="lede">${SITE.centre.name}, ${SITE.centre.address}.</p>
    <div class="h-rooms">
      <article><h3>Consultation suites</h3><p>Private, unhurried, with dermoscopy and magnified lighting.</p></article>
      <article><h3>Laser suite</h3><p>Interlocked door, eye protection, plume extraction.</p></article>
      <article><h3>In-house lab</h3><p>Same-visit fungal microscopy. PRP prepared in a closed system.</p></article>
    </div>
  </div>
</section>

<section class="h-final">
  <div class="wrap">
    <h2>Pick a day. We’ll send your serial, time window and what to bring.</h2>
    <div class="h-final-ctas">
      <a class="btn btn-ink" href="${href('/book/')}">Book a consultation</a>
      <a class="btn btn-ghost-inv" href="https://wa.me/${SITE.whatsapp}" rel="noopener">Ask on WhatsApp</a>
    </div>
  </div>
</section>`;
}
