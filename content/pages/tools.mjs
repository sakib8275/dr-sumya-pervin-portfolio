// Interactive tools — docx §5.40. Bespoke bodies because they carry forms;
// site.js wires the behaviour (CSP-safe: no inline handlers, no data stored).
import { href } from '../site.mjs';

const hero = (crumb, h1, lede) => `
<section class="pg-hero"><div class="wrap">
  <p class="crumb"><a href="${href('/')}">Home</a> / ${crumb}</p>
  <h1>${h1}</h1>
  <p class="lede">${lede}</p>
</div></section>`;

const cta = (h2, label, book = href('/book/')) => `
<div class="h-final h-final-inner">
  <h2>${h2}</h2>
  <div class="h-final-ctas">
    <a class="btn btn-ink" href="${book}">${label}</a>
    <a class="btn btn-ghost-inv" href="${href('/prices/')}">See prices</a>
  </div>
</div>`;

export function moleCheck() {
  const signs = [
    ['A', 'Asymmetry', 'One half does not match the other.'],
    ['B', 'Border', 'Edges are irregular, ragged or blurred.'],
    ['C', 'Colour', 'More than one colour, or a new dark colour.'],
    ['D', 'Diameter', 'Larger than a pencil eraser (about 6 mm), or growing.'],
    ['E', 'Evolving', 'Changing in size, shape, colour, or starting to itch or bleed.'],
    ['S', 'Brown-skin rule', 'A spot on the palm, sole, or a new dark streak under a nail.'],
  ];
  // docx §5.40 asks for "steps with illustrations". Schematic, not clinical
  // photographs: each drawing shows only the one property its letter names.
  const ART = {
    A: '<path class="ab-m" d="M28 10c8 0 15 6 15 16 0 11-6 20-15 20-6 0-8-4-9-9-1-4-6-6-6-12 0-9 7-15 15-15z"/><path class="ab-axis" d="M28 5v46"/>',
    B: '<path class="ab-m" d="M28 9l4 5 7-3 1 7 7 3-4 6 4 6-7 3 0 7-7-2-4 6-5-5-7 2 0-7-7-3 4-6-5-5 7-3-1-7 7 2z"/>',
    C: '<circle class="ab-m2" cx="28" cy="28" r="17"/><path class="ab-m" d="M18 23c3-6 12-6 14 0s-4 10-9 9-7-5-5-9z"/><circle class="ab-m3" cx="35" cy="34" r="5.5"/>',
    D: '<circle class="ab-m" cx="17" cy="24" r="11"/><path class="ab-rule" d="M6 44h22M6 40.5v7M28 40.5v7"/><text class="ab-t" x="31" y="47.5">6 mm</text>',
    E: '<circle class="ab-m" cx="13" cy="30" r="6"/><path class="ab-rule" d="M23 30h9m-3.5-3.5L32 30l-3.5 3.5"/><path class="ab-m" d="M45 16c6 2 9 9 7 15s-8 9-13 7-7-8-5-13 5-10 11-9z"/>',
    S: '<rect class="ab-nail" x="15" y="8" width="26" height="40" rx="12"/><rect class="ab-m3" x="25.5" y="10" width="5" height="36" rx="2.5"/>',
  };
  const art = (k) => `<svg class="ab" viewBox="0 0 56 56" aria-hidden="true" focusable="false">${ART[k]}</svg>`;
  return `${hero('Mole check', 'Check your moles in 5 minutes', 'The ABCDE rule, plus the brown-skin rule. Nothing you enter is stored, and this tells you whether a mole deserves a dermatologist’s look — it is not a diagnosis.')}
<section class="s-sec"><div class="wrap">
  <form class="tool" data-tool="mole-check" novalidate>
    <p class="tool-note">Tick anything that applies to the mole you are checking. Nothing is sent anywhere.</p>
    <div class="tool-list">
      ${signs.map(([k, t, d]) => `<label class="tool-check tool-check-art"><input type="checkbox" data-sign="${k}">${art(k)}<span><b>${k}: ${t}.</b> ${d}</span></label>`).join('')}
    </div>
    <button type="submit" class="btn btn-ink">Check my mole</button>
  </form>
  <div class="tool-out" id="moleOut" role="status" aria-live="polite" hidden></div>
  <p class="tool-fine">This tool is a guide, not a diagnosis. If a mole is new, changing, or bleeding, <a class="tlink" href="${href('/book/')}?reason=mole">book a mole check with a priority slot</a>.</p>
  ${cta('Worth a dermatologist’s look? Book a mole check.', 'Book a mole check', `${href('/book/')}?reason=mole`)}
</div></section>`;
}

