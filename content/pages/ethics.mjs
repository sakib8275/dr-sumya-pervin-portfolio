// "What we don't offer" body — docx §5.38 copy verbatim. This is the
// credibility page the interlinking map calls the trust anchor.
import { href } from '../site.mjs';

const REFUSALS = [
  ['Skin-whitening drips and injections (glutathione and similar)',
   'There is no good evidence they lighten skin safely or lastingly, products are often unregistered, and serious reactions have been reported. Skin colour is not a disease.'],
  ['Steroid creams without a diagnosis',
   'Over-the-counter steroid and “mixed” creams cause skin thinning, stubborn acne-like rashes, stretch marks, and make fungal infections spread. Many patients we see were harmed this way.'],
  ['“Instant fairness” or “glow” packages',
   'Lasting change in skin needs weeks. Packages promising instant results usually rely on bleaching agents or temporary effects.'],
  ['Treatment from a photo alone',
   'Skin diseases that look alike in a photo are treated very differently. We will advise you on what to do next, but we won’t prescribe without an examination.'],
  ['Unregistered injectables and products',
   'We only use medicines and devices registered with DGDA, bought through traceable channels.'],
  ['Guaranteed or permanent results',
   'Honest medicine gives ranges, not promises. Anyone guaranteeing a result is guessing.'],
];

export default function ethics() {
  return `
<section class="pg-hero">
  <div class="wrap">
    <p class="crumb"><a href="${href('/')}">Home</a> / What we don’t offer</p>
    <h1>Treatments we don’t offer, and why</h1>
    <p class="lede">Some of the most profitable treatments in Dhaka’s skin market are ones we refuse to provide. Not because they are unpopular, but because the evidence doesn’t support them, or because they cause harm we see every week in clinic.</p>
  </div>
</section>

<section class="s-sec"><div class="wrap">
  <div class="ethics-grid">
    ${REFUSALS.map(([t, w]) => `<article class="ethics-card"><h3>${t}</h3><p>${w}</p></article>`).join('')}
  </div>
  <div class="h-final h-final-inner">
    <h2>Good medicine starts with what we won’t do.</h2>
    <div class="h-final-ctas">
      <a class="btn btn-ink" href="${href('/about/')}">About Dr. Sumya</a>
      <a class="btn btn-ghost-inv" href="${href('/prices/')}">See what we do offer</a>
    </div>
  </div>
</div></section>`;
}
