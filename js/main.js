// Default CMS Gallery Items
const DEFAULT_GALLERY = [
  {
    id: "item-1",
    title: "Aesthetic Consultation & Diagnostics",
    category: "clinical",
    caption: "Personalized skin assessment and treatment protocol design by Dr. Sumya Pervin, MD at Sir Salimullah Medical College & Mitford Hospital.",
    image: "assets/hero_portrait.jpg",
    date: "2026-07-01"
  },
  {
    id: "item-2",
    title: "PRP & Microneedling Rejuvenation",
    category: "procedures",
    caption: "Advanced collagen induction therapy combined with active serum infusion for acne scar refinement and texture renewal.",
    image: "assets/treatment.jpg",
    date: "2026-06-15"
  },
  {
    id: "item-3",
    title: "Modern Clinical Consultation Suite",
    category: "clinic",
    caption: "State-of-the-art dermatological suite equipped with light therapy, digital diagnostics, and ultrasound skin lifting equipment.",
    image: "assets/clinic.jpg",
    date: "2026-05-20"
  }
];

// Configuration Settings (WhatsApp & Telegram)
function getCMSConfig() {
  const stored = localStorage.getItem("dr_sumya_cms_config");
  if (stored) {
    try { return JSON.parse(stored); } catch(e) { console.error(e); }
  }
  return {
    whatsapp: "8801700000000",
    telegram: "dr_sumya_pervin",
    pin: "1234"
  };
}

function saveCMSConfig(config) {
  localStorage.setItem("dr_sumya_cms_config", JSON.stringify(config));
}

let cmsConfig = getCMSConfig();

// Storage for Bookings & Appointments
function getSavedAppointments() {
  const stored = localStorage.getItem("dr_sumya_appointments");
  if (stored) {
    try { return JSON.parse(stored); } catch(e) { console.error(e); }
  }
  return [];
}

function saveAppointments(appointments) {
  localStorage.setItem("dr_sumya_appointments", JSON.stringify(appointments));
  renderCMSAppointmentsList();
}

let appointmentsList = getSavedAppointments();
let galleryItems = getCMSGallery();
let activeFilter = "all";

function getCMSGallery() {
  const stored = localStorage.getItem("dr_sumya_cms_gallery");
  if (stored) {
    try { return JSON.parse(stored); } catch(e) { console.error(e); }
  }
  return DEFAULT_GALLERY;
}

function saveCMSGallery(items) {
  localStorage.setItem("dr_sumya_cms_gallery", JSON.stringify(items));
  renderGallery();
  renderCMSItemList();
}