export function skinType() {
  const q = [
    ['feel', 'How does your skin feel by midday?', [['oily', 'Oily or shiny all over'], ['tzone', 'Shiny only on the T-zone'], ['comfort', 'Comfortable'], ['tight', 'Tight or flaky']]],
    ['react', 'How does it react to a new product?', [['sting', 'Stings, reddens or itches'], ['fine', 'Usually fine'], ['breakout', 'Often breaks out']]],
    ['sun', 'How does your skin react to the sun?', [['burn', 'Burns easily, rarely tans'], ['gradual', 'Tans gradually'], ['rare', 'Rarely burns'], ['deep', 'Almost never burns, tans deeply']]],
    ['breakouts', 'How often do you get breakouts?', [['often', 'Often'], ['sometimes', 'Sometimes'], ['rare', 'Rarely']]],
    ['marks', 'Do you get dark marks after spots?', [['yes', 'Yes, easily'], ['sometimes', 'Sometimes'], ['no', 'No']]],
    ['outdoor', 'How much time do you spend outdoors?', [['lots', 'Most of the day'], ['some', 'A few hours'], ['little', 'Mostly indoors']]],
  ];
  return `${hero('Skin type guide', 'Your skin type, in 2 minutes', 'Six questions to your skin type and sun-reactivity, with a simple routine for Dhaka’s humidity. Nothing is stored, and this is guidance — not a diagnosis.')}
<section class="s-sec"><div class="wrap">
  <form class="tool" data-tool="skin-type" novalidate>
    ${q.map(([name, label, opts]) => `<fieldset class="tool-q"><legend>${label}</legend>
      <div class="tool-opts">${opts.map(([v, t]) => `<label class="tool-radio"><input type="radio" name="${name}" value="${v}"><span>${t}</span></label>`).join('')}</div>
    </fieldset>`).join('')}
    <button type="submit" class="btn btn-ink">See my skin type</button>
  </form>
  <div class="tool-out" id="skinOut" role="status" aria-live="polite" hidden></div>
  <p class="tool-fine">A guide to routine and suitability, not a diagnosis. For a diagnosis, book a consultation.</p>
  ${cta('Want a routine built for your skin? Book a consultation.', 'Book a consultation')}
</div></section>`;
}

export function prep() {
  const q = [
    ['duration', 'How long has the problem been there?', [['new', 'Less than a month'], ['mid', '1–6 months'], ['long', '6–12 months'], ['chronic', 'More than a year']]],
    ['itch', 'Does it itch, hurt or spread?', [['yes', 'Yes'], ['no', 'No']]],
    ['products', 'How many products have you already tried?', [['none', 'None'], ['few', 'One or two'], ['many', 'Three or more']]],
    ['doctors', 'Have you seen another doctor for this?', [['yes', 'Yes'], ['no', 'No']]],
    ['conditions', 'Do you have other health conditions or take other medicines?', [['yes', 'Yes'], ['no', 'No']]],
    ['photo', 'Can you bring a photo of the problem at its worst?', [['yes', 'Yes'], ['no', 'No / it is always visible']]],
    ['cosmetic', 'Is this mainly a cosmetic concern (scars, pigment, hair, ageing)?', [['yes', 'Yes'], ['no', 'No']]],
  ];
  return `${hero('Prepare for your visit', 'Make the most of your first visit', 'A two-minute check so you arrive prepared and leave with a plan. Nothing you enter is stored, and nothing here is a diagnosis.')}
<section class="s-sec"><div class="wrap">
  <form class="tool" data-tool="prep" novalidate>
    ${q.map(([name, label, opts]) => `<fieldset class="tool-q"><legend>${label}</legend>
      <div class="tool-opts">${opts.map(([v, t]) => `<label class="tool-radio"><input type="radio" name="${name}" value="${v}"><span>${t}</span></label>`).join('')}</div>
    </fieldset>`).join('')}
    <button type="submit" class="btn btn-ink">Show what to expect</button>
  </form>
  <div class="tool-out" id="prepOut" role="status" aria-live="polite" hidden></div>
  <p class="tool-fine">This does not diagnose and does not name procedures. It only suggests the depth of visit that usually fits.</p>
  ${cta('Ready? Pick a day and we’ll send your serial.', 'Book a consultation')}
</div></section>`;
}
