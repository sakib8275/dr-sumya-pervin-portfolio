// Interactive tools — docx §5.40. Bespoke bodies because they carry forms;
// site.js wires the behaviour (CSP-safe: no inline handlers, no data stored).
import { href } from '../site.mjs';

const hero = (crumb, h1, lede) => `
<section class="pg-hero"><div class="wrap">
  <p class="crumb"><a href="${href('/')}">Home</a> / ${crumb}</p>
  <h1>${h1}</h1>
  <p class="lede">${lede}</p>
</div></section>`;

const cta = (h2, label) => `
<div class="h-final h-final-inner">
  <h2>${h2}</h2>
  <div class="h-final-ctas">
    <a class="btn btn-ink" href="${href('/book/')}">${label}</a>
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
  return `${hero('Mole check', 'Check your moles in 5 minutes', 'The ABCDE rule, plus the brown-skin rule. Nothing you enter is stored, and this tells you whether a mole deserves a dermatologist’s look — it is not a diagnosis.')}
<section class="s-sec"><div class="wrap">
  <form class="tool" data-tool="mole-check" novalidate>
    <p class="tool-note">Tick anything that applies to the mole you are checking. Nothing is sent anywhere.</p>
    <div class="tool-list">
      ${signs.map(([k, t, d]) => `<label class="tool-check"><input type="checkbox" data-sign="${k}"><span><b>${k} — ${t}.</b> ${d}</span></label>`).join('')}
    </div>
    <button type="submit" class="btn btn-ink">Check my mole</button>
  </form>
  <div class="tool-out" id="moleOut" role="status" aria-live="polite" hidden></div>
  <p class="tool-fine">This tool is a guide, not a diagnosis. If a mole is new, changing, or bleeding, book a mole check with a priority slot.</p>
  ${cta('Worth a dermatologist’s look? Book a mole check.', 'Book a mole check')}
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
