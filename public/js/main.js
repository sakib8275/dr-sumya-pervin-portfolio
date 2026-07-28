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
let appointmentsList = [];
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

async function loadAppointments() {
  try {
    appointmentsList = await api('GET', '/api/appointments');
  } catch (e) {
    appointmentsList = [];
  }
  renderCMSAppointmentsList();
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
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--grey);">No photos found in this category. Use the Doctor CMS Admin Panel to add new photos.</div>`;
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

function escapeHTML(str) {
  return str ? str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  ) : '';
}

const SERVICES_DATA = {
  'PRP & Microneedling Therapy': {
    desc: "Platelet-rich plasma (PRP) combines your body's growth factors with micro-channeling to trigger intense collagen synthesis, smooth deep acne scarring, and stimulate dormant hair follicles.",
    duration: '45\u201360 mins',
    recovery: 'Mild redness for 24-48 hours',
    suitability: 'Acne scarring, fine lines, hair thinning'
  },
  'Acne & Scar Management': {
    desc: 'A medical-grade protocol targeting active acne lesions, sebum regulation, and post-inflammatory hyperpigmentation through prescription therapeutics and scar subcision.',
    duration: '30\u201345 mins',
    recovery: 'No downtime to 1 day',
    suitability: 'Acne vulgaris, hormonal breakouts, dark spots'
  },
  'Chemical Peels & Resurfacing': {
    desc: 'Dermatological peels formulated with glycolic, salicylic, or TCA acids to shed hyperpigmented epidermal layers, revealing smooth, radiant skin underneath.',
    duration: '30 mins',
    recovery: 'Light flaking for 3-5 days',
    suitability: 'Melasma, sun damage, uneven texture'
  },
  'Dermatosurgery & Skin Lesions': {
    desc: 'Precision minor dermatological surgical removal of skin tags, seborrheic keratosis, moles, and benign cysts under local anesthesia with minimal scarring.',
    duration: '30\u201360 mins',
    recovery: '3-7 days minor healing',
    suitability: 'Skin tags, moles, diagnostic biopsy'
  },
  'LED Light & Laser Therapy': {
    desc: 'Non-ablative light phototherapy that calms active facial inflammation, reduces vascular redness, and stimulates cellular repair.',
    duration: '30 mins',
    recovery: 'Zero downtime',
    suitability: 'Rosacea, active acne, sensitive skin'
  },
  'Hair Loss & Scalp Treatments': {
    desc: 'Comprehensive trichological evaluation, scalp mesotherapy, and PRP hair growth stimulation for androgenetic alopecia and telogen effluvium.',
    duration: '45 mins',
    recovery: 'Zero downtime',
    suitability: 'Hair thinning, scalp dandruff, hair loss'
  },
  'Eczema & Psoriasis Management': {
    desc: 'Long-term clinical disease control for chronic inflammatory skin conditions utilizing topical immunomodulators, phototherapy, and barrier repair.',
    duration: '30 mins',
    recovery: 'N/A',
    suitability: 'Chronic eczema, psoriasis plaques, dermatitis'
  },
  'Facial Rejuvenation & Hydration': {
    desc: 'Micro-injections of essential vitamins, antioxidants, and non-crosslinked hyaluronic acid for intense dermal hydration and youthful radiance.',
    duration: '45 mins',
    recovery: 'Zero to 1 day',
    suitability: 'Dry skin, dull phototypes, early aging'
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
  await loadGallery();
  renderGallery();

  await loadCMSConfig();
  renderContactChannels();

  if (getToken()) {
    try {
      const check = await api('GET', '/api/auth/check');
      if (!check.authenticated) setToken(null);
    } catch {
      setToken(null);
    }
  }

  const navWrapper = document.querySelector('.nav-sticky-wrapper');
  const fabTop = document.getElementById('fabTop');
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (navWrapper) {
      if (scrollY > 40) navWrapper.classList.add('scrolled');
      else navWrapper.classList.remove('scrolled');
    }

    if (fabTop) {
      if (scrollY > 400) fabTop.classList.add('visible');
      else fabTop.classList.remove('visible');
    }

    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('on');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('on');
          }
        });
      }
    });
  });

  if (fabTop) {
    fabTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

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

  const grid = document.getElementById('svcGrid');
  const tog = document.getElementById('svcToggle');
  if (tog && grid) {
    tog.addEventListener('click', () => {
      const open = tog.getAttribute('aria-expanded') === 'true';
      grid.querySelectorAll('.svc').forEach((c, i) => {
        if (i > 3) c.classList.toggle('hide', open);
      });
      tog.setAttribute('aria-expanded', String(!open));
      tog.textContent = open ? 'Show more services' : 'Show less';
    });
  }

  const serviceModal = document.getElementById('serviceModal');
  const closeServiceBtn = document.getElementById('closeService');
  const serviceTitle = document.getElementById('serviceModalTitle');
  const serviceDesc = document.getElementById('serviceModalDesc');
  const serviceDuration = document.getElementById('serviceModalDuration');
  const serviceRecovery = document.getElementById('serviceModalRecovery');
  const serviceSuitability = document.getElementById('serviceModalSuitability');
  const bookThisServiceBtn = document.getElementById('bookThisServiceBtn');

  function openServiceModalFromCard(svcCard) {
    const titleText = svcCard.querySelector('h4').textContent.trim();
    const data = SERVICES_DATA[titleText] || {
      desc: svcCard.querySelector('p').textContent.trim(),
      duration: '30\u201345 mins',
      recovery: 'Minimal',
      suitability: 'General skin phototypes'
    };
    if (serviceTitle) serviceTitle.textContent = titleText;
    if (serviceDesc) serviceDesc.textContent = data.desc;
    if (serviceDuration) serviceDuration.textContent = data.duration;
    if (serviceRecovery) serviceRecovery.textContent = data.recovery;
    if (serviceSuitability) serviceSuitability.textContent = data.suitability;
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
    grid.addEventListener('click', (e) => {
      const svcCard = e.target.closest('.svc');
      if (svcCard) openServiceModalFromCard(svcCard);
    });
    grid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const svcCard = e.target.closest('.svc');
        if (svcCard) {
          e.preventDefault();
          openServiceModalFromCard(svcCard);
        }
      }
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

  goalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      goalBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedGoal = btn.dataset.goal;
      evaluateQuiz();
    });
  });

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedType = btn.dataset.type;
      evaluateQuiz();
    });
  });

  function evaluateQuiz() {
    if (selectedGoal && selectedType) {
      let rec = 'PRP & Microneedling Therapy';
      if (selectedGoal === 'pigmentation') rec = 'Chemical Peels & Resurfacing';
      if (selectedGoal === 'hair') rec = 'Hair Loss & Scalp Treatments';
      if (selectedGoal === 'aging') rec = 'Facial Rejuvenation & Hydration';

      if (quizRecText) {
        quizRecText.innerHTML = `Based on your selection (<em>${capitalize(selectedGoal)}</em> &amp; <em>${capitalize(selectedType)} Skin</em>), Dr. Sumya Pervin recommends: <strong>${rec}</strong>`;
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
    const moveSlider = (x) => {
      const rect = baContainer.getBoundingClientRect();
      let pos = ((x - rect.left) / rect.width) * 100;
      if (pos < 0) pos = 0;
      if (pos > 100) pos = 100;
      baAfter.style.width = pos + '%';
      baHandle.style.left = pos + '%';
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
      if (e.key === 'ArrowLeft') {
        const rect = baContainer.getBoundingClientRect();
        const current = parseFloat(baAfter.style.width) || 50;
        const next = Math.max(0, current - 10);
        baAfter.style.width = next + '%';
        baHandle.style.left = next + '%';
      } else if (e.key === 'ArrowRight') {
        const current = parseFloat(baAfter.style.width) || 50;
        const next = Math.min(100, current + 10);
        baAfter.style.width = next + '%';
        baHandle.style.left = next + '%';
      }
    });
  }

  const filterContainer = document.getElementById('galleryFilters');
  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        filterContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        activeFilter = e.target.dataset.filter;
        renderGallery();
      }
    });
  }

  document.querySelectorAll('.faq-row').forEach(row => {
    const open = () => {
      const was = row.classList.contains('open');
      document.querySelectorAll('.faq-row').forEach(r => {
        r.classList.remove('open');
        r.querySelector('.faq-send').textContent = '\u27a4';
      });
      if (!was) {
        row.classList.add('open');
        row.querySelector('.faq-send').textContent = '\u2715';
      }
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
  const stepThumbsList = [
    'assets/hero_portrait.jpg',
    'assets/clinic.jpg',
    'assets/treatment.jpg',
    'assets/hero_portrait.jpg'
  ];

  document.querySelectorAll('#stepDots button').forEach((b, i) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#stepDots button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
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
  const faces = document.querySelectorAll('.tst-faces img');

  const setQ = (n) => {
    qi = (n + quotes.length) % quotes.length;
    if (q) q.textContent = quotes[qi].quote;
    if (author) author.textContent = quotes[qi].name;
    faces.forEach((f, i) => f.classList.toggle('on', i === qi));
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
  }
  if (closeDrawer && mobileDrawer) {
    closeDrawer.addEventListener('click', () => mobileDrawer.classList.remove('active'));
  }

  const bookingModal = document.getElementById('bookingModal');
  const openBookingBtns = document.querySelectorAll('.open-booking');
  const closeBookingBtn = document.getElementById('closeBooking');
  const bookingForm = document.getElementById('bookingForm');
  const bookingStatus = document.getElementById('bookingStatus');

  openBookingBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const chamberVal = btn.dataset.chamber;
      if (chamberVal) {
        const chamberSelect = document.getElementById('chamberSelect');
        if (chamberSelect) chamberSelect.value = chamberVal;
      }
      if (bookingModal) {
        restoreBookingFormState();
        bookingStatus.style.display = 'none';
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

  function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    const existing = el.parentElement.querySelector('.field-error');
    if (existing) existing.remove();
    const err = document.createElement('span');
    err.className = 'field-error';
    err.style.cssText = 'color:#DC3545;font-size:12px;margin-top:4px;display:block;';
    err.textContent = msg;
    el.parentElement.appendChild(err);
    el.style.borderColor = '#DC3545';
  }

  function clearFieldError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const existing = el.parentElement.querySelector('.field-error');
    if (existing) existing.remove();
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

  if (dateInput) {
    dateInput.addEventListener('blur', () => {
      const v = dateInput.value;
      if (v) {
        const d = new Date(v + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        if (d < today) {
          showFieldError('appointmentDate', 'Date cannot be in the past');
        } else {
          clearFieldError('appointmentDate');
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

    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (bookingSubmitting) return;
      bookingSubmitting = true;

      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const name = document.getElementById('patientName').value;
      const phone = document.getElementById('patientPhone').value;
      const chamber = document.getElementById('chamberSelect').value;
      const date = document.getElementById('appointmentDate').value;
      const service = document.getElementById('serviceType').value;
      const notes = document.getElementById('patientMessage').value;

      let bookingId = '';
      let saveError = null;

      try {
        const data = await api('POST', '/api/appointments', {
          patient_name: name,
          patient_phone: phone,
          chamber,
          appointment_date: date,
          service,
          notes
        });
        bookingId = data.id;
      } catch (err) {
        // Previously this invented a reference number and the UI went on to claim
        // the booking was saved. Telling a patient their appointment exists when it
        // does not is worse than showing them the failure.
        saveError = err;
        console.error('Appointment could not be saved:', err);
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

      await loadCMSConfig();
      const waNumber = (cmsConfig.whatsapp || '').replace(/[^0-9]/g, '');
      const waUrl = waNumber ? 'https://wa.me/' + waNumber + '?text=' + waMsg : '';
      const tgUrl = 'https://t.me/share/url?url=' + encodeURIComponent(window.location.href) + '&text=' + waMsg;

      const forwardButtons = `
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
            ${waUrl ? `<a href="${escapeHTML(waUrl)}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm" style="flex:1;">
              \uD83D\uDCAC Send via WhatsApp to Dr. Pervin
            </a>` : ''}
            <a href="${escapeHTML(tgUrl)}" target="_blank" rel="noopener" class="btn btn-telegram btn-sm" style="flex:1;">
              \u2708\uFE0F Send via Telegram
            </a>
          </div>`;

      bookingStatus.style.display = 'block';

      if (saveError) {
        bookingStatus.innerHTML = `
        <div style="background: #F8D7DA; color: #721C24; padding: 18px; border-radius: 14px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 6px; font-weight: 600;">\u26A0\uFE0F We could not save your request</h4>
          <p style="margin: 0 0 12px; font-size: 14px;">Sorry <strong>${escapeHTML(name)}</strong> \u2014 your appointment was <strong>not</strong> recorded, so please do not travel to the chamber on this request alone.</p>
          <p style="margin: 0 0 12px; font-size: 13px; background: #FFF3CD; color: #856404; padding: 10px; border-radius: 8px;"><strong>\uD83D\uDCCD Please send your details directly instead.</strong> Use the button below, or call the chamber. Your details are still filled in above.</p>
          ${forwardButtons}
        </div>
      `;
        // Keep the form populated so the patient doesn't retype everything.
        bookingSubmitting = false;
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      bookingStatus.innerHTML = `
        <div style="background: #D4EDDA; color: #155724; padding: 18px; border-radius: 14px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 6px; font-weight: 600;">\uD83D\uDCCB Appointment Request Submitted</h4>
          <p style="margin: 0 0 12px; font-size: 14px;">Thank you <strong>${escapeHTML(name)}</strong>. Your appointment request has been saved on the server.</p>
          <p style="margin: 0 0 12px; font-size: 13px; background: #FFF3CD; color: #856404; padding: 10px; border-radius: 8px;"><strong>\uD83D\uDCCD Send to confirm:</strong> To ensure Dr. Pervin receives your request promptly, please forward your details via WhatsApp or Telegram below.</p>
          ${forwardButtons}
          <p style="margin: 8px 0 0; font-size: 12px; color: #155724;">Reference: <strong>${escapeHTML(bookingId)}</strong></p>
        </div>
      `;

      bookingForm.reset();
      sessionStorage.removeItem('booking_form_state');
      bookingSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  const cmsModal = document.getElementById('cmsModal');
  const cmsAuthSection = document.getElementById('cmsAuthSection');
  const cmsMainSection = document.getElementById('cmsMainSection');
  const cmsPinInput = document.getElementById('cmsPinInput');
  const submitPinBtn = document.getElementById('submitPin');
  const pinError = document.getElementById('pinError');
  const closeCMSBtn = document.getElementById('closeCMS');

  const openCMSBtns = document.querySelectorAll('.cms-btn-trigger, .open-cms');
  openCMSBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (cmsModal) cmsModal.classList.add('active');
      if (getToken()) {
        try {
          const check = await api('GET', '/api/auth/check');
          if (check.authenticated) {
            cmsAuthSection.style.display = 'none';
            cmsMainSection.style.display = 'block';
            await Promise.all([
              loadAppointments(),
              loadGallery(),
              loadCMSConfig()
            ]);
            renderCMSItemList();
            loadCMSConfigForm();
          }
        } catch {
          setToken(null);
        }
      }
    });
  });

  if (closeCMSBtn && cmsModal) {
    closeCMSBtn.addEventListener('click', () => cmsModal.classList.remove('active'));
  }

  async function attemptCMSLogin() {
    if (!cmsPinInput) return;
    const pin = cmsPinInput.value.trim();
    try {
      const data = await api('POST', '/api/auth/login', { pin });
      setToken(data.token);
      cmsAuthSection.style.display = 'none';
      cmsMainSection.style.display = 'block';
      if (pinError) pinError.style.display = 'none';
      pinError.textContent = '';
      await Promise.all([
        loadAppointments(),
        loadGallery(),
        loadCMSConfig()
      ]);
      renderCMSItemList();
      loadCMSConfigForm();
    } catch (err) {
      if (pinError) {
        pinError.style.display = 'block';
        pinError.textContent = 'Incorrect PIN. Contact the site administrator.';
      }
    }
  }

  if (submitPinBtn) {
    submitPinBtn.addEventListener('click', attemptCMSLogin);
  }

  if (cmsPinInput) {
    cmsPinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        attemptCMSLogin();
      }
    });
  }

  document.querySelectorAll('.cms-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cms-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetTab = btn.dataset.tab;

      document.querySelectorAll('.cms-tab-content').forEach(content => {
        content.style.display = content.id === targetTab ? 'block' : 'none';
      });
    });
  });

  const photoFileInput = document.getElementById('photoFileInput');
  const uploadZone = document.getElementById('uploadZone');
  const uploadForm = document.getElementById('uploadForm');
  const previewImg = document.getElementById('uploadPreview');
  let currentBase64Image = '';

  if (uploadZone && photoFileInput) {
    uploadZone.addEventListener('click', () => photoFileInput.click());

    photoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          currentBase64Image = event.target.result;
          if (previewImg) {
            previewImg.src = currentBase64Image;
            previewImg.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('photoTitle').value;
      const category = document.getElementById('photoCategory').value;
      const caption = document.getElementById('photoCaption').value;
      const fileInput = document.getElementById('photoFileInput');
      const file = fileInput ? fileInput.files[0] : null;

      let imagePath = '';

      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        try {
          const uploadData = await api('POST', '/api/gallery/upload', fd);
          imagePath = uploadData.image_path;
        } catch (err) {
          imagePath = 'assets/clinic.jpg';
        }
      } else {
        imagePath = 'assets/clinic.jpg';
      }

      try {
        await api('POST', '/api/gallery', { title, category, caption, image_path: imagePath });
      } catch (err) {
        alert('Failed to save: ' + err.message);
        return;
      }

      uploadForm.reset();
      currentBase64Image = '';
      if (previewImg) previewImg.style.display = 'none';

      await loadGallery();
      renderGallery();
      renderCMSItemList();
      alert('Photo & Caption successfully published to portfolio!');
    });
  }

  function cmsLogout() {
  setToken(null);
  const authSection = document.getElementById('cmsAuthSection');
  const mainSection = document.getElementById('cmsMainSection');
  const pinInput = document.getElementById('cmsPinInput');
  if (authSection) authSection.style.display = 'block';
  if (mainSection) mainSection.style.display = 'none';
  if (pinInput) pinInput.value = '';
}

