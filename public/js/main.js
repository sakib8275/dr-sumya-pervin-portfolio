async function api(method, url, body) {
  const opts = { method, headers: {} };
  const token = localStorage.getItem('cms_token');
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body && !(body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body) {
    opts.body = body;
  }
  const res = await fetch(url, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    // A non-JSON body means the API isn't there at all — a static host that can't
    // run Functions, or an outage. Don't let that surface as a JSON parse error.
    throw new Error(`Server returned ${res.status} and no JSON. Is the API deployed?`);
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function getToken() { return localStorage.getItem('cms_token'); }
function setToken(t) { if (t) localStorage.setItem('cms_token', t); else localStorage.removeItem('cms_token'); }

const DEFAULT_GALLERY = [];
let cmsConfig = { whatsapp: '', telegram: '' };
let galleryItems = [];
let activeFilter = 'all';

// The public route, deliberately: the authenticated /api/config 401s for ordinary
// visitors, which left the booking form building a wa.me link with no number.
async function loadCMSConfig() {
  try {
    cmsConfig = await api('GET', '/api/config/public');
    return true;
  } catch (e) {
    console.error('Could not load contact configuration:', e);
    cmsConfig = { whatsapp: '', telegram: '' };
    return false;
  }
}

async function loadSiteContent() {
  try {
    const data = await api('GET', '/api/content');
    if (!data) return;
    document.querySelectorAll('[data-content]').forEach(el => {
      const key = el.dataset.content;
      if (data[key] !== undefined && data[key] !== null) {
        if (key === 'hero.tagline' || key === 'about.intro' || key === 'band.text') {
          if (window.RichText && typeof window.RichText.renderLightRich === 'function') {
            el.innerHTML = window.RichText.renderLightRich(data[key]);
          } else {
            el.textContent = data[key];
          }
        } else {
          el.textContent = data[key];
        }
      }
    });

    document.querySelectorAll('#siteContentForm [data-key]').forEach(input => {
      const key = input.dataset.key;
      if (data[key] !== undefined && data[key] !== null) {
        input.value = data[key];
      }
    });
  } catch (e) {
    console.error('Could not load site content:', e);
  }
}

async function loadGallery() {
  try {
    galleryItems = await api('GET', '/api/gallery');
  } catch (e) {
    galleryItems = [];
  }
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const filtered = activeFilter === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeFilter);

  if (filtered.length === 0) {
    // This is what every visitor to the live site sees today -- the gallery
    // table is empty in production -- so it has to read as a note to a patient,
    // not as an instruction to the doctor. It used to say "Use the Doctor CMS
    // Admin Panel to add new photos."
    const message = activeFilter === 'all'
      ? 'Clinical photographs are being prepared and will be published here soon.'
      : 'No photographs in this category yet. Try another category, or view all.';
    grid.innerHTML = `<p class="gallery-empty">${escapeHTML(message)}</p>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <article class="gallery-card" data-r>
      <div class="gallery-img-wrap">
        <img src="${escapeHTML(item.image_path)}" alt="${escapeHTML(item.title)}" loading="lazy">
        <span class="gallery-badge">${escapeHTML(capitalize(item.category))}</span>
      </div>
      <div class="gallery-body">
        <h4>${escapeHTML(item.title)}</h4>
        <p>${escapeHTML(item.caption)}</p>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('#galleryGrid [data-r]').forEach(el => {
    el.classList.add('in');
  });
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// RFC 4180 quoting, plus formula-injection neutralisation.
//
// Everything in the appointments export except the id, the date and the status
// is unauthenticated patient input, and the file's reader is the doctor opening
// it in Excel or Google Sheets. The old export concatenated '"' + value + '"',
// which left two holes and created a third:
//
//   1. An embedded " was not doubled, so one quotation mark in a note ended the
//      field early and shifted every column after it in that row.
//   2. A value beginning =, +, - or @ is evaluated as a FORMULA on open. That is
//      remote code execution against the doctor's spreadsheet, reachable by
//      anyone who can book an appointment.
//   3. (Fixed at the call site.) The document was passed through encodeURI(),
//      which does not escape '#'.
//
// The dangerous prefix is escaped with a leading apostrophe rather than
// stripped: the doctor still needs to read exactly what the patient typed.
function escapeHTML(str) {
  return str ? str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  ) : '';
}

// Keyed by the EXACT <h4> text of each .svc card in index.html -- that string is
// what openServiceModalFromCard() looks up. The previous keys ('PRP &
// Microneedling Therapy', 'Acne & Scar Management', ...) were a different naming
// scheme entirely and matched ZERO card headings, so every one of the eight
// service modals silently took the fallback branch and showed the same generic
// "30-45 mins / Minimal / General skin phototypes". Fifty lines of clinical copy
// rendered nowhere. Same defect class as F-UX-2, where the quiz recommended
// service names that were not <option> values of #serviceType.
//
// tests/services.test.mjs asserts the two lists match in BOTH directions, so
// neither a renamed card nor an orphaned entry can reintroduce this silently.
//
// ⚠️ duration / recovery / suitability are practice facts, not copy: they are
// present only where the practice has actually supplied them. Four services
// below carry `desc` alone, and the modal renders only the cells that exist
// rather than inventing a plausible number -- an invented recovery time on a
// physician's site is the same class of claim as the "1,500+ procedures
// annually" stat removed on 2026-08-02. See STATUS.md for the owner action.
const SERVICES_DATA = {
  'Skin Health Coaching': {
    desc: "A consultation-led assessment of your skin's current condition, barrier health and daily routine, ending in a written home-care plan: cleansers, actives, sun protection and the order to use them in. No procedure is performed \u2014 this is the groundwork that makes later treatment safer and more predictable."
  },
  'Facial & Neck Mesotherapy': {
    desc: 'Micro-injections of essential vitamins, antioxidants and non-crosslinked hyaluronic acid for intense dermal hydration and renewed radiance across the face and neck.',
    duration: '45 mins',
    recovery: 'Zero to 1 day',
    suitability: 'Dry skin, dull phototypes, early aging'
  },
  'Chemical Peels': {
    desc: 'Dermatological peels formulated with glycolic, salicylic, or TCA acids to shed hyperpigmented epidermal layers, revealing smooth, radiant skin underneath.',
    duration: '30 mins',
    recovery: 'Light flaking for 3-5 days',
    suitability: 'Melasma, sun damage, uneven texture'
  },
  'Microneedling with Serums': {
    desc: 'Controlled micro-channeling that triggers collagen synthesis while active serum blends are delivered into the skin, refining texture, softening acne scarring and minimising enlarged pores.',
    duration: '45\u201360 mins',
    recovery: 'Mild redness for 24-48 hours',
    suitability: 'Acne scarring, fine lines, enlarged pores'
  },
  'LED Therapy': {
    desc: 'Non-ablative light phototherapy that calms active facial inflammation, reduces vascular redness, and stimulates cellular repair.',
    duration: '30 mins',
    recovery: 'Zero downtime',
    suitability: 'Rosacea, active acne, sensitive skin'
  },
  'Sensitive Skin Care Treatments': {
    desc: 'A low-irritation protocol for reactive skin: calming the inflammatory response, repairing a compromised moisture barrier and restoring hydration, with actives reintroduced only once the skin tolerates them.'
  },
  'Carboxytherapy': {
    desc: 'Controlled micro-infusion of medical carbon dioxide beneath the skin to improve local circulation and oxygen delivery, used for skin tightening, brightening and collagen stimulation.'
  },
  'Eye Area Care': {
    desc: 'Targeted treatment of the thin periorbital skin for dark circles, puffiness and fine lines, chosen after the cause is identified \u2014 pigmentation, vascular shadowing, volume loss and fluid retention each respond to a different approach.'
  }
};

// The nav number and the floating WhatsApp button used to carry a hardcoded
// placeholder (+880 1700-000000), so both were live links to nobody. They now come
// from the CMS and stay hidden until a real number is configured.
function renderContactChannels() {
  const digits = (cmsConfig.whatsapp || '').replace(/[^0-9]/g, '');

  const fab = document.getElementById('fabWhatsapp');
  if (fab) {
    if (digits) fab.href = 'https://wa.me/' + digits;
    fab.hidden = !digits;
  }

  const tel = document.getElementById('navTel');
  if (tel) {
    tel.textContent = digits ? '+' + digits : '';
    tel.hidden = !digits;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Gate the CSS hidden-start state for [data-r] reveals (see html.reveal in
  // style.css): content is only hidden once JS is demonstrably running, so a
  // dead main.js leaves the page readable rather than blank (F-UX-7).
  //
  // The gate and the observer that releases it must stay adjacent, and both
  // must stay above every await in this handler. [data-r] covers the hero h1,
  // its tagline and both CTA buttons, so any await between these two statements
  // is a blank hero for the length of that await. They were previously
  // separated by three serial D1-backed fetches -- the F-UX-7 blank page again,
  // for the slow case rather than the dead case. The loaders now run at the
  // bottom of this handler; keep them there.
  document.documentElement.classList.add('reveal');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('[data-r]').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
    io.observe(el);
  });

  const navWrapper = document.querySelector('.nav-sticky-wrapper');
  const fabTop = document.getElementById('fabTop');
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  // Two scroll toggles, rAF-coalesced. The handler itself only reads scrollY,
  // but it used to also run the scrollspy below, which read offsetTop and
  // offsetHeight for every section on every single scroll event -- a forced
  // synchronous layout per section per event, on a page with fourteen of them.
  let scrollQueued = false;
  const applyScrollState = () => {
    scrollQueued = false;
    const scrollY = window.scrollY;
    if (navWrapper) navWrapper.classList.toggle('scrolled', scrollY > 40);
    if (fabTop) fabTop.classList.toggle('visible', scrollY > 400);
  };
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(applyScrollState);
  }, { passive: true });
  applyScrollState();

  // Scrollspy, moved onto the observer the browser already maintains. The
  // rootMargin makes the "current" band the strip just below the sticky nav, so
  // exactly one section qualifies at a time and a tall section stays current for
  // its whole length -- the behaviour the offsetTop arithmetic was reaching for.
  const spied = [...sections].filter((sec) =>
    [...navLinks].some((link) => link.getAttribute('href') === '#' + sec.getAttribute('id'))
  );
  if (spied.length) {
    const spy = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => link.classList.toggle('on', link.getAttribute('href') === '#' + id));
      }
    }, { rootMargin: '-120px 0px -75% 0px', threshold: 0 });
    spied.forEach((sec) => spy.observe(sec));
  }

  if (fabTop) {
    fabTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const grid = document.getElementById('svcGrid');
  const tog = document.getElementById('svcToggle');
  if (tog && grid) {
    tog.addEventListener('click', () => {
      const open = tog.getAttribute('aria-expanded') === 'true';
      grid.querySelectorAll('.svc').forEach((c, i) => {
        if (i > 3) c.classList.toggle('hide', open);
      });
      tog.setAttribute('aria-expanded', String(!open));
      // Matches the label the button ships with in the markup ('Show more'),
      // which the previous 'Show more services' silently renamed on first use.
      tog.textContent = open ? 'Show more' : 'Show less';
    });
  }

  const serviceModal = document.getElementById('serviceModal');
  const closeServiceBtn = document.getElementById('closeService');
  const serviceTitle = document.getElementById('serviceModalTitle');
  const serviceDesc = document.getElementById('serviceModalDesc');
  const serviceDuration = document.getElementById('serviceModalDuration');
  const serviceRecovery = document.getElementById('serviceModalRecovery');
  const serviceSuitability = document.getElementById('serviceModalSuitability');
  const serviceMeta = document.getElementById('serviceModalMeta');
  const bookThisServiceBtn = document.getElementById('bookThisServiceBtn');

  function openServiceModalFromCard(svcCard) {
    const titleText = svcCard.querySelector('h4').textContent.trim();
    // Falls back to the card's own visible description, never to invented
    // clinical figures. The old fallback supplied '30-45 mins / Minimal /
    // General skin phototypes' and -- because no key matched -- served it for
    // every service on the site.
    const data = SERVICES_DATA[titleText] || { desc: svcCard.querySelector('p').textContent.trim() };
    if (serviceTitle) serviceTitle.textContent = titleText;
    if (serviceDesc) serviceDesc.textContent = data.desc;

    // Each fact renders only when the practice has actually supplied it; the
    // block disappears entirely when none are known.
    let known = 0;
    for (const [key, el] of [
      ['duration', serviceDuration],
      ['recovery', serviceRecovery],
      ['suitability', serviceSuitability]
    ]) {
      const has = typeof data[key] === 'string' && data[key].length > 0;
      if (el && has) el.textContent = data[key];
      const cell = el && el.closest('[data-meta-cell]');
      if (cell) cell.hidden = !has;
      if (has) known++;
    }
    if (serviceMeta) serviceMeta.hidden = known === 0;
    if (bookThisServiceBtn) {
      bookThisServiceBtn.onclick = () => {
        if (serviceModal) serviceModal.classList.remove('active');
        const bm = document.getElementById('bookingModal');
        const ss = document.getElementById('serviceType');
        if (ss) ss.value = titleText;
        if (bm) bm.classList.add('active');
      };
    }
    if (serviceModal) serviceModal.classList.add('active');
  }

  if (grid) {
    // Each card's title is a real <button> whose ::after covers the card, so a
    // click anywhere still lands here and Enter/Space are handled natively. The
    // keydown branch that used to simulate that is gone: with a real button it
    // fired a second time on Enter and its preventDefault() fought the button's
    // own activation on Space.
    grid.addEventListener('click', (e) => {
      const svcCard = e.target.closest('.svc');
      if (svcCard) openServiceModalFromCard(svcCard);
    });
  }

  if (closeServiceBtn && serviceModal) {
    closeServiceBtn.addEventListener('click', () => serviceModal.classList.remove('active'));
  }

  let selectedGoal = '';
  let selectedType = '';
  const goalBtns = document.querySelectorAll('.quiz-goal-btn');
  const typeBtns = document.querySelectorAll('.quiz-type-btn');
  const quizResultBox = document.getElementById('quizResultBox');
  const quizRecText = document.getElementById('quizRecText');
  const bookQuizRecBtn = document.getElementById('bookQuizRecBtn');

  // .selected was a purely visual state: nothing in the accessibility tree said
  // which option a patient had chosen, so the quiz was unusable without sight of
  // the colour change.
  function selectOne(group, chosen) {
    group.forEach(b => {
      const isChosen = b === chosen;
      b.classList.toggle('selected', isChosen);
      b.setAttribute('aria-pressed', String(isChosen));
    });
  }

  goalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectOne(goalBtns, btn);
      selectedGoal = btn.dataset.goal;
      evaluateQuiz();
    });
  });

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectOne(typeBtns, btn);
      selectedType = btn.dataset.type;
      evaluateQuiz();
    });
  });

  function evaluateQuiz() {
    if (selectedGoal && selectedType) {
      // These strings MUST be exact <option> values of #serviceType: "Book
      // Recommended Procedure" assigns rec straight into the select. The old
      // values ('PRP & Microneedling Therapy' etc.) matched SERVICES_DATA, not
      // the select, so the select silently went blank and the server rejected
      // every quiz-driven booking (service is a required field). Map to the
      // closest bookable service instead -- 'Hair Loss & Scalp Treatments' had
      // no equivalent at all, so it was added to the select on 2026-08-04.
      let rec = 'Microneedling with Serums';
      if (selectedGoal === 'pigmentation') rec = 'Chemical Peels';
      if (selectedGoal === 'hair') rec = 'Hair Loss & Scalp Treatments';
      if (selectedGoal === 'aging') rec = 'Facial & Neck Mesotherapy';

      // A4: the old sentence read "Based on your selection (<goal> & <type>),
      // Dr. Sumya Pervin recommends ..." while rec branches on selectedGoal
      // alone -- it named a clinical input that had no bearing on the answer.
      // On a physician's site that is a content-accuracy problem, not a wording
      // one. The skin type is now described as what it actually is: context
      // carried into the consultation, where the plan is decided.
      if (quizRecText) {
        quizRecText.innerHTML =
          `For <em>${escapeHTML(capitalize(selectedGoal))}</em>, a common starting point is ` +
          `<strong>${escapeHTML(rec)}</strong>. ` +
          `<span class="quiz-caveat">You have told us your skin is <em>${escapeHTML(capitalize(selectedType))}</em> \u2014 ` +
          `Dr. Pervin will take that into account and confirm the right treatment at your consultation.</span>`;
      }
      if (quizResultBox) quizResultBox.style.display = 'block';

      if (bookQuizRecBtn) {
        bookQuizRecBtn.onclick = () => {
          const bookingModal = document.getElementById('bookingModal');
          const serviceSelect = document.getElementById('serviceType');
          if (serviceSelect) serviceSelect.value = rec;
          if (bookingModal) bookingModal.classList.add('active');
        };
      }
    }
  }

  const baContainer = document.querySelector('.ba-container');
  const baAfter = document.querySelector('.ba-after');
  const baHandle = document.querySelector('.ba-slider-handle');

  if (baContainer && baAfter && baHandle) {
    let isDragging = false;

    // Single writer for the slider position, so the pointer, touch and keyboard
    // paths cannot drift -- and so the announced value is updated in all three.
    // role="slider" with a static aria-valuenow is worse than no role at all: it
    // promises a value and then lies about it.
    const setBaPosition = (pos) => {
      const clamped = Math.min(100, Math.max(0, pos));
      baAfter.style.width = clamped + '%';
      baHandle.style.left = clamped + '%';
      const rounded = Math.round(clamped);
      baContainer.setAttribute('aria-valuenow', String(rounded));
      baContainer.setAttribute('aria-valuetext', rounded + '% after treatment');
    };

    const moveSlider = (x) => {
      const rect = baContainer.getBoundingClientRect();
      setBaPosition(((x - rect.left) / rect.width) * 100);
    };

    baHandle.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
      if (isDragging) moveSlider(e.clientX);
    });

    baHandle.addEventListener('touchstart', () => isDragging = true);
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches[0]) moveSlider(e.touches[0].clientX);
    });

    baContainer.addEventListener('keydown', (e) => {
      const current = parseFloat(baAfter.style.width) || 50;
      // preventDefault so the arrows drive the slider rather than scrolling the
      // page out from under it, and Home/End because a slider is expected to
      // have them.
      if (e.key === 'ArrowLeft') { e.preventDefault(); setBaPosition(current - 10); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setBaPosition(current + 10); }
      else if (e.key === 'Home') { e.preventDefault(); setBaPosition(0); }
      else if (e.key === 'End') { e.preventDefault(); setBaPosition(100); }
    });
  }

  const filterContainer = document.getElementById('galleryFilters');
  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
          const isActive = btn === e.target;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-pressed', String(isActive));
        });
        activeFilter = e.target.dataset.filter;
        renderGallery();
      }
    });
  }

  // An accordion whose only open/closed signal is a CSS class and a glyph tells
  // a screen reader nothing. Both controls in a row point at the same answer, so
  // both carry the state.
  function setFaqExpanded(row, expanded) {
    row.classList.toggle('open', expanded);
    const send = row.querySelector('.faq-send');
    if (send) send.textContent = expanded ? '\u2715' : '\u27a4';
    row.querySelectorAll('.faq-btn, .faq-send').forEach(b => b.setAttribute('aria-expanded', String(expanded)));
  }

  document.querySelectorAll('.faq-row').forEach(row => {
    const open = () => {
      const was = row.classList.contains('open');
      document.querySelectorAll('.faq-row').forEach(r => setFaqExpanded(r, false));
      if (!was) setFaqExpanded(row, true);
    };
    const btn = row.querySelector('.faq-btn');
    const send = row.querySelector('.faq-send');
    if (btn) btn.addEventListener('click', open);
    if (send) send.addEventListener('click', open);
  });

  const steps = [
    ['Step 1', 'Clinical Consultation', 'Comprehensive history taking and skin phototype evaluation before any aesthetic procedure.'],
    ['Step 2', 'Professional Analysis', 'Advanced visual skin diagnostic mapping for hydration, elasticity, acne scarring, and pigmentation.'],
    ['Step 3', 'Tailored Protocol', 'Evidence-based dermatology protocol (Dermatosurgery, PRP, Chemical Peels, or Lasers) tailored for Dr. Pervin\'s patients.'],
    ['Step 4', 'Follow-Up & Homecare', 'Written prescription for customized homecare routine and a 6-week review to track progress.']
  ];
  const stepTxt = document.querySelector('.step-txt b');
  const stepDesc = document.getElementById('stepDesc');
  const stepThumb = document.getElementById('stepThumb');
  // The 400px variants, matching what #stepThumb ships with in the markup. The
  // thumbnail renders at 78px; pointing these at the 1024px originals made
  // clicking a step dot pull a full-size image for a 78px box.
  const stepThumbsList = [
    'assets/clinic-400.jpg',
    'assets/treatment-400.jpg',
    'assets/clinic-400.jpg',
    'assets/treatment-400.jpg'
  ];

  document.querySelectorAll('#stepDots button').forEach((b, i) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#stepDots button').forEach(x => {
        const isCurrent = x === b;
        x.classList.toggle('on', isCurrent);
        x.setAttribute('aria-current', String(isCurrent));
      });
      if (stepTxt) stepTxt.innerHTML = '<em>' + steps[i][0] + '</em>' + steps[i][1];
      if (stepDesc) stepDesc.textContent = steps[i][2];
      if (stepThumb) stepThumb.src = stepThumbsList[i];
    });
  });

  const quotes = [
    {
      quote: '"I suffered from severe acne scarring and melasma for years. After consulting Assistant Professor Dr. Sumya Pervin, her PRP and peel protocol completely transformed my skin texture."',
      name: 'Tanzina A., Dhaka'
    },
    {
      quote: '"Dr. Sumya Pervin is extremely meticulous and compassionate. She explained the dermatological science clearly without pushing unnecessary procedures. Highly recommended!"',
      name: 'Farhana K., Shyamoli'
    },
    {
      quote: '"The consultation at Alliance Hospital was top-notch. First time a specialist thoroughly examined my skin under magnification and gave me a clear action plan."',
      name: 'Sabbir R., Dhanmondi'
    }
  ];
  let qi = 0;
  const q = document.getElementById('tstQuote');
  const author = document.getElementById('tstAuthor');
  const faces = document.querySelectorAll('.tst-faces button');

  const setQ = (n) => {
    qi = (n + quotes.length) % quotes.length;
    if (q) q.textContent = quotes[qi].quote;
    if (author) author.textContent = quotes[qi].name;
    faces.forEach((f, i) => {
      f.classList.toggle('on', i === qi);
      f.setAttribute('aria-pressed', String(i === qi));
    });
  };

  faces.forEach((face, i) => {
    face.addEventListener('click', () => setQ(i));
  });

  const prevBtn = document.getElementById('tstPrev');
  const nextBtn = document.getElementById('tstNext');
  if (prevBtn) prevBtn.addEventListener('click', () => setQ(qi - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => setQ(qi + 1));

  const burger = document.getElementById('burger');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeDrawer = document.getElementById('closeDrawer');
  if (burger && mobileDrawer) {
    burger.addEventListener('click', () => mobileDrawer.classList.add('active'));
    // The drawer is a dialog like the modals are, so the same observer below
    // moves focus into it, locks body scroll and restores focus on close. Only
    // the burger's own expanded state has to be mirrored here.
    new MutationObserver(() => {
      burger.setAttribute('aria-expanded', String(mobileDrawer.classList.contains('active')));
    }).observe(mobileDrawer, { attributes: true, attributeFilter: ['class'] });
  }
  if (closeDrawer && mobileDrawer) {
    closeDrawer.addEventListener('click', () => mobileDrawer.classList.remove('active'));
  }

  // Each anchor in the drawer carried an inline onclick that closed it. Delegated
  // here instead, for the CSP. Anchors only: the drawer's two buttons open a modal
  // over the drawer and deliberately leave it open, as they always did.
  const drawerLinks = mobileDrawer && mobileDrawer.querySelector('.mobile-drawer-links');
  if (drawerLinks) {
    drawerLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) mobileDrawer.classList.remove('active');
    });
  }

  const bookingModal = document.getElementById('bookingModal');
  const openBookingBtns = document.querySelectorAll('.open-booking');
  const closeBookingBtn = document.getElementById('closeBooking');
  const bookingForm = document.getElementById('bookingForm');
  const bookingStatus = document.getElementById('bookingStatus');
  const bookingHeader = bookingModal ? bookingModal.querySelector('.modal-header') : null;

  openBookingBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const chamberVal = btn.dataset.chamber;
      if (chamberVal) {
        const chamberSelect = document.getElementById('chamberSelect');
        if (chamberSelect) chamberSelect.value = chamberVal;
      }
      if (bookingModal) {
        // Every open starts from the fresh state: form and header visible, any
        // previous status message gone. After a successful booking the success
        // path hides the form and header (see the submit handler below), so this
        // restore is what makes a second booking possible at all.
        restoreBookingFormState();
        bookingStatus.style.display = 'none';
        bookingStatus.innerHTML = '';
        bookingForm.style.display = '';
        if (bookingHeader) bookingHeader.style.display = '';
        bookingModal.classList.add('active');
      }
    });
  });

  if (closeBookingBtn && bookingModal) {
    closeBookingBtn.addEventListener('click', () => {
      sessionStorage.removeItem('booking_form_state');
      bookingModal.classList.remove('active');
    });
  }

  function saveBookingFormState() {
    const state = {
      name: document.getElementById('patientName').value,
      phone: document.getElementById('patientPhone').value,
      chamber: document.getElementById('chamberSelect').value,
      date: document.getElementById('appointmentDate').value,
      service: document.getElementById('serviceType').value,
      notes: document.getElementById('patientMessage').value
    };
    sessionStorage.setItem('booking_form_state', JSON.stringify(state));
  }

  function restoreBookingFormState() {
    const saved = sessionStorage.getItem('booking_form_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (document.getElementById('patientName')) document.getElementById('patientName').value = state.name || '';
        if (document.getElementById('patientPhone')) document.getElementById('patientPhone').value = state.phone || '';
        if (document.getElementById('chamberSelect')) document.getElementById('chamberSelect').value = state.chamber || '';
        if (document.getElementById('appointmentDate')) document.getElementById('appointmentDate').value = state.date || '';
        if (document.getElementById('serviceType')) document.getElementById('serviceType').value = state.service || '';
        if (document.getElementById('patientMessage')) document.getElementById('patientMessage').value = state.notes || '';
      } catch(e) {}
    }
  }

  // The message is tied to the field it belongs to, not just placed next to it:
  // a red border and some nearby text say nothing to a screen reader, which
  // announces the input and then moves on. aria-describedby makes the message
  // part of the field, and aria-invalid puts the error in the accessibility tree
  // rather than only in the colour.
  function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    const existing = el.parentElement.querySelector('.field-error');
    if (existing) existing.remove();
    const err = document.createElement('span');
    err.className = 'field-error';
    err.id = id + 'Error';
    err.setAttribute('role', 'alert');
    err.style.cssText = 'color:#DC3545;font-size:12px;margin-top:4px;display:block;';
    err.textContent = msg;
    el.parentElement.appendChild(err);
    el.setAttribute('aria-describedby', err.id);
    el.setAttribute('aria-invalid', 'true');
    el.style.borderColor = '#DC3545';
  }

  function clearFieldError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const existing = el.parentElement.querySelector('.field-error');
    if (existing) existing.remove();
    el.removeAttribute('aria-describedby');
    el.removeAttribute('aria-invalid');
    el.style.borderColor = '';
  }

  function validatePhone(v) {
    return /^[\d\+\s\-\(\)]{7,20}$/.test(v.replace(/[^0-9]/g, ''));
  }

  const nameInput = document.getElementById('patientName');
  const phoneInput = document.getElementById('patientPhone');
  const dateInput = document.getElementById('appointmentDate');

  if (phoneInput) {
    phoneInput.addEventListener('blur', () => {
      const v = phoneInput.value.trim();
      if (v && !validatePhone(v)) {
        showFieldError('patientPhone', 'Please enter a valid mobile number with country code');
      } else {
        clearFieldError('patientPhone');
      }
    });
    phoneInput.addEventListener('input', () => clearFieldError('patientPhone'));
  }

  if (nameInput) {
    nameInput.addEventListener('blur', () => {
      const v = nameInput.value.trim();
      if (v && v.length < 2) {
        showFieldError('patientName', 'Name must be at least 2 characters');
      } else {
        clearFieldError('patientName');
      }
    });
    nameInput.addEventListener('input', () => clearFieldError('patientName'));
  }

  // Mirrored from CHAMBERS in functions/lib/schedule.js, which stays the single
  // source of truth -- tests/schedule-mirror.test.mjs fails if these drift apart.
  // A native <input type="date"> cannot grey out individual weekdays, so the
  // closed days are caught the moment the patient picks one instead of after a
  // submit that comes back 400. This is the most likely booking failure in normal
  // use: both chambers close on Friday and DCIMCH also closes on Thursday.
  const CHAMBER_DAYS = {
    'Alliance Hospital Limited (Shyamoli)': [6, 0, 1, 2, 3, 4],
    'Dhaka Central International Medical College (DCIMCH)': [6, 0, 1, 2, 3]
  };
  const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // UTC arithmetic on a bare YYYY-MM-DD, matching weekdayOf() on the server. A
  // local-time Date would land on the previous day for anyone west of UTC.
  function weekdayOfDateStr(dateStr) {
    return new Date(dateStr + 'T00:00:00Z').getUTCDay();
  }

  function checkChamberDay() {
    const chamberEl = document.getElementById('chamberSelect');
    if (!dateInput || !chamberEl || !dateInput.value) return true;
    const days = CHAMBER_DAYS[chamberEl.value];
    if (!days) return true;

    const dow = weekdayOfDateStr(dateInput.value);
    if (days.includes(dow)) {
      clearFieldError('appointmentDate');
      return true;
    }

    let suggestion = '';
    for (let i = 1; i <= 7; i++) {
      const probe = new Date(dateInput.value + 'T00:00:00Z');
      probe.setUTCDate(probe.getUTCDate() + i);
      if (days.includes(probe.getUTCDay())) {
        suggestion = ' The next day it consults is ' +
          WEEKDAY_NAMES[probe.getUTCDay()] + ' ' + probe.toISOString().slice(0, 10) + '.';
        break;
      }
    }
    showFieldError('appointmentDate',
      'This chamber does not consult on ' + WEEKDAY_NAMES[dow] + 's.' + suggestion);
    return false;
  }

  const chamberSelectEl = document.getElementById('chamberSelect');
  if (chamberSelectEl) chamberSelectEl.addEventListener('change', checkChamberDay);
  if (dateInput) dateInput.addEventListener('change', checkChamberDay);

  if (dateInput) {
    // Stop the picker offering past dates. Patients are in Dhaka, so local time
    // is the right frame; the real gate is server-side validateSlot (schedule,
    // weekday, and the 30-minute same-day cutoff), which also covers non-Dhaka
    // clocks and requests that never touch this form.
    const localNow = new Date();
    dateInput.min = localNow.getFullYear() + '-' +
      String(localNow.getMonth() + 1).padStart(2, '0') + '-' +
      String(localNow.getDate()).padStart(2, '0');
    dateInput.addEventListener('blur', () => {
      const v = dateInput.value;
      if (v) {
        const d = new Date(v + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        if (d < today) {
          showFieldError('appointmentDate', 'Date cannot be in the past');
        } else {
          // Defer to the chamber check rather than clearing unconditionally: a
          // valid-but-closed Friday would otherwise lose its message here.
          checkChamberDay();
        }
      }
    });
  }

  let bookingSubmitting = false;

  if (bookingForm) {
    ['patientName','patientPhone','chamberSelect','appointmentDate','serviceType','patientMessage'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', saveBookingFormState);
    });

    // The markup ships this button disabled. Enable it here, immediately before the
    // submit listener is attached -- both statements are synchronous, so no click can
    // interleave. "Enabled" therefore means "a submit will really be handled," which
    // is what stops a pre-hydration submit from silently doing a native GET.
    const bookingSubmitBtn = bookingForm.querySelector('button[type="submit"]');
    if (bookingSubmitBtn) {
      bookingSubmitBtn.disabled = false;
      bookingSubmitBtn.removeAttribute('aria-busy');
    }

    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (bookingSubmitting) return;
      bookingSubmitting = true;

      const submitBtn = bookingForm.querySelector('button[type="submit"]');

      if (!checkChamberDay()) {
        bookingSubmitting = false;
        const badDate = document.getElementById('appointmentDate');
        if (badDate) badDate.focus();
        return;
      }

      // The button used to only go disabled, which on a slow connection reads as
      // a dead button: the patient waits through a Turnstile check and a POST
      // with nothing moving. aria-busy so the wait is announced, not just drawn.
      const submitLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = 'Sending your request\u2026';
      }
      const restoreSubmitBtn = () => {
        if (!submitBtn) return;
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.textContent = submitLabel;
      };

      const name = document.getElementById('patientName').value;
      const phone = document.getElementById('patientPhone').value;
      const chamber = document.getElementById('chamberSelect').value;
      const date = document.getElementById('appointmentDate').value;
      const service = document.getElementById('serviceType').value;
      const notes = document.getElementById('patientMessage').value;

      let bookingId = '';
      let saveError = null;

      const tsToken = turnstileToken('booking');
      if (!tsToken) {
        restoreSubmitBtn();
        bookingSubmitting = false;
        // An alert() blocks the page and is the one place a patient met one.
        bookingStatus.style.display = 'block';
        bookingStatus.innerHTML =
          '<div style="background: #FFF3CD; color: #856404; padding: 14px; border-radius: 12px; margin-bottom: 16px; font-size: 14px;">' +
          'Please complete the verification check below, then confirm again.</div>';
        bookingStatus.scrollIntoView({ block: 'nearest' });
        return;
      }

      try {
        const data = await api('POST', '/api/appointments', {
          patient_name: name,
          patient_phone: phone,
          chamber,
          appointment_date: date,
          service,
          notes,
          'cf-turnstile-response': tsToken
        });
        bookingId = data.id;
      } catch (err) {
        // Previously this invented a reference number and the UI went on to claim
        // the booking was saved. Telling a patient their appointment exists when it
        // does not is worse than showing them the failure.
        saveError = err;
        console.error('Appointment could not be saved:', err);
      } finally {
        turnstileReset('booking');
      }

      if (bookingId) sessionStorage.setItem('lastBookingRef', bookingId);

      const waMsg = encodeURIComponent(
        '\uD83D\uDCCB *New Appointment Request - Dr. Sumya Pervin, MD*\n\n' +
        '\uD83D\uDC64 *Patient:* ' + name + '\n' +
        '\uD83D\uDCDE *Mobile:* ' + phone + '\n' +
        '\uD83C\uDFE5 *Chamber:* ' + chamber + '\n' +
        '\uD83D\uDCC5 *Date:* ' + date + '\n' +
        '\uD83D\uDC89 *Service:* ' + service + '\n\n' +
        'Sent via Dr. Sumya Pervin Website'
      );

      // cmsConfig is loaded once at page start. This used to re-fetch it
      // unconditionally, putting a full round-trip between a successful POST and
      // the patient seeing their confirmation. The guard covers the only case
      // that needed it: a submit that beat the initial load.
      if (!cmsConfig.whatsapp) await loadCMSConfig();
      const waNumber = (cmsConfig.whatsapp || '').replace(/[^0-9]/g, '');
      const waUrl = waNumber ? 'https://wa.me/' + waNumber + '?text=' + waMsg : '';

      // Telegram used to be an unconditional link to t.me/share/url — the generic
      // share sheet, which opens the PATIENT's Telegram to pick any recipient and
      // never reaches the doctor at all. It is now the same shape as the WhatsApp
      // link: a direct chat with the configured account, or nothing. t.me/<user>
      // cannot carry prefilled text, so it is labelled as a chat, not a forward.
      const tgHandle = (cmsConfig.telegram || '').trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//i, '');
      const tgUrl = /^[A-Za-z0-9_]{5,32}$/.test(tgHandle) ? 'https://t.me/' + tgHandle : '';

      const forwardButtons = (waUrl || tgUrl) ? `
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
            ${waUrl ? `<a href="${escapeHTML(waUrl)}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm" style="flex:1;">
              \uD83D\uDCAC Send these details on WhatsApp
            </a>` : ''}
            ${tgUrl ? `<a href="${escapeHTML(tgUrl)}" target="_blank" rel="noopener" class="btn btn-telegram btn-sm" style="flex:1;">
              \u2708\uFE0F Message Dr. Pervin on Telegram
            </a>` : ''}
          </div>` : '';

      bookingStatus.style.display = 'block';

      if (saveError) {
        bookingStatus.innerHTML = `
        <div style="background: #F8D7DA; color: #721C24; padding: 18px; border-radius: 14px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 6px; font-weight: 600;">\u26A0\uFE0F We could not save your request</h4>
          <p style="margin: 0 0 12px; font-size: 14px;">Sorry <strong>${escapeHTML(name)}</strong> \u2014 your appointment was <strong>not</strong> recorded, so please do not travel to the chamber on this request alone.</p>
          ${saveError && saveError.message ? `<p style="margin: 0 0 12px; font-size: 13px;"><strong>Reason:</strong> ${escapeHTML(saveError.message)}</p>` : ''}
          <p style="margin: 0 0 12px; font-size: 13px; background: #FFF3CD; color: #856404; padding: 10px; border-radius: 8px;"><strong>\uD83D\uDCCD Please send your details directly instead.</strong> Use the button below, or call the chamber. Your details are still filled in above.</p>
          ${forwardButtons || '<p style="margin: 0; font-size: 13px;">Please call the chamber directly to arrange your appointment.</p>'}
        </div>
      `;
        // Keep the form populated so the patient doesn't retype everything.
        bookingSubmitting = false;
        restoreSubmitBtn();
        return;
      }

      bookingStatus.innerHTML = `
        <div style="background: #D4EDDA; color: #155724; padding: 18px; border-radius: 14px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 6px; font-weight: 600;">\uD83D\uDCCB Appointment Request Submitted</h4>
          <p style="margin: 0 0 12px; font-size: 14px;">Thank you <strong>${escapeHTML(name)}</strong>. Your request is recorded and Dr. Pervin's chamber will contact you to confirm your slot.</p>
          ${forwardButtons ? `<p style="margin: 0 0 12px; font-size: 13px;">Nothing further is needed. If you would like to add anything \u2014 a photograph, or a question before your visit \u2014 you can message the chamber directly:</p>
          ${forwardButtons}` : ''}
          <p style="margin: 8px 0 0; font-size: 12px; color: #155724;">Reference: <strong>${escapeHTML(bookingId)}</strong></p>
        </div>
      `;

      // Success replaces the modal's contents with the confirmation. Previously
      // the (now-reset) form stayed visible below the message, so the patient
      // saw a full blank form under "Appointment Request Submitted" -- and on a
      // small screen the message itself could sit above the scroll position of
      // someone who had just reached the submit button. The failure branch above
      // deliberately keeps the form visible and populated; the open handler
      // restores both for the next booking.
      bookingForm.style.display = 'none';
      if (bookingHeader) bookingHeader.style.display = 'none';

      bookingForm.reset();
      sessionStorage.removeItem('booking_form_state');
      bookingSubmitting = false;
      restoreSubmitBtn();
      bookingStatus.scrollIntoView({ block: 'nearest' });
    });
  }

  // Turnstile bootstrap. api.js is loaded async in <head>, so it may become ready
  // before or after this file runs; polling for it avoids depending on that order,
  // which an onload= callback would. Widget ids are retained because tokens are
  // single-use: this page survives a failed attempt, so every retry needs a reset.
  const turnstileIds = { login: null, booking: null, forgot: null, reset: null };

  (function renderTurnstile() {
    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      setTimeout(renderTurnstile, 50);
      return;
    }
    const mount = (elId, key, action) => {
      const el = document.getElementById(elId);
      if (!el || turnstileIds[key] !== null) return;
      turnstileIds[key] = window.turnstile.render(el, {
        sitekey: '0x4AAAAAAEClxf8-TRYoLcZl',
        action
      });
    };
    mount('turnstileLogin', 'login', 'login');
    mount('turnstileBooking', 'booking', 'booking');
    mount('turnstileForgot', 'forgot', 'forgot-password');
    mount('turnstileReset', 'reset', 'reset-password');
  })();

  function turnstileToken(key) {
    if (!window.turnstile || turnstileIds[key] === null) return '';
    return window.turnstile.getResponse(turnstileIds[key]) || '';
  }

  function turnstileReset(key) {
    if (window.turnstile && turnstileIds[key] !== null) window.turnstile.reset(turnstileIds[key]);
  }

  // ---- CMS bootstrap ------------------------------------------------------
  // js/cms.js holds the whole admin panel. It is fetched on demand rather than
  // shipped to every patient; 'self' in script-src covers a same-origin src, so
  // no nonce is involved.
  let cmsLoader = null;
  function loadCMS() {
    if (!cmsLoader) {
      cmsLoader = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'js/cms.js';
        s.onload = () => (window.initCMS ? resolve() : reject(new Error('cms.js loaded but exported nothing')));
        s.onerror = () => { cmsLoader = null; reject(new Error('cms.js failed to load')); };
        document.head.appendChild(s);
      }).then(() => window.initCMS({
        api, getToken, setToken,
        loadCMSConfig, loadGallery, loadSiteContent, renderGallery,
        escapeHTML, capitalize,
        turnstileToken, turnstileReset,
        // Live accessors, not copies. renderGallery() here and renderCMSItemList()
        // there read the same array, and deleting a photo in the panel writes to
        // it -- a snapshot handed over at init would go stale on the next reload
        // and strand that write on the wrong side of the seam.
        get cmsConfig() { return cmsConfig; },
        get galleryItems() { return galleryItems; },
        set galleryItems(v) { galleryItems = v; }
      }));
    }
    return cmsLoader;
  }

  document.querySelectorAll('.cms-btn-trigger, .open-cms').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      // Opened here, before the fetch, so the click is acknowledged immediately
      // on a slow connection. The markup and the PIN form are already in the
      // document; cms.js only makes them work.
      const cmsModal = document.getElementById('cmsModal');
      if (cmsModal) cmsModal.classList.add('active');
      try {
        const cms = await loadCMS();
        await cms.open();
      } catch {
        const pinError = document.getElementById('pinError');
        if (pinError) {
          pinError.style.display = 'block';
          pinError.textContent = 'The admin panel could not be loaded. Check your connection and try again.';
        }
      }
    });
  });

  // The reset link mailed to the doctor lands on a cold page with no click to
  // trigger the load, so the deep link has to pull cms.js in by itself. cms.js
  // reads the hash at init and listens for later changes from then on.
  const isResetHash = () => (window.location.hash || '').startsWith('#reset?token=');
  if (isResetHash()) loadCMS();
  window.addEventListener('hashchange', () => { if (isResetHash()) loadCMS(); });

  // Data loading runs LAST, and concurrently. Every listener above is already
  // attached and the reveal observer is already running, so a slow API now
  // delays only the content it actually owns -- not the hero, and not the
  // patient's ability to open the booking modal. These three fetches are
  // independent of each other; they used to run in series, three round-trips
  // deep, ahead of every listener on the page.
  await Promise.all([
    (async () => { await loadGallery(); renderGallery(); })(),
    (async () => { await loadCMSConfig(); renderContactChannels(); })(),
    loadSiteContent()
  ]);

  if (getToken()) {
    try {
      const check = await api('GET', '/api/auth/check');
      if (!check.authenticated) setToken(null);
    } catch {
      setToken(null);
    }
  }
});

// ---- Dialog accessibility -------------------------------------------------
// Everything that opens over the page: the five .modal-overlay dialogs and the
// mobile drawer. The drawer was previously a plain div with no dialog role, no
// Escape and no focus handling; it behaves like the modals, so it is treated
// like one.
const DIALOG_SELECTOR = '.modal-overlay, .mobile-drawer';
const DIALOG_CLOSE_SELECTOR = '.modal-close, [data-dialog-close]';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// checkVisibility, not offsetParent: offsetParent only reports display:none (how
// the CMS panel swaps its auth and main sections), and is happily non-null for a
// visibility:hidden subtree -- which is how a closed dialog is hidden. Both have
// to be excluded, or the trap cycles through controls nobody can see and the
// landing focus() targets one of them and silently does nothing.
// visibilityProperty only -- deliberately NOT opacityProperty. It would be the
// stricter flag but the wrong one twice over: a dialog is opacity:0 for the first
// frame of its fade-in, which would empty this list at exactly the moment the
// observer needs it, and opacity:0 does not remove anything from the tab order
// anyway, which is the bug this whole change exists to fix. display:none is
// excluded by checkVisibility's default.
function dialogFocusables(root) {
  return [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter((el) =>
    el.checkVisibility ? el.checkVisibility({ visibilityProperty: true }) : el.offsetParent !== null
  );
}

// Escape closes the open dialog (via its close button, so any registered cleanup
// runs), and Tab cycles inside it. One document-level listener covers every
// dialog, present and future.
document.addEventListener('keydown', (e) => {
  const open = document.querySelector('.modal-overlay.active, .mobile-drawer.active');
  if (!open) return;

  if (e.key === 'Escape') {
    const closeBtn = open.querySelector(DIALOG_CLOSE_SELECTOR);
    if (closeBtn) closeBtn.click();
    else open.classList.remove('active');
    return;
  }

  if (e.key !== 'Tab') return;
  const focusables = dialogFocusables(open);
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && (document.activeElement === first || !open.contains(document.activeElement))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (document.activeElement === last || !open.contains(document.activeElement))) {
    e.preventDefault();
    first.focus();
  }
});

// Focus-in on open, focus-restore on close, body scroll lock while any dialog is
// up. Driven by a MutationObserver on the .active class rather than added to the
// dozen-odd places that add or remove it, so a new opener cannot forget it.
//
// Without this, opening a dialog left focus on the trigger *behind* the overlay:
// the Tab trap above only engages once focus is already inside, so a keyboard or
// screen-reader user was tabbing through the page underneath the thing they had
// just opened. On close, focus fell to <body> and the next Tab restarted from the
// top of the document.
const dialogOpener = new WeakMap();

const dialogObserver = new MutationObserver((records) => {
  for (const record of records) {
    const dialog = record.target;
    const isOpen = dialog.classList.contains('active');
    const wasOpen = (record.oldValue || '').split(/\s+/).includes('active');
    if (isOpen === wasOpen) continue;

    if (isOpen) {
      const opener = document.activeElement;
      if (opener && opener !== document.body && !dialog.contains(opener)) dialogOpener.set(dialog, opener);
      document.body.classList.add('modal-open');
      // Synchronous, not deferred to a frame. checkVisibility() forces the style
      // recalc this needs, so the frame bought nothing -- and it opened a window
      // in which someone who started typing immediately had their focus yanked
      // back to the first field mid-keystroke, dropping the rest of what they
      // typed into the wrong input.
      const targets = dialogFocusables(dialog);
      // The close button comes first in the DOM but is the least useful place to
      // land, so prefer the first real control and fall back to it.
      const landing = targets.find((el) => !el.matches(DIALOG_CLOSE_SELECTOR)) || targets[0];
      // And never move focus that is already inside the dialog: by the time this
      // runs the opener may have put it somewhere deliberately.
      if (landing && !dialog.contains(document.activeElement)) landing.focus();
    } else {
      // Only the last dialog to close releases the scroll lock: the CMS and
      // booking modals can both be open over the drawer.
      if (!document.querySelector('.modal-overlay.active, .mobile-drawer.active')) {
        document.body.classList.remove('modal-open');
      }
      const opener = dialogOpener.get(dialog);
      dialogOpener.delete(dialog);
      // Returning focus to where it came from is what makes Escape a
      // non-destructive action for a keyboard user.
      if (opener && document.contains(opener) && opener.offsetParent !== null) opener.focus();
    }
  }
});

document.querySelectorAll(DIALOG_SELECTOR).forEach((dialog) => {
  dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
});
