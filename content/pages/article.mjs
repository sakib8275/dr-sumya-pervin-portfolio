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
// CSP-safe by construction: only generated tags, no inline handlers, and every
// internal link is a sitemap path (tests/pages.test.mjs asserts they resolve).
import { href } from '../site.mjs';
import { CONTENT } from './content.mjs';

const HUB = (path) => {
  if (path.startsWith('/conditions/')) return ['Medical dermatology', '/medical-dermatology/'];
  if (path.startsWith('/concerns/') || path.startsWith('/treatments/')) return ['Aesthetic &amp; laser', '/aesthetic-and-laser/'];
  return null;
};

const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const defs = (items) => `<ul class="defs">${items.map(([b, t]) => `<li><b>${b}</b> ${t}</li>`).join('')}</ul>`;
const cards = (items) => `<div class="cards">${items.map(([name, blurb, path, tag]) => `
  <a class="card" href="${href(path)}">${tag ? `<span class="card-tag">${tag}</span>` : ''}
    <h3>${name}</h3><p>${blurb}</p><span class="tlink">Read more →</span></a>`).join('')}</div>`;

function section(s) {
  return `${s.h2 ? `<h2>${s.h2}</h2>` : ''}
  ${s.body ? `<p>${s.body}</p>` : ''}
  ${s.bullets ? list(s.bullets) : ''}
  ${s.defs ? defs(s.defs) : ''}
  ${s.cards ? cards(s.cards) : ''}`;
}

export default function article(page) {
  const d = CONTENT[page.path];
  if (!d) return null;
  const crumb = d.crumb || HUB(page.path);
  return `
<section class="pg-hero">
  <div class="wrap">
    <p class="crumb"><a href="${href('/')}">Home</a> / ${crumb ? `<a href="${href(crumb[1])}">${crumb[0]}</a> / ` : ''}${d.crumbLabel || ''}</p>
    <h1>${d.h1}</h1>
    <p class="lede">${d.lede}</p>
    <div class="h-ctas">
      <a class="btn btn-ink" href="${href('/book/')}">Book a consultation</a>
      <a class="btn btn-ghost" href="${href('/prices/')}">See prices</a>
    </div>
  </div>
</section>

<section class="s-sec"><div class="wrap s-prose">
  ${d.sections.map(section).join('\n  ')}
  ${d.cost ? `<div class="cost-note"><b>What it typically costs here</b><p>${d.cost}</p></div>` : ''}
  ${d.faqs ? `<h2>Questions patients ask</h2><div class="faq">${d.faqs
    .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>` : ''}
  ${d.links ? `<p class="article-links"><b>Related:</b> ${d.links
    .map(([l, p]) => `<a class="tlink" href="${href(p)}">${l}</a>`).join(' · ')}</p>` : ''}
  <div class="h-final h-final-inner">
    <h2>Not sure whether this is you? Start with a diagnosis.</h2>
    <div class="h-final-ctas">
      <a class="btn btn-ink" href="${href('/book/')}">Book a consultation</a>
      <a class="btn btn-ghost-inv" href="${href('/what-we-do-not-offer/')}">See what we don’t offer</a>
    </div>
  </div>
</div></section>`;
}
