// site.js — the multi-page shell's only script: nav dropdowns, the mobile
// drawer, the tools, and the /book/ form. CSP-safe by design (the Pages
// middleware ships no 'unsafe-inline'): zero inline handlers anywhere. Loaded
// as a module so it can import the schedule module — the build copies
// functions/lib/schedule.js to /js/schedule.mjs, so the form's date rules and
// the booking API's are the same code.
import { CHAMBERS, dhakaTodayStr, weekdayOf, closedDayRefusal } from './schedule.mjs';
import { EMERGENCY, moleDecision, skinTypeResult, skinCheckTriage, prepAdvice } from './tools.mjs';
import { estimate } from './estimator.mjs';
import { writePrefill, takePrefill } from './prefill.mjs';

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

  // — Hero journey panel: the five consultation steps as slides. Without JS
  // (or under reduced motion) the panel stays a plain five-item list. It plays
  // one pass, 3.5s a step (time to read the longest, 14 words), then rests on
  // the last step; hover, focus, the Pause button or a tap on a dot stops it.
  // Phones never auto-advance.
  const journey = document.querySelector('[data-journey]');
  const calmMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (journey && !calmMotion.matches) {
    const steps = [...journey.querySelectorAll('.jn-step')];
    const nav = document.createElement('div');
    nav.className = 'jn-nav';
    const dots = steps.map((step, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'jn-dot';
      dot.setAttribute('aria-label', `Step ${i + 1} of ${steps.length}: ${step.querySelector('b').textContent}`);
      dot.addEventListener('click', () => { halt(); show(i); });
      nav.append(dot);
      return dot;
    });
    const pause = document.createElement('button');
    pause.type = 'button';
    pause.className = 'jn-pause';
    pause.textContent = 'Pause';
    nav.append(pause);
    const list = journey.querySelector('.jn-steps');
    list.after(nav);
    journey.classList.add('jn-live');
    // A carousel only once it behaves as one: without JS or under reduced
    // motion the same group is a plain list, and must not be announced as one.
    journey.setAttribute('aria-roledescription', 'carousel');
    list.setAttribute('aria-live', 'off');
    const STEP_MS = 3500;
    let current = -1, timer = null, held = false, stopped = false;
    const phone = window.matchMedia('(max-width: 820px)');
    function show(i) {
      if (i === current) return;
      const prev = steps[current];
      if (prev) {
        prev.classList.remove('is-active');
        prev.classList.add('is-leaving');
        setTimeout(() => prev.classList.remove('is-leaving'), 760);
      }
      steps[i].classList.add('is-active');
      dots.forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      current = i;
    }
    function tick() {
      clearTimeout(timer);
      if (stopped || held || phone.matches || current >= steps.length - 1) return;
      timer = setTimeout(() => { show(current + 1); tick(); }, STEP_MS);
    }
    // Screen readers hear a step change only once the visitor drives it; the
    // automatic pass stays silent (aria-live off).
    function halt() { stopped = true; clearTimeout(timer); pause.textContent = 'Play'; list.setAttribute('aria-live', 'polite'); }
    pause.addEventListener('click', () => {
      if (stopped) {
        stopped = false; pause.textContent = 'Pause'; list.setAttribute('aria-live', 'off');
        if (current >= steps.length - 1) show(0);
        tick();
      } else halt();
    });
    journey.addEventListener('pointerenter', () => { held = true; clearTimeout(timer); });
    journey.addEventListener('pointerleave', () => { held = false; tick(); });
    journey.addEventListener('focusin', () => { held = true; clearTimeout(timer); });
    journey.addEventListener('focusout', () => { held = false; tick(); });
    // Reduced motion turned on mid-visit: stop, and fall back to the plain list.
    // One-way for the rest of the visit: turning it back off does not re-animate
    // a page the visitor already asked to keep still.
    calmMotion.addEventListener('change', () => {
      if (!calmMotion.matches) return;
      stopped = true; clearTimeout(timer);
      // The dots are about to leave the DOM; park focus on the panel, not <body>.
      const hadFocus = nav.contains(document.activeElement);
      journey.classList.remove('jn-live');
      steps.forEach((st) => st.classList.remove('is-active', 'is-leaving'));
      nav.remove();
      // The five steps appear at once; a live region would read all of them.
      // The markup carries no aria-live, so drop it back to that baseline.
      list.removeAttribute('aria-live');
      journey.removeAttribute('aria-roledescription');
      if (hadFocus) {
        journey.setAttribute('tabindex', '-1');
        journey.focus({ preventScroll: true });
        journey.addEventListener('blur', () => journey.removeAttribute('tabindex'), { once: true });
      }
    });
    stopped = phone.matches;
    if (stopped) list.setAttribute('aria-live', 'polite');
    show(0);
    setTimeout(tick, 920); // after the panel's entrance: 120ms delay + 800ms fill
  }

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
  const dhakaDay = weekdayOf(dhakaTodayStr());
  for (const ch of document.querySelectorAll('.h-ch[data-days]')) {
    if (!ch.dataset.days.split(',').map(Number).includes(dhakaDay)) continue;
    ch.classList.add('is-today');
    const flag = ch.querySelector('.h-ch-today');
    if (flag) flag.hidden = false;
  }

  // The utility bar's build-time copy is always true ("Consulting at …, with
  // each chamber's days"). On a consulting day it names today's open chambers
  // instead, from the same schedule the booking API validates. A closed day
  // keeps the static line — still true, unlike the old "Consulting now".
  const uWhen = document.querySelector('.u-when');
  if (uWhen) {
    const openToday = Object.values(CHAMBERS).filter((c) => c.days.includes(dhakaDay)).map((c) => c.short);
    if (openToday.length) uWhen.textContent = `Consulting today: ${openToday.join(' · ')}, Shyamoli`;
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
    // The arithmetic and the row copy live in estimator.mjs (node-tested);
    // this adapter only formats and writes the DOM.
    const r = estimate({
      pay: state.pay, who: state.who, item: Number(concern.value),
      per: Number(opt.dataset.per), course: Number(opt.dataset.course),
      vat: Number(document.getElementById('estimator').dataset.vat) || 0
    });
    total.textContent = taka(r.amount);
    sub.textContent = r.note;
    lines.innerHTML = r.rows.map((row) => `<div class="ln${row.total ? ' ln-total' : ''}"><span>${row.label}</span><b>${row.amount !== undefined ? taka(row.amount) : row.text}</b></div>`).join('');
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
  // attributes; on click they move to sessionStorage (public/js/prefill.mjs),
  // which /book/ reads once and clears. If storage is blocked the patient
  // simply picks the visit.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-prefill-tier], a[data-prefill-reason]');
    if (a) writePrefill(a);
  });

  // Each tool below is a thin DOM adapter: it gathers the answers, calls the
  // pure decision in tools.mjs, and renders the staged copy it returns.
  const mole = document.querySelector('form[data-tool="mole-check"]');
  if (mole) {
    mole.addEventListener('submit', (e) => {
      e.preventDefault();
      const r = moleDecision([...mole.querySelectorAll('input[data-sign]:checked')].map((i) => i.dataset.sign));
      show('moleOut', r.concerning
        ? `<h3>Worth a dermatologist’s look</h3><p>You ticked ${r.count} sign${r.count > 1 ? 's' : ''} (${r.signs.join(', ')}). This does not mean the mole is dangerous, but it should be examined.</p><p><a class="btn btn-ink" href="/book/" data-prefill-reason="mole">Book a mole check (priority slot)</a></p>`
        : `<h3>Nothing concerning today</h3><p>No ABCDE or brown-skin signs were ticked. Check monthly, and come if anything changes — a mole that is new, changing or bleeding always deserves a look.</p>`);
    });
  }

  const skin = document.querySelector('form[data-tool="skin-type"]');
  if (skin) {
    skin.addEventListener('submit', (e) => {
      e.preventDefault();
      const r = skinTypeResult({
        feel: val(skin, 'feel'), react: val(skin, 'react'), sun: val(skin, 'sun'),
        breakouts: val(skin, 'breakouts'), marks: val(skin, 'marks'), outdoor: val(skin, 'outdoor')
      });
      if (r.stage === 'incomplete') {
        show('skinOut', `<h3>Almost there</h3><p>Please answer all six questions so the guide can give you a routine.</p>`);
        return;
      }
      show('skinOut', `<h3>Your skin type: ${r.type}</h3>
        <p><b>Sun reactivity:</b> ${r.sunNote}</p>
        <p><b>A simple routine for Dhaka</b></p>
        <ul>${r.routine.map((s) => `<li>${s}</li>`).join('')}</ul>
        <p><b>Peels and laser:</b> ${r.peelNote}</p>
        <p class="tool-fine">For a diagnosis, book a consultation.</p>`);
    });
  }

  // — Skin check (/tools/skin-check/): conditions a description often turns
  // out to be, how soon to be seen, which visit fits. Never a diagnosis, never
  // a procedure. The triage ladder lives in tools.mjs (node-tested); answers
  // stay on the page — book links carry only the visit type, never a symptom
  // (a URL ends up in history, logs and referrers).
  const sc = document.querySelector('form[data-tool="skin-check"]');
  if (sc) {
    sc.addEventListener('submit', (e) => {
      e.preventDefault();
      const ticked = (name) => [...sc.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
      const lookIn = sc.querySelector('input[name="look"]:checked');
      const t = skinCheckTriage({
        where: val(sc, 'where'), look: lookIn ? lookIn.value : '', dur: val(sc, 'dur'),
        acts: ticked('act'), warn: ticked('warn')
      });

      // Emergencies first, and alone: no booking, no reading list. The hidden
      // h2 keeps the heading outline intact under the page h1 (results render
      // h3 panels and h4 condition names).
      if (t.stage === 'emergency') {
        show('scOut', `<h2 class="vh">Your skin check result</h2><div class="sc-urgency sc-emergency"><h3>${EMERGENCY.heading}</h3><p>${EMERGENCY[t.emergency]} ${EMERGENCY.tail}</p></div>`);
        return;
      }
      if (t.stage === 'incomplete') {
        show('scOut', `<h2 class="vh">Your skin check result</h2><h3>Almost there</h3><p>Please answer where it is, what you notice most, and how long it has been there.</p>`);
        return;
      }

      // The WhatsApp number lives in content/site.mjs; the build stamps it on
      // <body>. The decision says when to offer it; only the adapter can link it.
      const wa = document.body.dataset.wa || '/contact/';
      const body = t.urgency.body + (t.urgency.offerWa
        ? ` You can also <a class="tlink" href="${wa}" rel="noopener">WhatsApp us</a>; we reply within 2 working hours.` : '');
      // Condition cards are build-time <template>s keyed by the look answer's
      // data-cond slugs (content/pages/tools.mjs).
      const slugs = (lookIn.dataset.cond || '').split(',').filter(Boolean);
      show('scOut', `<h2 class="vh">Your skin check result</h2><div class="sc-urgency sc-${t.urgency.key}"><h3>${t.urgency.heading}</h3><p>${body}</p></div>
        ${slugs.length ? `<h3>Conditions that often look like this</h3>
        <p>People who describe this are often diagnosed with ${slugs.length > 1 ? 'one of these' : 'this'}. Only an examination can tell: several skin conditions look alike, and some need a quick test.</p>
        <div class="sc-conds" id="scConds"></div>`
          : `<h3>What to bring</h3><p>Not every skin problem fits a list. Bring a photo of it at its worst, and any creams you have tried.</p>`}
        <h3>Which visit fits</h3>
        <p><b>${t.visit.name}.</b> ${t.visit.blurb}${t.mole ? ' Mention the mole when you book and we will give you a priority slot.' : ''}</p>
        <p><a class="btn btn-ink" href="/book/" ${t.mole ? 'data-prefill-reason="mole"' : `data-prefill-tier="${t.visit.name}"`}>${t.mole ? 'Book a mole check' : `Book a ${t.visit.name}`}</a></p>`);
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
    const $ = (id) => document.getElementById(id);
    const submitBtn = $('sbSubmit');
    const status = $('sbStatus');
    const confirmBox = $('sbConfirm');
    const fields = $('sbFields');
    const chamberSel = $('sbChamber');
    const dateIn = $('sbDate');
    const hint = $('sbChamberHint');

    // The date rules — Dhaka "today", weekdays, next open day, the refusal
    // wording — come from the schedule module, the same interface the booking
    // API validates with. The consulting weekdays are also stamped on each
    // <option data-days> at build time; the module is the rule, the stamp is
    // the no-JS fallback.
    const chamberOpt = () => chamberSel.options[chamberSel.selectedIndex];
    const openDays = () => CHAMBERS[chamberSel.value]?.days ?? [];
    const niceDate = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

    dateIn.min = dhakaTodayStr();

    // Pre-fill via the one protocol (public/js/prefill.mjs): a tool's answers
    // arrive through sessionStorage, read once and cleared here; static links
    // use ?tier= / ?chamber= / ?reason=mole URL params. The mole "priority
    // slot" promise reaches staff through the notes.
    const pf = takePrefill(new URLSearchParams(location.search));
    const pick = (sel, val) => { if (val && [...sel.options].some((o) => o.value === val)) sel.value = val; };
    pick($('sbTier'), pf.tier);
    pick(chamberSel, [...chamberSel.options].map((o) => o.value).find((v) => pf.chamber && v.toLowerCase().includes(pf.chamber.toLowerCase())));
    if (pf.reason === 'mole' && !$('sbNotes').value) $('sbNotes').value = 'Mole check: please give me a priority slot.';

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
    // The refusal text is the module's, so the field error and a server 400
    // can no longer disagree (they once did, down to the doctor's name).
    function dateProblem() {
      const d = dateIn.value;
      if (!d) return 'Choose a preferred date.';
      if (d < dhakaTodayStr()) return 'That date has passed. Choose today or a later date.';
      if (!openDays().includes(weekdayOf(d))) return closedDayRefusal(chamberSel.value, d, niceDate);
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
      const r = prepAdvice({
        duration: val(prep, 'duration'), itch: val(prep, 'itch'), products: val(prep, 'products'),
        doctors: val(prep, 'doctors'), conditions: val(prep, 'conditions'), photo: val(prep, 'photo'),
        cosmetic: val(prep, 'cosmetic')
      });
      if (r.stage === 'incomplete') {
        show('prepOut', `<h3>Almost there</h3><p>Please answer all the questions so we can suggest the right depth of visit.</p>`);
        return;
      }
      show('prepOut', `<h3>Your visit will likely include</h3>
        <p>A history, an examination with dermoscopy where it helps, and — only if it would change the treatment — tests, explained and priced before anything is done. You leave with a written plan.</p>
        <p><b>Suggested depth:</b> ${r.depth}</p>
        <p>${r.bring} Bring your creams and old prescriptions too.</p>`);
    });
  }
})();