const exportBtn = document.getElementById('exportCMSBackup');
  const importFileInput = document.getElementById('importCMSFileInput');
  const exportAppointmentsBtn = document.getElementById('exportAppointmentsCSV');

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      await loadGallery();
      await loadAppointments();
      await loadCMSConfig();
      const backupData = { gallery: galleryItems, appointments: appointmentsList, config: cmsConfig };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'Dr_Sumya_Pervin_Website_Backup_' + Date.now() + '.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  if (exportAppointmentsBtn) {
    exportAppointmentsBtn.addEventListener('click', async () => {
      await loadAppointments();
      if (appointmentsList.length === 0) {
        alert('No appointments stored to export.');
        return;
      }

      let csvContent = 'data:text/csv;charset=utf-8,ID,Patient Name,Mobile,Chamber,Date,Service,Notes,Status,Created At\n';
      appointmentsList.forEach(app => {
        const row = [
          app.id,
          '"' + app.patient_name + '"',
          '"' + app.patient_phone + '"',
          '"' + app.chamber + '"',
          app.appointment_date,
          '"' + app.service + '"',
          '"' + (app.notes || '') + '"',
          app.status,
          '"' + app.created_at + '"'
        ].join(',');
        csvContent += row + '\n';
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'Dr_Sumya_Pervin_Appointments_' + Date.now() + '.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (imported.gallery) {
              for (const item of imported.gallery) {
                try {
                  await api('POST', '/api/gallery', {
                    title: item.title,
                    category: item.category,
                    caption: item.caption || '',
                    image_path: item.image || item.image_path || 'assets/clinic.jpg'
                  });
                } catch (e) {}
              }
            }
            if (imported.config) {
              try {
                await api('PUT', '/api/config', {
                  whatsapp: imported.config.whatsapp || '',
                  telegram: imported.config.telegram || ''
                });
              } catch (e) {}
            }
            await loadGallery();
            await loadAppointments();
            renderCMSItemList();
            renderCMSAppointmentsList();
            alert('Successfully imported portfolio and appointment data!');
          } catch(err) {
            alert('Invalid backup JSON file.');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  const configForm = document.getElementById('cmsConfigForm');
  if (configForm) {
    configForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const whatsapp = document.getElementById('doctorWaInput').value;
      const telegram = document.getElementById('doctorTgInput').value;
      const newPin = document.getElementById('newPinInput').value;
      const currentPin = document.getElementById('currentPinInput') ? document.getElementById('currentPinInput').value : '';

      const body = { whatsapp, telegram };
      if (newPin) {
        if (!currentPin) {
          alert('Current PIN is required to set a new PIN.');
          return;
        }
        body.current_pin = currentPin;
        body.new_pin = newPin;
      }

      try {
        await api('PUT', '/api/config', body);
        alert('Doctor Phone & Notification Settings updated successfully!');
        document.getElementById('newPinInput').value = '';
        if (document.getElementById('currentPinInput')) document.getElementById('currentPinInput').value = '';
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }
});

function loadCMSConfigForm() {
  const wa = document.getElementById('doctorWaInput');
  const tg = document.getElementById('doctorTgInput');
  if (wa) wa.value = cmsConfig.whatsapp || '';
  if (tg) tg.value = cmsConfig.telegram || '';
}

function renderCMSItemList() {
  const container = document.getElementById('cmsItemList');
  if (!container) return;

  container.innerHTML = galleryItems.map(item => `
    <div class="cms-item-row">
      <div class="cms-item-info">
        <img src="${escapeHTML(item.image_path)}" class="cms-item-thumb" alt="${escapeHTML(item.title)}">
        <div>
          <strong style="font-size:14px; display:block;">${escapeHTML(item.title)}</strong>
          <span style="font-size:12px; color:var(--grey);">${escapeHTML(capitalize(item.category))} \u2022 ${escapeHTML(item.created_at ? item.created_at.slice(0, 10) : '')}</span>
        </div>
      </div>
      <button class="btn-danger btn-sm" onclick="deleteCMSItem('${item.id}')">Delete</button>
    </div>
  `).join('');
}

async function deleteCMSItem(id) {
  if (!confirm('Are you sure you want to remove this photo from the portfolio?')) return;
  try {
    await api('DELETE', '/api/gallery/' + id);
  } catch (err) {
    alert('Failed to delete: ' + err.message);
    return;
  }
  galleryItems = galleryItems.filter(item => item.id !== id);
  renderGallery();
  renderCMSItemList();
}

function renderCMSAppointmentsList() {
  const container = document.getElementById('cmsAppointmentsList');
  if (!container) return;

  if (appointmentsList.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--grey);">No patient appointments logged yet.</div>';
    return;
  }

  container.innerHTML = appointmentsList.map(app => {
    let statusClass = 'status-pending';
    if (app.status === 'Confirmed') statusClass = 'status-confirmed';
    if (app.status === 'Completed') statusClass = 'status-completed';

    const waLink = 'https://wa.me/' + app.patient_phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent('Hello ' + app.patient_name + ', this is Dr. Sumya Pervin\'s clinic confirming your appointment for ' + app.appointment_date + ' at ' + app.chamber + '.');

    return `
      <div class="cms-item-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <strong style="font-size:16px; color:var(--sienna);">${escapeHTML(app.patient_name)}</strong>
            <span style="font-size:13px; color:var(--grey); font-weight:500;"> (${escapeHTML(app.patient_phone)})</span>
          </div>
          <span class="status-badge ${statusClass}">${escapeHTML(app.status)}</span>
        </div>

        <div style="font-size:13.5px; color:var(--ink);">
          \uD83D\uDCC5 <strong>Date:</strong> ${escapeHTML(app.appointment_date)} &nbsp;|&nbsp; \uD83C\uDFE5 <strong>Chamber:</strong> ${escapeHTML(app.chamber)}<br>
          \uD83D\uDC89 <strong>Service:</strong> ${escapeHTML(app.service)} ${app.notes ? '<br>\uD83D\uDCDD <strong>Notes:</strong> <em>' + escapeHTML(app.notes) + '</em>' : ''}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; flex-wrap:wrap; gap:8px;">
          <span style="font-size:11.5px; color:var(--grey);">Logged: ${escapeHTML(app.created_at)}</span>
          <div style="display:flex; gap:6px;">
            <a href="${escapeHTML(waLink)}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm">\uD83D\uDCAC WhatsApp Patient</a>
            <button class="btn btn-out btn-sm" onclick="toggleAppointmentStatus('${app.id}')">Update Status</button>
            <button class="btn-danger btn-sm" onclick="deleteAppointment('${app.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleAppointmentStatus(id) {
  const app = appointmentsList.find(a => a.id === id);
  if (!app) return;
  const nextStatus = app.status === 'Pending' ? 'Confirmed' : (app.status === 'Confirmed' ? 'Completed' : 'Pending');
  try {
    await api('PUT', '/api/appointments/' + id + '/status', { status: nextStatus });
  } catch (err) {
    alert('Failed to update status: ' + err.message);
    return;
  }
  appointmentsList = appointmentsList.map(a => a.id === id ? { ...a, status: nextStatus } : a);
  renderCMSAppointmentsList();
}

async function deleteAppointment(id) {
  if (!confirm('Delete this appointment record permanently?')) return;
  try {
    await api('DELETE', '/api/appointments/' + id);
  } catch (err) {
    alert('Failed to delete: ' + err.message);
    return;
  }
  appointmentsList = appointmentsList.filter(app => app.id !== id);
  renderCMSAppointmentsList();
}