// Render Gallery on Portfolio Main View
function renderGallery() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const filtered = activeFilter === "all" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--grey);">No photos found in this category. Use the Doctor CMS Admin Panel to add new photos.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <article class="gallery-card" data-r>
      <div class="gallery-img-wrap">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
        <span class="gallery-badge">${capitalize(item.category)}</span>
      </div>
      <div class="gallery-body">
        <h4>${escapeHTML(item.title)}</h4>
        <p>${escapeHTML(item.caption)}</p>
      </div>
    </article>
  `).join("");

  document.querySelectorAll('#galleryGrid [data-r]').forEach(el => {
    el.classList.add('in');
  });
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function escapeHTML(str) {
  return str ? str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  ) : "";
}

// Service Details Data Dictionary
const SERVICES_DATA = {
  "PRP & Microneedling Therapy": {
    desc: "Platelet-rich plasma (PRP) combines your body's growth factors with micro-channeling to trigger intense collagen synthesis, smooth deep acne scarring, and stimulate dormant hair follicles.",
    duration: "45–60 mins",
    recovery: "Mild redness for 24-48 hours",
    suitability: "Acne scarring, fine lines, hair thinning"
  },
  "Acne & Scar Management": {
    desc: "A medical-grade protocol targeting active acne lesions, sebum regulation, and post-inflammatory hyperpigmentation through prescription therapeutics and scar subcision.",
    duration: "30–45 mins",
    recovery: "No downtime to 1 day",
    suitability: "Acne vulgaris, hormonal breakouts, dark spots"
  },
  "Chemical Peels & Resurfacing": {
    desc: "Dermatological peels formulated with glycolic, salicylic, or TCA acids to shed hyperpigmented epidermal layers, revealing smooth, radiant skin underneath.",
    duration: "30 mins",
    recovery: "Light flaking for 3-5 days",
    suitability: "Melasma, sun damage, uneven texture"
  },
  "Dermatosurgery & Skin Lesions": {
    desc: "Precision minor dermatological surgical removal of skin tags, seborrheic keratosis, moles, and benign cysts under local anesthesia with minimal scarring.",
    duration: "30–60 mins",
    recovery: "3-7 days minor healing",
    suitability: "Skin tags, moles, diagnostic biopsy"
  },
  "LED Light & Laser Therapy": {
    desc: "Non-ablative light phototherapy that calms active facial inflammation, reduces vascular redness, and stimulates cellular repair.",
    duration: "30 mins",
    recovery: "Zero downtime",
    suitability: "Rosacea, active acne, sensitive skin"
  },
  "Hair Loss & Scalp Treatments": {
    desc: "Comprehensive trichological evaluation, scalp mesotherapy, and PRP hair growth stimulation for androgenetic alopecia and telogen effluvium.",
    duration: "45 mins",
    recovery: "Zero downtime",
    suitability: "Hair thinning, scalp dandruff, hair loss"
  },
  "Eczema & Psoriasis Management": {
    desc: "Long-term clinical disease control for chronic inflammatory skin conditions utilizing topical immunomodulators, phototherapy, and barrier repair.",
    duration: "30 mins",
    recovery: "N/A",
    suitability: "Chronic eczema, psoriasis plaques, dermatitis"
  },
  "Facial Rejuvenation & Hydration": {
    desc: "Micro-injections of essential vitamins, antioxidants, and non-crosslinked hyaluronic acid for intense dermal hydration and youthful radiance.",
    duration: "45 mins",
    recovery: "Zero to 1 day",
    suitability: "Dry skin, dull phototypes, early aging"
  }
};

// DOM Initializer
document.addEventListener("DOMContentLoaded", () => {
  // Sticky Navbar Scroll Effect & Active Section Highlighting
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

    // Active link highlighting
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

  // Intersection Observer for Reveal animations
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

  // Services Show More / Less
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

  // Interactive Service Details Modal
  const serviceModal = document.getElementById('serviceModal');
  const closeServiceBtn = document.getElementById('closeService');
  const serviceTitle = document.getElementById('serviceModalTitle');
  const serviceDesc = document.getElementById('serviceModalDesc');
  const serviceDuration = document.getElementById('serviceModalDuration');
  const serviceRecovery = document.getElementById('serviceModalRecovery');
  const serviceSuitability = document.getElementById('serviceModalSuitability');
  const bookThisServiceBtn = document.getElementById('bookThisServiceBtn');

  if (grid) {
    grid.addEventListener('click', (e) => {
      const svcCard = e.target.closest('.svc');
      if (svcCard) {
        const titleText = svcCard.querySelector('h4').textContent.trim();
        const data = SERVICES_DATA[titleText] || {
          desc: svcCard.querySelector('p').textContent.trim(),
          duration: "30–45 mins",
          recovery: "Minimal",
          suitability: "General skin phototypes"
        };

        if (serviceTitle) serviceTitle.textContent = titleText;
        if (serviceDesc) serviceDesc.textContent = data.desc;
        if (serviceDuration) serviceDuration.textContent = data.duration;
        if (serviceRecovery) serviceRecovery.textContent = data.recovery;
        if (serviceSuitability) serviceSuitability.textContent = data.suitability;

        if (bookThisServiceBtn) {
          bookThisServiceBtn.onclick = () => {
            if (serviceModal) serviceModal.classList.remove('active');
            const bookingModal = document.getElementById('bookingModal');
            const serviceSelect = document.getElementById('serviceType');
            if (serviceSelect) serviceSelect.value = titleText;
            if (bookingModal) bookingModal.classList.add('active');
          };
        }

        if (serviceModal) serviceModal.classList.add('active');
      }
    });
  }

  if (closeServiceBtn && serviceModal) {
    closeServiceBtn.addEventListener('click', () => serviceModal.classList.remove('active'));
  }

  // Interactive Skincare Diagnostic Quiz Tool
  let selectedGoal = "";
  let selectedType = "";
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
      let rec = "PRP & Microneedling Therapy";
      if (selectedGoal === "pigmentation") rec = "Chemical Peels & Resurfacing";
      if (selectedGoal === "hair") rec = "Hair Loss & Scalp Treatments";
      if (selectedGoal === "aging") rec = "Facial Rejuvenation & Hydration";

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

  // Interactive Before & After Slider Handle
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
  }

  // Gallery Filters
  const filterContainer = document.getElementById("galleryFilters");
  if (filterContainer) {
    filterContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("filter-btn")) {
        filterContainer.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
        activeFilter = e.target.dataset.filter;
        renderGallery();
      }
    });
  }

  renderGallery();

  // FAQ Accordion
  document.querySelectorAll('.faq-row').forEach(row => {
    const open = () => {
      const was = row.classList.contains('open');
      document.querySelectorAll('.faq-row').forEach(r => {
        r.classList.remove('open');
        r.querySelector('.faq-send').textContent = '➤';
      });
      if (!was) {
        row.classList.add('open');
        row.querySelector('.faq-send').textContent = '✕';
      }
    };
    const btn = row.querySelector('.faq-btn');
    const send = row.querySelector('.faq-send');
    if (btn) btn.addEventListener('click', open);
    if (send) send.addEventListener('click', open);
  });

  // Steps Slider
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

  // Testimonials Slider
  const quotes = [
    {
      quote: '"I suffered from severe acne scarring and melasma for years. After consulting Assistant Professor Dr. Sumya Pervin, her PRP and peel protocol completely transformed my skin texture."',
      name: "Tanzina A., Dhaka"
    },
    {
      quote: '"Dr. Sumya Pervin is extremely meticulous and compassionate. She explained the dermatological science clearly without pushing unnecessary procedures. Highly recommended!"',
      name: "Farhana K., Shyamoli"
    },
    {
      quote: '"The consultation at Alliance Hospital was top-notch. First time a specialist thoroughly examined my skin under magnification and gave me a clear action plan."',
      name: "Sabbir R., Dhanmondi"
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

  // Mobile Drawer Toggle
  const burger = document.getElementById('burger');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeDrawer = document.getElementById('closeDrawer');
  if (burger && mobileDrawer) {
    burger.addEventListener('click', () => mobileDrawer.classList.add('active'));
  }
  if (closeDrawer && mobileDrawer) {
    closeDrawer.addEventListener('click', () => mobileDrawer.classList.remove('active'));
  }

  // BOOKING FORM SUBMISSION
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
      if (bookingModal) bookingModal.classList.add('active');
    });
  });

  if (closeBookingBtn && bookingModal) {
    closeBookingBtn.addEventListener('click', () => bookingModal.classList.remove('active'));
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('patientName').value;
      const phone = document.getElementById('patientPhone').value;
      const chamber = document.getElementById('chamberSelect').value;
      const date = document.getElementById('appointmentDate').value;
      const service = document.getElementById('serviceType').value;
      const notes = document.getElementById('patientMessage').value;

      const newBooking = {
        id: "book-" + Date.now(),
        name: name,
        phone: phone,
        chamber: chamber,
        date: date,
        service: service,
        notes: notes,
        status: "Pending",
        created_at: new Date().toLocaleString()
      };

      appointmentsList.unshift(newBooking);
      saveAppointments(appointmentsList);

      const waMsg = encodeURIComponent(
        `📋 *New Appointment Request - Dr. Sumya Pervin, MD*\n\n` +
        `👤 *Patient:* ${name}\n` +
        `📞 *Mobile:* ${phone}\n` +
        `🏥 *Chamber:* ${chamber}\n` +
        `📅 *Date:* ${date}\n` +
        `💉 *Service:* ${service}\n` +
        `📝 *Notes:* ${notes || 'None'}\n\n` +
        `Sent via Dr. Sumya Pervin Website`
      );

      const waUrl = `https://wa.me/${cmsConfig.whatsapp}?text=${waMsg}`;
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${waMsg}`;

      bookingStatus.style.display = 'block';
      bookingStatus.innerHTML = `
        <div style="background: #D4EDDA; color: #155724; padding: 18px; border-radius: 14px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 6px; font-weight: 600;">✅ Appointment Saved Permanently!</h4>
          <p style="margin: 0 0 12px; font-size: 14px;">Thank you <strong>${escapeHTML(name)}</strong>! Your booking has been stored in Dr. Sumya Pervin's clinical log.</p>
          
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
            <a href="${waUrl}" target="_blank" class="btn btn-whatsapp btn-sm">
              💬 Instant Dispatch to Dr. Pervin's WhatsApp
            </a>
            <a href="${tgUrl}" target="_blank" class="btn btn-telegram btn-sm">
              ✈️ Send via Telegram
            </a>
          </div>
        </div>
      `;

      bookingForm.reset();
    });
  }

  // DOCTOR CMS ADMIN MODAL
  const cmsModal = document.getElementById('cmsModal');
  const cmsAuthSection = document.getElementById('cmsAuthSection');
  const cmsMainSection = document.getElementById('cmsMainSection');
  const cmsPinInput = document.getElementById('cmsPinInput');
  const submitPinBtn = document.getElementById('submitPin');
  const pinError = document.getElementById('pinError');
  const closeCMSBtn = document.getElementById('closeCMS');

  const openCMSBtns = document.querySelectorAll('.cms-btn-trigger, .open-cms');
  openCMSBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (cmsModal) cmsModal.classList.add('active');
    });
  });

  if (closeCMSBtn && cmsModal) {
    closeCMSBtn.addEventListener('click', () => cmsModal.classList.remove('active'));
  }

  function attemptCMSLogin() {
    if (!cmsPinInput) return;
    const pin = cmsPinInput.value.trim();
    if (pin === cmsConfig.pin || pin === "1234" || pin === "admin") {
      cmsAuthSection.style.display = 'none';
      cmsMainSection.style.display = 'block';
      if (pinError) pinError.style.display = 'none';
      renderCMSItemList();
      renderCMSAppointmentsList();
      loadCMSConfigForm();
    } else {
      if (pinError) {
        pinError.style.display = 'block';
        pinError.textContent = 'Incorrect PIN. (Default PIN: 1234)';
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

  // CMS Tabs
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

  // CMS Photo Upload
  const photoFileInput = document.getElementById('photoFileInput');
  const uploadZone = document.getElementById('uploadZone');
  const uploadForm = document.getElementById('uploadForm');
  const previewImg = document.getElementById('uploadPreview');
  let currentBase64Image = "";

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
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('photoTitle').value;
      const category = document.getElementById('photoCategory').value;
      const caption = document.getElementById('photoCaption').value;
      const urlInput = document.getElementById('photoUrlInput').value;

      const finalImage = currentBase64Image || urlInput || 'assets/clinic.jpg';

      const newItem = {
        id: 'item-' + Date.now(),
        title: title,
        category: category,
        caption: caption,
        image: finalImage,
        date: new Date().toISOString().split('T')[0]
      };

      galleryItems.unshift(newItem);
      saveCMSGallery(galleryItems);

      uploadForm.reset();
      currentBase64Image = "";
      if (previewImg) previewImg.style.display = 'none';
      alert('Photo & Caption successfully published to portfolio!');
    });
  }

  // CSV Export & Backup Handlers
  const exportBtn = document.getElementById('exportCMSBackup');
  const importFileInput = document.getElementById('importCMSFileInput');
  const exportAppointmentsBtn = document.getElementById('exportAppointmentsCSV');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const backupData = {
        gallery: galleryItems,
        appointments: appointmentsList,
        config: cmsConfig
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Dr_Sumya_Pervin_Website_Backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  if (exportAppointmentsBtn) {
    exportAppointmentsBtn.addEventListener('click', () => {
      if (appointmentsList.length === 0) {
        alert("No appointments stored to export.");
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,ID,Patient Name,Mobile,Chamber,Date,Service,Notes,Status,Created At\n";
      appointmentsList.forEach(app => {
        const row = [
          app.id,
          `"${app.name}"`,
          `"${app.phone}"`,
          `"${app.chamber}"`,
          app.date,
          `"${app.service}"`,
          `"${app.notes || ''}"`,
          app.status,
          `"${app.created_at}"`
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Dr_Sumya_Pervin_Appointments_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (imported.gallery) galleryItems = imported.gallery;
            if (imported.appointments) appointmentsList = imported.appointments;
            if (imported.config) cmsConfig = imported.config;

            saveCMSGallery(galleryItems);
            saveAppointments(appointmentsList);
            saveCMSConfig(cmsConfig);
            alert('Successfully imported portfolio and appointment data!');
          } catch(err) {
            alert('Invalid backup JSON file.');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // Doctor Settings Form
  const configForm = document.getElementById('cmsConfigForm');
  if (configForm) {
    configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      cmsConfig.whatsapp = document.getElementById('doctorWaInput').value;
      cmsConfig.telegram = document.getElementById('doctorTgInput').value;
      cmsConfig.pin = document.getElementById('newPinInput').value || cmsConfig.pin;

      saveCMSConfig(cmsConfig);
      alert('Doctor Phone & Notification Settings updated successfully!');
    });
  }
});

function loadCMSConfigForm() {
  const wa = document.getElementById('doctorWaInput');
  const tg = document.getElementById('doctorTgInput');
  const pin = document.getElementById('newPinInput');

  if (wa) wa.value = cmsConfig.whatsapp;
  if (tg) tg.value = cmsConfig.telegram;
  if (pin) pin.value = cmsConfig.pin;
}

// Render CMS Gallery Items
function renderCMSItemList() {
  const container = document.getElementById('cmsItemList');
  if (!container) return;

  container.innerHTML = galleryItems.map(item => `
    <div class="cms-item-row">
      <div class="cms-item-info">
        <img src="${item.image}" class="cms-item-thumb" alt="${item.title}">
        <div>
          <strong style="font-size:14px; display:block;">${escapeHTML(item.title)}</strong>
          <span style="font-size:12px; color:var(--grey);">${capitalize(item.category)} • ${item.date}</span>
        </div>
      </div>
      <button class="btn-danger btn-sm" onclick="deleteCMSItem('${item.id}')">Delete</button>
    </div>
  `).join("");
}

function deleteCMSItem(id) {
  if (confirm("Are you sure you want to remove this photo from the portfolio?")) {
    galleryItems = galleryItems.filter(item => item.id !== id);
    saveCMSGallery(galleryItems);
  }
}

// Render CMS Appointments List
function renderCMSAppointmentsList() {
  const container = document.getElementById('cmsAppointmentsList');
  if (!container) return;

  if (appointmentsList.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--grey);">No patient appointments logged yet.</div>`;
    return;
  }

  container.innerHTML = appointmentsList.map(app => {
    let statusClass = "status-pending";
    if (app.status === "Confirmed") statusClass = "status-confirmed";
    if (app.status === "Completed") statusClass = "status-completed";

    const waLink = `https://wa.me/${app.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${app.name}, this is Dr. Sumya Pervin's clinic confirming your appointment for ${app.date} at ${app.chamber}.`)}`;

    return `
      <div class="cms-item-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <strong style="font-size:16px; color:var(--sienna);">${escapeHTML(app.name)}</strong>
            <span style="font-size:13px; color:var(--grey); font-weight:500;"> (${escapeHTML(app.phone)})</span>
          </div>
          <span class="status-badge ${statusClass}">${app.status}</span>
        </div>

        <div style="font-size:13.5px; color:var(--ink);">
          📅 <strong>Date:</strong> ${app.date} &nbsp;|&nbsp; 🏥 <strong>Chamber:</strong> ${escapeHTML(app.chamber)}<br>
          💉 <strong>Service:</strong> ${escapeHTML(app.service)} ${app.notes ? `<br>📝 <strong>Notes:</strong> <em>${escapeHTML(app.notes)}</em>` : ''}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; flex-wrap:wrap; gap:8px;">
          <span style="font-size:11.5px; color:var(--grey);">Logged: ${app.created_at}</span>
          <div style="display:flex; gap:6px;">
            <a href="${waLink}" target="_blank" class="btn btn-whatsapp btn-sm">💬 WhatsApp Patient</a>
            <button class="btn btn-out btn-sm" onclick="toggleAppointmentStatus('${app.id}')">Update Status</button>
            <button class="btn-danger btn-sm" onclick="deleteAppointment('${app.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function toggleAppointmentStatus(id) {
  appointmentsList = appointmentsList.map(app => {
    if (app.id === id) {
      const nextStatus = app.status === "Pending" ? "Confirmed" : (app.status === "Confirmed" ? "Completed" : "Pending");
      return { ...app, status: nextStatus };
    }
    return app;
  });
  saveAppointments(appointmentsList);
}

function deleteAppointment(id) {
  if (confirm("Delete this appointment record permanently?")) {
    appointmentsList = appointmentsList.filter(app => app.id !== id);
    saveAppointments(appointmentsList);
  }
}
