// Generic article renderer for the multi-page site (Phase 3 content fill).
//
// Every page without a bespoke body module (home/prices/about/ethics) renders
// from a structured content object in content/pages/content.mjs. The docx
// page-by-page copy (Part 5) maps 1:1 onto this shape:
//
//   {
//     crumb: ['Medical dermatology', '/medical-dermatology/'],   // optional
//     h1, lede,
//     sections: [
//       { h2, body },                       // a paragraph
//       { h2, bullets: ['…'] },             // a bullet list
//       { h2, defs: [['Lead:', 'rest']] },  // bold-lead definition list
//     ],
//     cost: 'What it typically costs here…',  // optional
//     faqs: [['Question?', 'Answer.']],       // optional
//     links: [['Acne scars', '/conditions/acne-scars/']], // optional, real paths only
//   }
//
// Publish gates (docx Part 9): a page with a `gate` whose gate is not yet
// visible renders its clinical copy but withholds every price figure — the
// cost note becomes a gate note and any block carrying a positive ৳ figure is
// dropped. Figures inside an otherwise-visible page (e.g. a condition's cost
// note naming a licensed treatment) are wrapped in an inline [[gate: …]] marker.
//
// CSP-safe by construction: only generated tags, no inline handlers, and every
// internal link is a sitemap path (tests/pages.test.mjs asserts they resolve).
import { href, gateVisible, GATE_NOTE, SITE, sectionOf, SECTION_HUB } from '../site.mjs';
import { CONTENT } from './content.mjs';
import { REFERENCES } from '../references.mjs';

// docx §1.4: every clinical page carries a byline and a review date. Clinical =
// condition, concern, treatment and Learn-article pages (not hubs or legal).
const CLINICAL = (path) => /^\/(conditions|concerns|treatments)\//.test(path) || /^\/learn\/.+\//.test(path);

const HUB = (path) => SECTION_HUB[sectionOf(path)] || null;

const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const defs = (items) => `<ul class="defs">${items.map(([b, t]) => `<li><b>${b}</b> ${t}</li>`).join('')}</ul>`;
const cards = (items) => `<div class="cards">${items.map(([name, blurb, path, tag]) => `
  <a class="card" href="${href(path)}">${tag ? `<span class="card-tag">${tag}</span>` : ''}
    <h3>${name}</h3><p>${blurb}</p><span class="tlink">Read more →</span></a>`).join('')}</div>`;

// Inline publish gate: [[licence: …]] keeps its text only when that gate is
// visible; otherwise the fragment (an unpublished price) is dropped entirely.
const applyGate = (s) => tidy(String(s ?? '').replace(/\[\[(\w+):([\s\S]*?)\]\]/g, (_, g, t) => (gateVisible(g) ? t : '')));

// Dropping a gated fragment can strand its separator: "৳2,500 · ." or
// "· · ". Collapse repeated separators and any left hanging at the end.
function tidy(s) {
  return s
    .replace(/(\s*·\s*){2,}/g, ' · ')
    .replace(/\s*·\s*(?=[.)]?\s*$)/, '')
    .replace(/^\s*·\s*/, '')
    .trim();
}

// A positive price figure (৳0 means "no charge" and is never withheld).
const PRICE = /৳[1-9]/;

function section(s, visible) {
  const body = s.body ? applyGate(s.body) : '';
  const bullets = s.bullets ? s.bullets.map(applyGate) : null;
  const keptDefs = s.defs
    ? s.defs.map(([b, t]) => [applyGate(b), applyGate(t)]).filter(([, t]) => visible || !PRICE.test(t))
    : null;
  const keepBody = body && (visible || !PRICE.test(body));
  const keepBullets = bullets && bullets.length && (visible || !bullets.some((b) => PRICE.test(b)));
  const keepDefs = keptDefs && keptDefs.length;
  const inner = `${keepBody ? `<p>${body}</p>` : ''}${keepBullets ? list(bullets) : ''}${keepDefs ? defs(keptDefs) : ''}${s.cards ? cards(s.cards) : ''}`;
  if (!inner) return '';
  return `${s.h2 ? `<h2>${s.h2}</h2>` : ''}
  ${inner}`;
}

export default function article(page) {
  const d = CONTENT[page.path];
  if (!d) return null;
  const visible = gateVisible(page.gate);
  const crumb = d.crumb || HUB(page.path);
  const costText = applyGate(d.cost);
  const cost = !d.cost ? ''
    : !visible
      ? `<div class="cost-note gated"><b>Pricing</b><p>Prices for this treatment publish ${GATE_NOTE[page.gate].toLowerCase()}. Your doctor will give you a written, itemised cost after assessment.</p></div>`
      : costText ? `<div class="cost-note"><b>What it costs at the Centre</b><p>${costText}</p><p class="cost-now">Centre prices apply from opening in 2027 and exclude ${Math.round(SITE.vatRate * 100)}% VAT. At Alliance and DCIMCH today, fees follow each hospital’s own tariff.</p></div>` : '';
  return `
<section class="pg-hero">
  <div class="wrap">
    <p class="crumb"><a href="${href('/')}">Home</a> / ${crumb ? `<a href="${href(crumb[1])}">${crumb[0]}</a> / ` : ''}${d.crumbLabel || ''}</p>
    <h1>${d.h1}</h1>
    <p class="lede">${applyGate(d.lede)}</p>
    ${CLINICAL(page.path) ? `<p class="byline">Written and reviewed by Dr. Sumya Pervin, FCPS (Skin &amp; VD), BMDC A-59492 · Last reviewed ${SITE.reviewed}.</p>` : ''}
    <div class="h-ctas">
      <a class="btn btn-ink" href="${href('/book/')}">Book a consultation</a>
      <a class="btn btn-ghost" href="${href('/prices/')}">See prices</a>
    </div>
  </div>
</section>

<section class="s-sec"><div class="wrap s-prose">
  ${d.sections.map((s) => section(s, visible)).filter(Boolean).join('\n  ')}
  ${cost}
  ${d.faqs ? `<h2>Questions patients ask</h2><div class="faq">${d.faqs
    .map(([q, a]) => `<details><summary>${q}</summary><p>${applyGate(a)}</p></details>`).join('')}</div>` : ''}
  ${d.links ? `<p class="article-links"><b>Related:</b> ${d.links
    .map(([l, p]) => `<a class="tlink" href="${href(p)}">${l}</a>`).join(' · ')}</p>` : ''}
  ${REFERENCES[page.path] ? `<div class="refs"><b>References</b><ol>${REFERENCES[page.path]
    .map((r) => `<li>${r}</li>`).join('')}</ol></div>` : ''}
  <div class="h-final h-final-inner">
    <h2>Not sure whether this is you? Start with a diagnosis.</h2>
    <div class="h-final-ctas">
      <a class="btn btn-ink" href="${href('/book/')}">Book a consultation</a>
      <a class="btn btn-ghost-inv" href="${href('/what-we-do-not-offer/')}">See what we don’t offer</a>
    </div>
  </div>
</div></section>`;
}
