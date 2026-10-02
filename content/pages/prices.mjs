// Prices body — docx §5.37 structure, every figure from content/prices.mjs
// (docx Part 6). Gated sections render with their badge in staging and are
// dropped by the build when the live gate says so.
import { href, gateVisible } from '../site.mjs';
import { SECTIONS, WHO, FOLLOW_UPS, ESTIMATOR } from '../prices.mjs';

const GATE_LABEL = { opening: 'From Centre opening, 2027', licence: 'With procedure licensing', laser: 'When the laser suite opens', year2: 'Year-2 device' };

const whoBadge = (k) => `<span class="who who-${k}" title="${WHO[k].text}">${WHO[k].label}</span>`;

function consultationCards(s) {
  return `<div class="pr-cards">${s.cards.map((c) => `
    <article class="pr-card${c.rec ? ' rec' : ''}">${c.rec ? `<p class="pr-flag">${c.rec}</p>` : ''}
      <h3>${c.name}</h3>
      <div class="pr-price">${c.price}</div>
      <p class="pr-meta">${whoBadge(c.meta[0])} ${c.meta[1]}</p>
      <ul>${c.incl.map((i) => `<li>${i}</li>`).join('')}</ul>
    </article>`).join('')}</div>
    <div class="pr-fu">${FOLLOW_UPS.map(([p, t]) => `<div><b>${p}</b>${t}</div>`).join('')}</div>
    ${s.rows ? `<table class="pr-table"><thead><tr><th>Service</th><th>Band</th><th>Price</th><th>What you get</th><th>Who</th></tr></thead>
      <tbody>${s.rows.map((r) => `<tr><td class="bn" data-th="Service">${r[0]}</td><td data-th="Band">${r[1]}</td><td class="pp" data-th="Price">${r[2]}</td><td data-th="What you get">${r[3]}</td><td data-th="Who">${whoBadge(r[4])}</td></tr>`).join('')}</tbody></table>` : ''}`;
}

function plans(s) {
  return `<div class="pr-plans pr-plans-${s.plans.length}">${s.plans.map((p) => `
    <article class="pr-plan${p.rec ? ' rec' : ''}">${p.rec ? `<p class="pr-flag">${p.rec}</p>` : ''}
      <h3>${p.name}</h3>
      <div class="pr-plan-row"><span class="pr-price">${p.price}</span><span class="pr-was">${p.was}</span>${p.save ? `<span class="pr-save">${p.save}</span>` : ''}</div>
      <ul>${p.incl.map(([l, v]) => `<li><span>${l}</span><span>${v}</span></li>`).join('')}</ul>
    </article>`).join('')}</div>`;
}

// data-th mirrors each thead label so ≤820px CSS can rebuild every row as a
// stacked card (docx §7.3: band → price → inclusions → who-performs badge).
function table(s) {
  return `<table class="pr-table"><thead><tr><th>Service</th><th>Band / tier</th><th>Price</th><th>What you get</th><th>Who</th></tr></thead>
    <tbody>${s.rows.filter((r) => gateVisible(r[5])).map((r) => `
    <tr>${r[5] ? `<td class="bn" colspan="2" data-th="Service">${r[0]}<span class="gate-tag">${GATE_LABEL[r[5]]}</span></td><td class="pp" data-th="Price">${r[2]}</td>` : `<td class="bn" data-th="Service">${r[0]}</td><td data-th="Band / tier">${r[1]}</td><td class="pp" data-th="Price">${r[2]}</td>`}<td data-th="What you get">${r[3]}</td><td data-th="Who">${whoBadge(r[4])}</td></tr>`).join('')}</tbody></table>`;
}

function promises(s) {
  return `<div class="pr-prom">${s.prom.map(([t, d]) => `<div><b>${t}</b><p>${d}</p></div>`).join('')}</div>`;
}

