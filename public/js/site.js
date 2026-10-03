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

  // — Mobile drawer — light panel over a scrim; Tab is trapped inside while
  // open (the markup already claims aria-modal) and focus returns to the
  // burger on every close path: ✕ button, scrim tap, link tap, Escape.
  const drawer = document.getElementById('drawer');
  const burger = document.getElementById('burger');
  const close = document.getElementById('drawerClose');
  const scrim = document.getElementById('scrim');
  if (drawer && burger) {
    const focusables = () => drawer.querySelectorAll('a[href], button:not([disabled])');
    const open = () => {
      drawer.classList.add('active');
      if (scrim) scrim.classList.add('active');
      document.body.classList.add('no-scroll');
      burger.setAttribute('aria-expanded', 'true');
      if (close) close.focus();
    };
    const shut = () => {
      drawer.classList.remove('active');
      if (scrim) scrim.classList.remove('active');
      document.body.classList.remove('no-scroll');
      burger.setAttribute('aria-expanded', 'false');
      burger.focus();
    };
    burger.addEventListener('click', open);
    if (close) close.addEventListener('click', shut);
    if (scrim) scrim.addEventListener('click', shut);
    drawer.addEventListener('click', (e) => { if (e.target.closest('a')) shut(); });
    document.addEventListener('keydown', (e) => {
      if (!drawer.classList.contains('active')) return;
      if (e.key === 'Escape') { shut(); return; }
      if (e.key !== 'Tab') return;
      const items = [...focusables()];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  // — Package detail view (home tiers, /prices/ cards and care plans). A card's
  // "See what's included" button is stretched over the card, so a tap anywhere
  // on it lands here. The detail is a build-time <template>; it is cloned into
  // the native <dialog>, whose showModal() supplies focus containment and Esc.
  // Focus returns to the card's button on every close path.
  // Where the browser has View Transitions, the sheet grows out of the tapped
  // card and shrinks back into it: card and sheet trade the name "pkg" across
  // the DOM change. Without them, or under reduced motion, it opens as before.
  const view = document.getElementById('pkgView');
  if (view && typeof view.showModal === 'function') {
    const body = document.getElementById('pkgBody');
    let opener = null;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cardOf = (el) => el && el.closest('.h-tier, .pr-card, .pr-plan');
    let running = null;
    const morph = (from, to, update) => {
      if (!document.startViewTransition || calm.matches || !from || !to) { update(); return; }
      from.style.viewTransitionName = 'pkg';
      view.classList.add('vt');
      const t = running = document.startViewTransition(() => {
        from.style.viewTransitionName = '';
        update();
        to.style.viewTransitionName = 'pkg';
      });
      t.finished.finally(() => {
        to.style.viewTransitionName = '';
        view.classList.remove('vt');
        if (running === t) running = null;
      });
    };
    // While a transition plays, the browser hit-tests its overlay, so every
    // click lands on <html> and is lost: close a sheet, tap the next card at
    // once, and nothing would happen. Finish the transition immediately and
    // replay the click on whatever is really under the pointer.
    document.addEventListener('click', (e) => {
      if (!running || e.target !== document.documentElement) return;
      const { clientX: x, clientY: y } = e;
      running.skipTransition();
      running.finished.finally(() => {
        const el = document.elementFromPoint(x, y);
        if (el && el !== document.documentElement) el.click();
      });
    }, true);
    const shut = () => { if (view.open) morph(view, cardOf(opener), () => view.close()); };
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-pkg-open]');
      if (trigger) {
        const tpl = document.getElementById('pkg-' + trigger.dataset.pkgOpen);
        if (!tpl) return;
        opener = trigger;
        morph(cardOf(trigger), view, () => {
          body.replaceChildren(tpl.content.cloneNode(true));
          view.showModal();
          document.body.classList.add('no-scroll');
          view.scrollTop = 0;
          const title = view.querySelector('#pkgTitle');
          if (title) title.focus({ preventScroll: true });
        });
        return;
      }
      if (e.target.closest('[data-pkg-close]')) shut();
    });
    // Esc closes through the same path, so it shrinks back into the card too.
    view.addEventListener('cancel', (e) => { e.preventDefault(); shut(); });
    // A click on the backdrop targets the <dialog> itself (the panel fills it).
    view.addEventListener('click', (e) => { if (e.target === view) shut(); });
    view.addEventListener('close', () => {
      document.body.classList.remove('no-scroll');
      if (opener) opener.focus({ preventScroll: true });
    });
  }

  // — "Consulting today" on the home chamber columns. Weekdays are stamped at
  // build time from functions/lib/schedule.js; Dhaka is UTC+6 all year, so
  // today is Dhaka's today wherever the phone is (same rule as /book/).
  const dhakaDay = new Date(Date.now() + 6 * 3600 * 1000).getUTCDay();
  for (const ch of document.querySelectorAll('.h-ch[data-days]')) {
    if (!ch.dataset.days.split(',').map(Number).includes(dhakaDay)) continue;
    ch.classList.add('is-today');
    const flag = ch.querySelector('.h-ch-today');
    if (flag) flag.hidden = false;
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
      const prev = active(seg);
      prev.classList.remove('on'); prev.setAttribute('aria-pressed', 'false');
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
      if (seg === paySeg) state.pay = b.dataset.pay;
      else state.who = b.dataset.who;
      render();
    });
  }
  concern.addEventListener('change', () => { syncAreas(); render(); });
  area.addEventListener('change', render);

  // The area list is rebuilt from the full set rather than hiding <option>s:
  // iOS Safari's native picker ignores the hidden attribute on options.
  const allAreas = [...area.options].map((o) => o.cloneNode(true));
  function syncAreas() {
    area.replaceChildren(...allAreas.filter((o) => o.dataset.i === concern.value).map((o) => o.cloneNode(true)));
    area.selectedIndex = 0;
  }

  function render() {
    const opt = area.options[area.selectedIndex];
    if (!opt) return;
    const per = Number(opt.dataset.per);
    const course = Number(opt.dataset.course);
    const item = Number(concern.value);
    // Only laser hair removal offers the doctor-performed +25% option.
    const uplift = state.who === 'dr' && item === 0 ? 1.25 : 1;
    // Displayed prices exclude VAT; the estimator shows the 15% added at checkout.
    const vat = Number(document.getElementById('estimator').dataset.vat) || 0;
    const base = state.pay === 'single' ? Math.round(per * uplift) : Math.round(course * uplift);
    const vatAmount = Math.round(base * vat);
    const vatLines =
      `<div class="ln"><span>VAT (${Math.round(vat * 100)}%, added at checkout)</span><b>${taka(vatAmount)}</b></div>` +
      `<div class="ln ln-total"><span>Total at checkout</span><b>${taka(base + vatAmount)}</b></div>`;
    if (state.pay === 'single') {
      total.textContent = taka(Math.round(per * uplift));
      sub.textContent = 'per session';
      lines.innerHTML =
        `<div class="ln"><span>Full course (6 sessions, pay for 5)</span><b>${taka(Math.round(course * uplift))}</b></div>` +
        `<div class="ln"><span>Typical course</span><b>6–8 sessions, 4–6 weeks apart</b></div>` +
        vatLines;
    } else {
      total.textContent = taka(Math.round(course * uplift));
      sub.textContent = 'for the full course';
      lines.innerHTML =
        `<div class="ln"><span>Per session</span><b>${taka(Math.round(per * uplift))}</b></div>` +
        (item === 0 ? `<div class="ln"><span>Session 6</span><b>Included</b></div>` : '') +
        `<div class="ln"><span>Typical course</span><b>6–8 sessions, 4–6 weeks apart</b></div>` +
        vatLines;
    }
  }

  syncAreas();
  render();
})();

