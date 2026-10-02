// site.js — the multi-page shell's only script: nav dropdowns, the mobile
// drawer, and the course-cost estimator on /prices/. CSP-safe by design (the
// Pages middleware ships no 'unsafe-inline'): zero inline handlers anywhere.
(() => {
  'use strict';

  // — Nav dropdowns: click/touch toggles, focus-within via CSS, Esc closes —
  for (const drop of document.querySelectorAll('.nav-drop')) {
    const btn = drop.querySelector('.nav-drop-btn');
    btn.addEventListener('click', () => {
      const open = drop.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    drop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drop.classList.contains('open')) {
        drop.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }
  document.addEventListener('click', (e) => {
    for (const drop of document.querySelectorAll('.nav-drop.open')) {
      if (!drop.contains(e.target)) {
        drop.classList.remove('open');
        drop.querySelector('.nav-drop-btn').setAttribute('aria-expanded', 'false');
      }
    }
  });

  // — Mobile drawer —
  const drawer = document.getElementById('drawer');
  const burger = document.getElementById('burger');
  const close = document.getElementById('drawerClose');
  if (drawer && burger) {
    burger.addEventListener('click', () => {
      drawer.classList.add('active');
      burger.setAttribute('aria-expanded', 'true');
      if (close) close.focus();
    });
    const shut = () => {
      drawer.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
    };
    if (close) close.addEventListener('click', shut);
    drawer.addEventListener('click', (e) => { if (e.target.closest('a')) shut(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('active')) shut();
    });
  }

  // — Course-cost estimator (docx 5.37): a planning guide, not a quote.
  // Prices arrive as data attributes from content/prices.mjs; the arithmetic
  // mirrors the docx course rules (fixed course prices, +25% doctor-performed
  // where the docx allows it).
  const concern = document.getElementById('estConcern');
  const area = document.getElementById('estArea');
  const total = document.getElementById('estTotal');
  if (!concern || !area || !total) return;
  const paySeg = document.getElementById('estPay');
  const whoSeg = document.getElementById('estWho');
  const sub = document.getElementById('estSub');
  const lines = document.getElementById('estLines');

  const state = { pay: 'course', who: 'n' };
  const taka = (n) => '৳' + n.toLocaleString('en-IN');
  const active = (seg) => seg.querySelector('button.on');

  for (const seg of [paySeg, whoSeg]) {
    if (!seg) continue;
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      active(seg).classList.remove('on');
      b.classList.add('on');
      if (seg === paySeg) state.pay = b.dataset.pay;
      else state.who = b.dataset.who;
      render();
    });
  }
  concern.addEventListener('change', () => { syncAreas(); render(); });
  area.addEventListener('change', render);

  function syncAreas() {
    for (const opt of area.options) opt.hidden = opt.dataset.i !== concern.value;
    const first = [...area.options].find((o) => !o.hidden);
    if (first) area.value = first.value;
  }

  function render() {
    const opt = area.options[area.selectedIndex];
    if (!opt || opt.hidden) return;
    const per = Number(opt.dataset.per);
    const course = Number(opt.dataset.course);
    const item = Number(concern.value);
    // Only laser hair removal offers the doctor-performed +25% option.
    const uplift = state.who === 'dr' && item === 0 ? 1.25 : 1;
    if (state.pay === 'single') {
      total.textContent = taka(Math.round(per * uplift));
      sub.textContent = 'per session';
      lines.innerHTML =
        `<div class="ln"><span>Full course (6 sessions, pay for 5)</span><b>${taka(Math.round(course * uplift))}</b></div>` +
        `<div class="ln"><span>Typical course</span><b>6–8 sessions, 4–6 weeks apart</b></div>`;
    } else {
      total.textContent = taka(Math.round(course * uplift));
      sub.textContent = 'for the full course';
      lines.innerHTML =
        `<div class="ln"><span>Per session</span><b>${taka(Math.round(per * uplift))}</b></div>` +
        (item === 0 ? `<div class="ln"><span>Session 6</span><b>Included</b></div>` : '') +
        `<div class="ln"><span>Typical course</span><b>6–8 sessions, 4–6 weeks apart</b></div>`;
    }
  }

  syncAreas();
  render();
})();