function estimator() {
  const options = ESTIMATOR.items.map((it, i) => `<option value="${i}">${it.concern}</option>`).join('');
  const areas = ESTIMATOR.items.map((it, i) =>
    it.areas.map(([label, per, course], j) => `<option value="${j}" data-i="${i}" data-per="${per}" data-course="${course}">${label}</option>`).join('')
  ).join('');
  return `
<div class="pr-est" id="estimator">
  <div class="pr-est-in">
    <p class="eyebrow">Estimate your course cost</p>
    <h2>Plan it before you commit</h2>
    <p class="pr-est-note">A planning guide, not a quote. Your doctor confirms the number of sessions after examining you.</p>
    <div class="pr-est-form">
      <label>Treatment<select id="estConcern">${options}</select></label>
      <label>Area / band<select id="estArea">${areas}</select></label>
      <label>Payment<div class="seg" id="estPay"><button type="button" class="on" data-pay="course">Course</button><button type="button" data-pay="single">Per session</button></div></label>
      <label>Performed by<div class="seg" id="estWho"><button type="button" class="on" data-who="n">Nurse (N)</button><button type="button" data-who="dr">Dr. Sumya (+25%)</button></div></label>
    </div>
  </div>
  <div class="pr-est-out">
    <p class="eyebrow">Your estimate</p>
    <div class="pr-est-big" id="estTotal">৳—</div>
    <p id="estSub">for the full course</p>
    <div id="estLines"></div>
    <p class="pr-est-fine">Procedure Assessment fee (৳1,500) is deducted from session 1. EMI options shown at the Centre.</p>
  </div>
</div>`;
}

export default function prices() {
  const visible = SECTIONS.filter((s) => gateVisible(s.gate));
  const tabs = visible.map((s) => `<a href="#${s.id}">${s.tab}${s.gate !== 'opening' ? ` <span class="gate-dot" title="${GATE_LABEL[s.gate]}">●</span>` : ''}</a>`).join('');
  const sectionsHtml = visible.map((s) => `
    <section class="s-sec pr-sec${s.gate !== 'opening' ? ' gated' : ''}" id="${s.id}">
      <div class="wrap">
        ${s.gate !== 'opening' ? `<p class="gate-note">${GATE_LABEL[s.gate]}</p>` : ''}
        <div class="s-head"><div><h2>${s.head}</h2></div></div>
        <p class="lede">${s.lede}</p>
        ${s.cards ? consultationCards(s) : ''}${s.plans ? plans(s) : ''}${s.table ? table(s) : ''}${s.prom ? promises(s) : ''}
      </div>
    </section>`).join('');

  return `
<section class="pg-hero">
  <div class="wrap">
    <p class="crumb"><a href="${href('/')}">Home</a> / Prices</p>
    <h1>Prices — exactly what you get, before you come.</h1>
    <p class="lede">Every fee below lists what it includes, how long the doctor spends with you, and who performs the treatment. Course prices are offered only after a diagnosis, and you can always pay session by session.</p>
    <div class="assure">
      <span>✓ 12-month price lock on courses</span><span>✓ Unused sessions refunded</span><span>✓ No compulsory products</span><span>✓ Card · bKash · Nagad · 0% EMI</span>
    </div>
  </div>
</section>
<nav class="pr-tabs" aria-label="Price sections"><div class="wrap">${tabs}</div></nav>
<section class="s-sec"><div class="wrap">
  <div class="pr-legend"><b>Who performs:</b>
    <span>${whoBadge('dr')} Dr. Sumya personally</span>
    <span>${whoBadge('drn')} Dr. Sumya with a trained nurse</span>
    <span>${whoBadge('n')} Trained nurse under Dr. Sumya’s written protocol, doctor on site</span>
  </div>
</div></section>
${estimator()}
${sectionsHtml}
<p class="pr-foot">Prices include applicable VAT [confirm with CA] · Prices reviewed: [date] · Hospital-chamber fees follow each hospital’s tariff.</p>`;
}