// — Interactive tools (docx §5.40): mole check, skin-type guide, prepare-for-visit.
// All client-side, nothing stored, CSP-safe (no inline handlers).
(() => {
  'use strict';
  const val = (form, name) => {
    const el = form.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  };
  const show = (id, html) => {
    const out = document.getElementById(id);
    if (!out) return;
    out.innerHTML = html;
    out.hidden = false;
    out.focus && out.focus();
  };

  // A tool's answers must never reach a URL (history, server logs, referrers).
  // Its "Book" button is a plain /book/ link carrying the pre-fill in data-
  // attributes; on click they move to sessionStorage, which /book/ reads once
  // and clears. If storage is blocked the patient simply picks the visit.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-prefill-tier], a[data-prefill-reason]');
    if (!a) return;
    try {
      sessionStorage.setItem('bookPrefill', JSON.stringify({ tier: a.dataset.prefillTier || '', reason: a.dataset.prefillReason || '' }));
    } catch { /* storage unavailable: the plain link still works */ }
  });

  const mole = document.querySelector('form[data-tool="mole-check"]');
  if (mole) {
    mole.addEventListener('submit', (e) => {
      e.preventDefault();
      const hit = [...mole.querySelectorAll('input[data-sign]:checked')].map((i) => i.dataset.sign);
      show('moleOut', hit.length
        ? `<h3>Worth a dermatologist’s look</h3><p>You ticked ${hit.length} sign${hit.length > 1 ? 's' : ''} (${hit.join(', ')}). This does not mean the mole is dangerous, but it should be examined.</p><p><a class="btn btn-ink" href="/book/" data-prefill-reason="mole">Book a mole check (priority slot)</a></p>`
        : `<h3>Nothing concerning today</h3><p>No ABCDE or brown-skin signs were ticked. Check monthly, and come if anything changes — a mole that is new, changing or bleeding always deserves a look.</p>`);
    });
  }

  const skin = document.querySelector('form[data-tool="skin-type"]');
  if (skin) {
    skin.addEventListener('submit', (e) => {
      e.preventDefault();
      const feel = val(skin, 'feel'), react = val(skin, 'react'), sun = val(skin, 'sun');
      const breakouts = val(skin, 'breakouts'), marks = val(skin, 'marks'), outdoor = val(skin, 'outdoor');
      if (!feel || !react || !sun || !breakouts || !marks || !outdoor) {
        show('skinOut', `<h3>Almost there</h3><p>Please answer all six questions so the guide can give you a routine.</p>`);
        return;
      }
      let type = 'combination';
      if (react === 'sting') type = 'sensitive';
      else if (feel === 'oily' || breakouts === 'often') type = 'oily';
      else if (feel === 'tight') type = 'dry';
      else if (feel === 'tzone') type = 'combination';
      else type = 'normal';

      const ROUTINE = {
        oily: ['Gel cleanser, twice a day', 'Light, oil-free moisturiser', 'Non-comedogenic sunscreen SPF 50, every morning'],
        combination: ['Gentle foaming cleanser', 'Light moisturiser on dry areas', 'Sunscreen SPF 50, every morning'],
        dry: ['Cream cleanser, no soap', 'Rich moisturiser while skin is damp', 'Sunscreen SPF 50, every morning'],
        sensitive: ['Fragrance-free gentle cleanser', 'Barrier moisturiser, minimal actives', 'Mineral or fragrance-free sunscreen SPF 50'],
        normal: ['Gentle cleanser', 'Light moisturiser', 'Sunscreen SPF 50, every morning'],
      };
      const sunText = sun === 'burn' ? 'High — you burn easily, so daily sunscreen is essential.'
        : sun === 'deep' ? 'Lower burning risk, but higher risk of dark marks after any inflammation.'
        : 'Moderate — daily sunscreen still matters, especially for pigmentation.';
      const suit = type === 'sensitive' || type === 'dry'
        ? 'Peels and laser need gentler settings and a patch test; tell your doctor you react easily.'
        : 'Most peels and lasers suit this skin, with settings chosen for South Asian skin.';

      show('skinOut', `<h3>Your skin type: ${type}</h3>
        <p><b>Sun reactivity:</b> ${sunText}</p>
        <p><b>A simple routine for Dhaka</b></p>
        <ul>${ROUTINE[type].map((s) => `<li>${s}</li>`).join('')}</ul>
        <p><b>Peels and laser:</b> ${suit}</p>
        <p class="tool-fine">For a diagnosis, book a consultation.</p>`);
    });
  }

  // — Skin check (/tools/skin-check/): conditions a description often turns
  // out to be, how soon to be seen, which visit fits. Never a diagnosis, never
  // a procedure. Answers stay on the page: book links carry only the visit
  // type, never a symptom (a URL ends up in history, logs and referrers).
  // ⚠️ The urgency wording below is clinical copy published before the
  // doctor's review (owner's choice, 2026-10-03) — see content/pages/tools.mjs.
  const sc = document.querySelector('form[data-tool="skin-check"]');
  if (sc) {
    sc.addEventListener('submit', (e) => {
      e.preventDefault();
      const ticked = (name) => [...sc.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
      const warn = ticked('warn');
      const acts = ticked('act');

      // Emergencies first, and alone: no booking, no reading list.
      if (warn.includes('airway') || warn.includes('fever')) {
        show('scOut', `<div class="sc-urgency sc-emergency"><h3>Go to the nearest emergency department now</h3>
          <p>${warn.includes('airway')
            ? 'Swelling of the lips, tongue or throat, or trouble breathing, can be a severe allergic reaction.'
            : 'Fever with a widespread rash, or blistering or peeling skin, needs hospital care the same day.'}
          Do not wait for a clinic appointment.</p></div>`);
        return;
      }

      const where = val(sc, 'where'), dur = val(sc, 'dur');
      const lookIn = sc.querySelector('input[name="look"]:checked');
      if (!where || !lookIn || !dur) {
        show('scOut', `<h3>Almost there</h3><p>Please answer where it is, what you notice most, and how long it has been there.</p>`);
        return;
      }
      const look = lookIn.value;
      const mole = look === 'mole' || warn.includes('mole-fast');
      const priv = where === 'private' || look === 'private';
      // The number lives in content/site.mjs; the build stamps it on <body>.
      const wa = document.body.dataset.wa || '/contact/';

      let urgency;
      if (warn.includes('hot')) {
        urgency = ['today', 'See a doctor today',
          `Red, hot, painful skin that spreads fast can be an infection that needs treatment the same day. If you cannot see a doctor today, go to an emergency department. You can also <a class="tlink" href="${wa}" rel="noopener">WhatsApp us</a>; we reply within 2 working hours.`];
      } else if (mole || priv || acts.includes('bleed')) {
        urgency = ['soon', 'Be seen within the next few days',
          mole ? 'A mole that is new, changing or bleeding should be examined soon. It is usually harmless, but this is the one to check rather than watch.'
            : priv ? 'Sores, bumps or discharge in the private area are best seen soon. Most causes are very treatable, and partners may need treatment too.'
            : 'Skin that bleeds or oozes should be examined soon, especially if it does not heal within two weeks.'];
      } else {
        urgency = ['routine', 'A routine visit is fine',
          'Nothing you described sounds urgent. Book when it suits you, and come sooner if it changes quickly, spreads, or stops you sleeping.'];
      }

      let visit;
      if (priv) visit = ['Private Consultation', 'A private time slot. No reason is needed when booking, and the invoice wording is discreet.'];
      else if (dur === 'long' || acts.length >= 2) visit = ['Comprehensive Assessment', '40 minutes. Long-standing or busy problems usually need baseline photographs, costed options and an included follow-up.'];
      else visit = ['Specialist Consultation', '20–25 minutes. A focused first visit: examination, dermoscopy where it helps, and a written plan.'];
      // Pre-fill rides in data- attributes → sessionStorage, never the URL.
      const book = mole ? 'data-prefill-reason="mole"' : `data-prefill-tier="${visit[0]}"`;

      const slugs = (lookIn.dataset.cond || '').split(',').filter(Boolean);
      show('scOut', `<div class="sc-urgency sc-${urgency[0]}"><h3>${urgency[1]}</h3><p>${urgency[2]}</p></div>
        ${slugs.length ? `<h3>Conditions that often look like this</h3>
        <p>People who describe this are often diagnosed with ${slugs.length > 1 ? 'one of these' : 'this'}. Only an examination can tell: several skin conditions look alike, and some need a quick test.</p>
        <div class="sc-conds" id="scConds"></div>`
        : `<h3>What to bring</h3><p>Not every skin problem fits a list. Bring a photo of it at its worst, and any creams you have tried.</p>`}
        <h3>Which visit fits</h3>
        <p><b>${visit[0]}.</b> ${visit[1]}${mole ? ' Mention the mole when you book and we will give you a priority slot.' : ''}</p>
        <p><a class="btn btn-ink" href="/book/" ${book}>${mole ? 'Book a mole check' : `Book a ${visit[0]}`}</a></p>`);
      const into = document.getElementById('scConds');
      for (const slug of slugs) {
        const tpl = document.getElementById('sc-' + slug);
        if (into && tpl) into.append(tpl.content.cloneNode(true));
      }
    });
  }

  // — /book/ booking form (Phase 2). Reuses the one-pager's /api/appointments,
  // Turnstile action 'booking' and pre-hydration disabled-button guard.
  // Errors sit under the field that caused them (aria-invalid + describedby),
  // with a one-line summary in #sbStatus that takes focus. The chamber's
  // consulting weekdays ride on its <option data-days> (stamped at build time
  // from functions/lib/schedule.js), so a closed day is refused here, before
  // the Turnstile round trip; the server still enforces every rule.
  const bk = document.getElementById('siteBookingForm');
  if (bk) {
    const SITEKEY = '0x4AAAAAAEClxf8-TRYoLcZl';
    const WA = document.body.dataset.wa || '/contact/'; // from content/site.mjs via the build
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const $ = (id) => document.getElementById(id);
    const submitBtn = $('sbSubmit');
    const status = $('sbStatus');
    const confirmBox = $('sbConfirm');
    const fields = $('sbFields');
    const chamberSel = $('sbChamber');
    const dateIn = $('sbDate');
    const hint = $('sbChamberHint');

    // Dhaka is UTC+6 all year: "today" is Dhaka's today wherever the phone is.
    const dhakaToday = () => new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
    const weekday = (d) => new Date(d + 'T00:00:00Z').getUTCDay();
    const chamberOpt = () => chamberSel.options[chamberSel.selectedIndex];
    const openDays = () => chamberOpt().dataset.days.split(',').map(Number);
    const nextOpen = (from) => {
      const days = openDays();
      let d = new Date(from + 'T00:00:00Z');
      for (let i = 0; i < 8; i++) {
        const iso = d.toISOString().slice(0, 10);
        if (days.includes(d.getUTCDay())) return iso;
        d = new Date(d.getTime() + 864e5);
      }
      return from;
    };
    const niceDate = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

    dateIn.min = dhakaToday();

    // Pre-fill. Static links use the URL (/book/?tier=… from a package view,
    // ?chamber=… from a chamber, ?reason=mole from the mole-check page's fixed
    // CTAs). A tool's answers arrive instead through sessionStorage (see the
    // tools block), read once and cleared, so they never sit in a URL. The mole
    // "priority slot" promise reaches staff through the notes.
    const q = new URLSearchParams(location.search);
    let kept = {};
    try {
      kept = JSON.parse(sessionStorage.getItem('bookPrefill') || '{}') || {};
      sessionStorage.removeItem('bookPrefill');
    } catch { kept = {}; }
    const pick = (sel, val) => { if (val && [...sel.options].some((o) => o.value === val)) sel.value = val; };
    pick($('sbTier'), kept.tier || q.get('tier'));
    pick(chamberSel, [...chamberSel.options].map((o) => o.value).find((v) => q.get('chamber') && v.toLowerCase().includes(q.get('chamber').toLowerCase())));
    if ((kept.reason || q.get('reason')) === 'mole' && !$('sbNotes').value) $('sbNotes').value = 'Mole check: please give me a priority slot.';

    const syncChamber = () => { hint.textContent = `Consults ${chamberOpt().dataset.when}. Your serial sets the exact time.`; };
    chamberSel.addEventListener('change', () => { syncChamber(); if (dateIn.value) checkDate(); });
    syncChamber();

    const setErr = (id, msg) => {
      const input = $(id);
      const out = $(id + 'Err');
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (!out) return;
      out.textContent = msg || '';
      out.hidden = !msg;
    };

    // Returns the problem with the date, or '' — also used live on change.
    function dateProblem() {
      const d = dateIn.value;
      if (!d) return 'Choose a preferred date.';
      if (d < dhakaToday()) return 'That date has passed. Choose today or a later date.';
      if (!openDays().includes(weekday(d))) {
        const next = nextOpen(d);
        return `Dr. Sumya doesn’t consult at ${chamberOpt().text.split(' (')[0]} on ${DAYS[weekday(d)]}s. The next open day is ${niceDate(next)}.`;
      }
      return '';
    }
    function checkDate() { const p = dateProblem(); setErr('sbDate', p); return p; }
    dateIn.addEventListener('change', checkDate);

    // status holds plain text, plus an optional "or WhatsApp us" escape hatch.
    const say = (msg, kind, offerWa) => {
      status.hidden = false;
      status.className = 'bk-status' + (kind ? ' ' + kind : '');
      status.textContent = msg;
      if (offerWa) {
        const a = document.createElement('a');
        a.className = 'tlink'; a.href = WA; a.rel = 'noopener'; a.textContent = 'book on WhatsApp instead';
        status.append(' Or ', a, '.');
      }
      status.focus({ preventScroll: true });
      status.scrollIntoView({ block: 'nearest' });
    };

    // Enable the submit only once a handler is attached, so a pre-hydration
    // submit cannot fall through to a native GET (same rule as the one-pager).
    if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }

    let widgetId = null;
    let turnstileFailed = false;
    const ensureTurnstile = () => new Promise((resolve, reject) => {
      if (window.turnstile) return resolve();
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('turnstile failed to load'));
      document.head.appendChild(s);
    });
    ensureTurnstile().then(() => {
      const mount = $('turnstileBooking');
      if (mount && window.turnstile && widgetId === null) {
        widgetId = window.turnstile.render(mount, { sitekey: SITEKEY, action: 'booking', theme: 'light' });
      }
    }).catch(() => { turnstileFailed = true; });

    bk.addEventListener('submit', async (e) => {
      e.preventDefault();
      confirmBox.hidden = true;
      const name = $('sbName').value.trim();
      const phone = $('sbPhone').value.trim();
      const tier = $('sbTier').value;
      const chamber = chamberSel.value;
      const date = dateIn.value;
      const notes = $('sbNotes').value.trim();
      const digits = phone.replace(/[^0-9]/g, '');

      const problems = [];
      const nameP = name ? '' : 'Enter your full name.';
      const phoneP = !phone ? 'Enter your mobile number.'
        : digits.length < 7 || digits.length > 15 ? 'Check the number: it should look like 01712345678.' : '';
      const dateP = dateProblem();
      setErr('sbName', nameP); setErr('sbPhone', phoneP); setErr('sbDate', dateP);
      if (nameP) problems.push(['sbName', 'your name']);
      if (phoneP) problems.push(['sbPhone', 'mobile number']);
      if (dateP) problems.push(['sbDate', 'preferred date']);
      if (problems.length) {
        say(`Please check ${problems.length === 1 ? 'one field' : problems.length + ' fields'}: ${problems.map((p) => p[1]).join(', ')}.`, 'err');
        $(problems[0][0]).focus();
        return;
      }

      if (turnstileFailed || !window.turnstile) {
        say('The verification check could not load, so the request can’t be sent from this page. Refresh and try again.', 'warn', true);
        return;
      }
      const token = widgetId !== null ? window.turnstile.getResponse(widgetId) : '';
      if (!token) { say('Please complete the “I’m a person” check just above the button, then send again.', 'warn'); return; }

      const label = submitBtn.textContent;
      submitBtn.disabled = true; submitBtn.setAttribute('aria-busy', 'true'); submitBtn.textContent = 'Sending your request…';
      try {
        let res;
        try {
          res = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_name: name, patient_phone: phone, chamber, appointment_date: date,
              service: tier, consultation_type: tier, preferred_session: chamberOpt().dataset.session,
              reminders: $('sbRemind').checked, notes,
              'cf-turnstile-response': token
            })
          });
        } catch {
          throw Object.assign(new Error('We couldn’t reach the booking system. Check your connection and send again.'), { wa: true });
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw Object.assign(new Error(data.error || 'We could not send your request.'), { wa: res.status >= 500 || res.status === 403 });
        if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
        fields.hidden = true;
        status.hidden = true;
        confirmBox.hidden = false;
        // Built as nodes, not innerHTML: the name and reference are echoed back.
        const h = document.createElement('h2'); h.textContent = 'Request received';
        const p1 = document.createElement('p');
        const ref = document.createElement('b'); ref.textContent = String(data.id || '');
        p1.append(`Thank you, ${name}. Your reference is `, ref, '.');
        const p2 = document.createElement('p');
        p2.textContent = `We will send your serial, time window and what to bring by SMS/WhatsApp within 2 working hours, for ${niceDate(date)} at ${chamberOpt().text.split(' (')[0]}. If you need to change anything, message the clinic with this reference.`;
        const p3 = document.createElement('p');
        const a = document.createElement('a'); a.className = 'btn btn-ink'; a.href = '/consultation-prep/'; a.textContent = 'Prepare for your visit';
        p3.append(a);
        confirmBox.replaceChildren(h, p1, p2, p3);
        confirmBox.focus({ preventScroll: true });
        confirmBox.scrollIntoView({ block: 'nearest' });
      } catch (err) {
        submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); submitBtn.textContent = label;
        if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
        say(err.message || 'We could not send your request. Please try again.', 'err', err.wa);
      }
    });
  }

  const prep = document.querySelector('form[data-tool="prep"]');
  if (prep) {
    prep.addEventListener('submit', (e) => {
      e.preventDefault();
      const duration = val(prep, 'duration'), itch = val(prep, 'itch'), products = val(prep, 'products');
      const doctors = val(prep, 'doctors'), conditions = val(prep, 'conditions'), photo = val(prep, 'photo');
      const cosmetic = val(prep, 'cosmetic');
      if (!duration || !itch || !products || !doctors || !conditions || !photo || !cosmetic) {
        show('prepOut', `<h3>Almost there</h3><p>Please answer all the questions so we can suggest the right depth of visit.</p>`);
        return;
      }
      const deep = ['long', 'chronic'].includes(duration) || products === 'many' || conditions === 'yes' || cosmetic === 'yes';
      const depth = deep
        ? ['Comprehensive Assessment (40 minutes, ৳3,500) — long-standing or cosmetic concerns usually need baseline photographs, costed options and an included follow-up.']
        : ['Specialist Consultation (20–25 minutes, ৳2,000) — a focused first visit with examination, dermoscopy and a written plan.'];
      const bring = photo === 'yes' ? 'Bring the photo of the problem at its worst — it often changes the plan.' : 'Come without oil on the hair and without nail polish if those are affected.';
      show('prepOut', `<h3>Your visit will likely include</h3>
        <p>A history, an examination with dermoscopy where it helps, and — only if it would change the treatment — tests, explained and priced before anything is done. You leave with a written plan.</p>
        <p><b>Suggested depth:</b> ${depth[0]}</p>
        <p>${bring} Bring your creams and old prescriptions too.</p>`);
    });
  }
})();
