// The doctor's admin panel -- everything behind the PIN.
//
// Split out of main.js on 2026-08-27. It was ~840 lines that every patient
// downloaded and parsed to reach a screen only one person on earth ever opens.
// It is fetched on the first .open-cms click, or on arrival at a #reset?token=
// deep link, and never on an ordinary page view.
//
// This is a classic script, not a module: main.js is one too, and converting it
// would have changed script execution timing on a page whose whole first-paint
// behaviour was just rebuilt around when main.js runs. The seam is instead a
// bridge object passed to initCMS(), carrying the handful of things this file
// needs from main.js -- including live accessors for the two pieces of state the
// two files share, so neither can end up reading a stale copy of the other's.
(function () {
  'use strict';

  let bridge = null;

  // Thin aliases so the moved code reads exactly as it did in main.js.
  const api = (...args) => bridge.api(...args);
  const getToken = () => bridge.getToken();
  const setToken = (t) => bridge.setToken(t);
  const loadCMSConfig = () => bridge.loadCMSConfig();
  const loadGallery = () => bridge.loadGallery();
  const loadSiteContent = () => bridge.loadSiteContent();
  const renderGallery = () => bridge.renderGallery();
  const escapeHTML = (s) => bridge.escapeHTML(s);
  const capitalize = (s) => bridge.capitalize(s);
  const turnstileToken = (k) => bridge.turnstileToken(k);
  const turnstileReset = (k) => bridge.turnstileReset(k);

  // ---- Feedback -----------------------------------------------------------
  // alert() and confirm() were this panel's entire feedback layer -- twenty call
  // sites. Both block the page, neither can be styled, and on mobile they render
  // as a browser chrome dialog that looks nothing like the site it interrupts.
  // Replaced with the same inline role="status" pattern the patient-facing
  // booking form already uses.
  let toastTimer = null;

  function cmsToastHost() {
    let host = document.getElementById('cmsToasts');
    if (host) return host;
    const modal = document.getElementById('cmsModal');
    const box = modal && modal.querySelector('.modal-box');
    if (!box) return null;
    host = document.createElement('div');
    host.id = 'cmsToasts';
    host.className = 'cms-toasts';
    // polite, not assertive: these follow an action the admin just took, so they
    // should not cut across whatever the screen reader is mid-sentence on.
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    box.appendChild(host);
    return host;
  }

  function cmsToast(message, kind = 'ok') {
    const host = cmsToastHost();
    if (!host) return;
    host.className = 'cms-toasts cms-toasts-' + kind;
    host.textContent = message;
    host.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    // Errors stay until the next action replaces them; a confirmation that the
    // admin has already read is just clutter.
    if (kind === 'ok') {
      toastTimer = setTimeout(() => { host.hidden = true; }, 5000);
    }
  }

  // Two-step confirmation on the button itself, replacing confirm(). The button
  // states what the second click will do, so the destructive action is never one
  // stray click away, and it cannot be dismissed by a reflexive Enter the way a
  // native confirm can.
  const CONFIRM_WINDOW_MS = 6000;
  const armed = new WeakMap();

  function confirmOnButton(btn, prompt) {
    if (!btn) return true;
    const entry = armed.get(btn);
    if (entry) {
      clearTimeout(entry.timer);
      armed.delete(btn);
      btn.textContent = entry.label;
      btn.classList.remove('is-confirming');
      return true;
    }
    const label = btn.textContent;
    btn.textContent = prompt;
    btn.classList.add('is-confirming');
    const timer = setTimeout(() => {
      armed.delete(btn);
      btn.textContent = label;
      btn.classList.remove('is-confirming');
    }, CONFIRM_WINDOW_MS);
    armed.set(btn, { label, timer });
    return false;
  }

  // Appointment data never leaves this file: nothing on the patient-facing page
  // reads it, and it is the most sensitive thing the client holds.
  let appointmentsList = [];

  async function loadAppointments() {
    try {
      appointmentsList = await api('GET', '/api/appointments');
    } catch (e) {
      appointmentsList = [];
    }
    renderCMSAppointmentsList();
  }

  function csvCell(value) {
    const s = String(value === null || value === undefined ? '' : value);
    const neutralised = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
    return '"' + neutralised.replace(/"/g, '""') + '"';
  }

  const cmsModal = document.getElementById('cmsModal');
  const cmsAuthSection = document.getElementById('cmsAuthSection');
  const cmsMainSection = document.getElementById('cmsMainSection');
  const cmsPinInput = document.getElementById('cmsPinInput');
  const submitPinBtn = document.getElementById('submitPin');
  const pinError = document.getElementById('pinError');
  const closeCMSBtn = document.getElementById('closeCMS');

  // main.js owns the .open-cms listeners now -- it has to, since this file does
  // not exist until one of them is clicked. It opens the modal itself for
  // immediate feedback and then calls this, so the only thing left here is the
  // resume-an-existing-session half.
  async function openCms() {
    if (cmsModal) cmsModal.classList.add('active');
    if (!getToken()) return;
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

  if (closeCMSBtn && cmsModal) {
    closeCMSBtn.addEventListener('click', () => cmsModal.classList.remove('active'));
  }

  let pending2faChallenge = null;

  async function attemptCMSLogin() {
    if (!cmsPinInput) return;
    const pin = cmsPinInput.value.trim();
    const tsToken = turnstileToken('login');
    if (!tsToken) {
      if (pinError) {
        pinError.style.display = 'block';
        pinError.textContent = 'Please complete the verification check below.';
      }
      return;
    }
    try {
      const data = await api('POST', '/api/auth/login', { pin, 'cf-turnstile-response': tsToken });
      if (data.pending_2fa) {
        pending2faChallenge = data.challenge;
        const step = document.getElementById('cms2faStep');
        if (step) step.style.display = 'block';
        const codeInput = document.getElementById('cms2faCodeInput');
        if (codeInput) { codeInput.value = ''; codeInput.focus(); }
        if (pinError) pinError.style.display = 'none';
        return;
      }
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
    } finally {
      // Reset on success too: the token is spent either way, and logging out and
      // back in within the same page load would otherwise reuse a dead token.
      turnstileReset('login');
    }
  }

  const submit2faBtn = document.getElementById('submit2faBtn');
  const cms2faCodeInput = document.getElementById('cms2faCodeInput');
  const twofaError = document.getElementById('twofaError');

  async function attempt2faVerify() {
    if (!pending2faChallenge || !cms2faCodeInput) return;
    const code = cms2faCodeInput.value.trim();
    if (!code) {
      if (twofaError) {
        twofaError.style.display = 'block';
        twofaError.textContent = 'Please enter your 6-digit code.';
      }
      return;
    }
    try {
      const data = await api('POST', '/api/auth/2fa/verify', { challenge: pending2faChallenge, code });
      setToken(data.token);
      pending2faChallenge = null;
      if (twofaError) twofaError.style.display = 'none';
      const step = document.getElementById('cms2faStep');
      if (step) step.style.display = 'none';
      cmsAuthSection.style.display = 'none';
      cmsMainSection.style.display = 'block';
      await Promise.all([
        loadAppointments(),
        loadGallery(),
        loadCMSConfig()
      ]);
      renderCMSItemList();
      loadCMSConfigForm();
    } catch (err) {
      if (twofaError) {
        twofaError.style.display = 'block';
        twofaError.textContent = err.message || 'Invalid code.';
      }
    }
  }

  if (submit2faBtn) submit2faBtn.addEventListener('click', attempt2faVerify);
  if (cms2faCodeInput) {
    cms2faCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        attempt2faVerify();
      }
    });
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
      const urlInput = document.getElementById('photoUrlInput');
      const imageUrl = urlInput ? urlInput.value.trim() : '';

      // One multipart POST to /api/gallery, which stores the file in R2 and
      // writes the row in the same request. This used to be two calls, the first
      // to /api/gallery/upload — a route that never existed, so it 404'd, and the
      // fallback path it took ('assets/clinic.jpg') is not an accepted image_path
      // either, so publishing a photo failed outright.
      if (!file && !imageUrl) {
        cmsToast('Choose a photo file, or paste an image URL.', 'err');
        return;
      }

      const fd = new FormData();
      fd.append('title', title);
      fd.append('category', category);
      fd.append('caption', caption);
      if (file) {
        fd.append('image', file);
      } else {
        fd.append('image_url', imageUrl);
      }

      try {
        await api('POST', '/api/gallery', fd);
      } catch (err) {
        cmsToast('Failed to publish: ' + err.message, 'err');
        return;
      }

      uploadForm.reset();
      currentBase64Image = '';
      if (previewImg) previewImg.style.display = 'none';

      await loadGallery();
      renderGallery();
      renderCMSItemList();
      cmsToast('Photo published to the portfolio.');
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

  // cmsLogout is declared here, inside this DOMContentLoaded callback, so it was
  // never a global -- the markup's onclick="cmsLogout()" threw ReferenceError and
  // the Logout button had never worked. Removing the inline handler for the CSP
  // fixed it as a side effect.
  const cmsLogoutBtn = document.getElementById('cmsLogoutBtn');
  if (cmsLogoutBtn) cmsLogoutBtn.addEventListener('click', cmsLogout);

const exportBtn = document.getElementById('exportCMSBackup');
  const importFileInput = document.getElementById('importCMSFileInput');
  const exportAppointmentsBtn = document.getElementById('exportAppointmentsCSV');

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      await loadGallery();
      await loadAppointments();
      await loadCMSConfig();
      const backupData = { gallery: bridge.galleryItems, appointments: appointmentsList, config: bridge.cmsConfig };
      // encodeURIComponent did escape '#' correctly here, so this path was not
      // truncating -- but a data: URL still caps out on large payloads in some
      // browsers, and this file grows with the appointment list. Same Blob
      // mechanism as the CSV export above.
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = 'Dr_Sumya_Pervin_Website_Backup_' + Date.now() + '.json';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    });
  }

  if (exportAppointmentsBtn) {
    exportAppointmentsBtn.addEventListener('click', async () => {
      await loadAppointments();
      if (appointmentsList.length === 0) {
        cmsToast('There are no appointments to export.', 'err');
        return;
      }

      const header = ['ID', 'Patient Name', 'Mobile', 'Chamber', 'Date', 'Service', 'Notes', 'Status', 'Created At'];
      const rows = appointmentsList.map(app => [
        app.id, app.patient_name, app.patient_phone, app.chamber,
        app.appointment_date, app.service, app.notes || '', app.status, app.created_at
      ]);
      const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');

      // A Blob, not a data: URL. The old export ran the whole document through
      // encodeURI(), which does NOT escape '#': a single '#' in a patient's name
      // or notes turned everything after it into a URL fragment and the doctor
      // silently received a truncated file. A Blob has no encoding step to get
      // wrong and no practical size ceiling.
      //
      // The BOM is for Excel: without it Excel reads the file in the system
      // codepage and mangles every non-ASCII name, which on this site's patient
      // list is not an edge case.
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Dr_Sumya_Pervin_Appointments_' + Date.now() + '.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
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
            const summary = [];
            if (imported.gallery) {
              let okCount = 0, skipped = 0, failed = 0;
              for (const item of imported.gallery) {
                const path = item.image || item.image_path || '';
                // The API accepts only /api/uploads/… or absolute http(s). The old
                // 'assets/clinic.jpg' fallback 400'd and the silent catch dropped
                // the item with no trace -- the same defect class as the upload
                // route bug fixed on 2026-08-02.
                if (!/^(?:\/api\/uploads\/|https?:\/\/)/.test(path)) { skipped++; continue; }
                try {
                  await api('POST', '/api/gallery', {
                    title: item.title,
                    category: item.category,
                    caption: item.caption || '',
                    image_path: path
                  });
                  okCount++;
                } catch (e) {
                  failed++;
                }
              }
              summary.push('Gallery: ' + okCount + ' imported' +
                (skipped ? ', ' + skipped + ' skipped (unsupported image path)' : '') +
                (failed ? ', ' + failed + ' failed' : ''));
            }
            if (imported.config) {
              try {
                await api('PUT', '/api/config', {
                  whatsapp: imported.config.whatsapp || '',
                  telegram: imported.config.telegram || ''
                });
                summary.push('Settings: imported');
              } catch (e) {
                summary.push('Settings: FAILED (' + e.message + ')');
              }
            }
            await loadGallery();
            await loadAppointments();
            renderCMSItemList();
            renderCMSAppointmentsList();
            cmsToast(summary.length ? summary.join(' \u2022 ') : 'Nothing importable found in that file.', summary.length ? 'ok' : 'err');
          } catch(err) {
            cmsToast('That file is not a valid backup JSON file.', 'err');
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
      const adminEmail = document.getElementById('adminEmailInput') ? document.getElementById('adminEmailInput').value : '';
      const newPin = document.getElementById('newPinInput').value;
      const currentPin = document.getElementById('currentPinInput') ? document.getElementById('currentPinInput').value : '';

      const body = { whatsapp, telegram, admin_email: adminEmail };
      if (newPin) {
        if (!currentPin) {
          cmsToast('Your current PIN is required to set a new one.', 'err');
          return;
        }
        body.current_pin = currentPin;
        body.new_pin = newPin;
      }

      try {
        await api('PUT', '/api/config', body);
        cmsToast('Notification settings updated.');
        document.getElementById('newPinInput').value = '';
        if (document.getElementById('currentPinInput')) document.getElementById('currentPinInput').value = '';
      } catch (err) {
        cmsToast('Could not save settings: ' + err.message, 'err');
      }
    });
  }

  // Site Copy Form
  const siteContentForm = document.getElementById('siteContentForm');
  if (siteContentForm) {
    siteContentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {};
      siteContentForm.querySelectorAll('[data-key]').forEach(input => {
        payload[input.dataset.key] = input.value;
      });
      try {
        await api('PUT', '/api/content', payload);
        cmsToast('Site copy updated.');
        await loadSiteContent();
      } catch (err) {
        cmsToast('Could not save the site copy: ' + err.message, 'err');
      }
    });
  }

  // 2FA Management UI
  async function update2faTabUI() {
    const statusBox = document.getElementById('twofaStatusBox');
    const setupBox = document.getElementById('twofaSetupBox');
    const btnStart = document.getElementById('btnStart2faSetup');
    const btnToggleDisable = document.getElementById('btnToggleDisable2fa');
    const disableForm = document.getElementById('twofaDisableForm');
    if (!statusBox) return;

    try {
      const data = await api('GET', '/api/auth/2fa/status');
      if (data.enabled) {
        statusBox.textContent = '🔒 Status: 2FA is Currently ENABLED';
        statusBox.style.background = '#e8f5e9';
        statusBox.style.color = '#2e7d32';
        if (btnStart) btnStart.style.display = 'none';
        if (setupBox) setupBox.style.display = 'none';
        if (btnToggleDisable) btnToggleDisable.style.display = 'inline-block';
      } else {
        statusBox.textContent = '🔓 Status: 2FA is Currently DISABLED';
        statusBox.style.background = 'var(--butter)';
        statusBox.style.color = 'var(--ink)';
        if (btnStart) btnStart.style.display = 'inline-block';
        if (btnToggleDisable) btnToggleDisable.style.display = 'none';
        if (disableForm) disableForm.style.display = 'none';
      }
    } catch {
      statusBox.textContent = 'Status: Error checking 2FA';
    }
  }

  // qrcode.min.js is 24 KB that only ever runs on this one click, in the one
  // session where the doctor enrols an authenticator -- it used to be a blocking
  // <script defer> on every patient's page load. Injected on demand instead;
  // 'self' in script-src covers a same-origin src, so no nonce is involved.
  let qrCodeLoader = null;
  function loadQrCode() {
    if (window.QRCode) return Promise.resolve(window.QRCode);
    if (!qrCodeLoader) {
      qrCodeLoader = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'js/vendor/qrcode.min.js';
        s.onload = () => (window.QRCode ? resolve(window.QRCode) : reject(new Error('qrcode.js loaded but exported nothing')));
        s.onerror = () => { qrCodeLoader = null; reject(new Error('qrcode.js failed to load')); };
        document.head.appendChild(s);
      });
    }
    return qrCodeLoader;
  }

  const btnStart2fa = document.getElementById('btnStart2faSetup');
  if (btnStart2fa) {
    btnStart2fa.addEventListener('click', async () => {
      try {
        const data = await api('POST', '/api/auth/2fa/setup');
        const setupBox = document.getElementById('twofaSetupBox');
        const secretText = document.getElementById('twofaSecretText');
        const canvas = document.getElementById('twofaQrCanvas');

        if (secretText) secretText.textContent = data.secret;
        if (setupBox) setupBox.style.display = 'block';

        // The QR is a convenience; the secret above it is the authoritative
        // enrolment path. A failed script load must not block setup, so this is
        // awaited after the box is already open and only hides the canvas.
        if (canvas) {
          try {
            const QRCode = await loadQrCode();
            QRCode.toCanvas(canvas, data.otpauth_uri, { width: 180 });
            canvas.hidden = false;
          } catch {
            canvas.hidden = true;
          }
        }
      } catch (err) {
        cmsToast('Could not start 2FA setup: ' + err.message, 'err');
      }
    });
  }

  const btnConfirm2fa = document.getElementById('btnConfirm2faSetup');
  if (btnConfirm2fa) {
    btnConfirm2fa.addEventListener('click', async () => {
      const codeInput = document.getElementById('twofaSetupCode');
      const errBox = document.getElementById('twofaSetupError');
      const code = codeInput ? codeInput.value.trim() : '';

      try {
        await api('POST', '/api/auth/2fa/verify-setup', { code });
        cmsToast('Two-factor authentication is now enabled.');
        if (errBox) errBox.style.display = 'none';
        await update2faTabUI();
      } catch (err) {
        if (errBox) { errBox.style.display = 'block'; errBox.textContent = err.message || 'Invalid code.'; }
      }
    });
  }

  const btnToggleDisable = document.getElementById('btnToggleDisable2fa');
  const disableForm = document.getElementById('twofaDisableForm');
  if (btnToggleDisable && disableForm) {
    btnToggleDisable.addEventListener('click', () => {
      disableForm.style.display = disableForm.style.display === 'none' ? 'block' : 'none';
    });
  }

  const btnConfirmDisable = document.getElementById('btnConfirmDisable2fa');
  if (btnConfirmDisable) {
    btnConfirmDisable.addEventListener('click', async () => {
      const pin = document.getElementById('disable2faPin').value;
      const code = document.getElementById('disable2faCode').value;
      try {
        await api('POST', '/api/auth/2fa/disable', { current_pin: pin, code });
        cmsToast('Two-factor authentication is now disabled.');
        await update2faTabUI();
      } catch (err) {
        cmsToast('Could not disable 2FA: ' + err.message, 'err');
      }
    });
  }

  // Forgot & Reset Password Modals
  const openForgotBtn = document.getElementById('openForgotBtn');
  const forgotModal = document.getElementById('forgotModal');
  const closeForgotBtn = document.getElementById('closeForgot');
  const backToLoginLink = document.getElementById('backToLoginLink');
  const forgotForm = document.getElementById('forgotForm');
  const forgotStatus = document.getElementById('forgotStatus');

  if (openForgotBtn && forgotModal) {
    openForgotBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmsModal = document.getElementById('cmsModal');
      if (cmsModal) cmsModal.classList.remove('active');
      forgotModal.classList.add('active');
    });
  }
  if (closeForgotBtn && forgotModal) {
    closeForgotBtn.addEventListener('click', () => forgotModal.classList.remove('active'));
  }
  if (backToLoginLink) {
    backToLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (forgotModal) forgotModal.classList.remove('active');
      const cmsModal = document.getElementById('cmsModal');
      if (cmsModal) cmsModal.classList.add('active');
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmailInput').value;
      const tsToken = turnstileToken('forgot');
      try {
        const res = await api('POST', '/api/auth/forgot-password', { email, 'cf-turnstile-response': tsToken });
        if (forgotStatus) {
          forgotStatus.style.display = 'block';
          forgotStatus.style.color = '#2e7d32';
          forgotStatus.textContent = res.message || 'If that address matches, a reset link was sent.';
        }
      } catch (err) {
        if (forgotStatus) {
          forgotStatus.style.display = 'block';
          forgotStatus.style.color = '#DC3545';
          forgotStatus.textContent = err.message || 'Request failed.';
        }
      } finally {
        turnstileReset('forgot');
      }
    });
  }

  const resetModal = document.getElementById('resetModal');
  const closeResetBtn = document.getElementById('closeReset');
  const resetForm = document.getElementById('resetForm');
  const resetStatus = document.getElementById('resetStatus');

  if (closeResetBtn && resetModal) {
    closeResetBtn.addEventListener('click', () => resetModal.classList.remove('active'));
  }

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = document.getElementById('resetTokenInput').value;
      const newPin = document.getElementById('resetNewPin').value;
      const confirmPin = document.getElementById('resetConfirmPin').value;
      if (newPin !== confirmPin) {
        if (resetStatus) {
          resetStatus.style.display = 'block';
          resetStatus.style.color = '#DC3545';
          resetStatus.textContent = 'PINs do not match.';
        }
        return;
      }
      const tsToken = turnstileToken('reset');
      try {
        const res = await api('POST', '/api/auth/reset-password', { token, new_pin: newPin, 'cf-turnstile-response': tsToken });
        if (resetStatus) {
          resetStatus.style.display = 'block';
          resetStatus.style.color = '#2e7d32';
          resetStatus.textContent = res.message || 'Password updated. Please log in.';
        }
        setTimeout(() => {
          if (resetModal) resetModal.classList.remove('active');
          window.location.hash = '';
          const cmsModal = document.getElementById('cmsModal');
          if (cmsModal) cmsModal.classList.add('active');
        }, 1500);
      } catch (err) {
        if (resetStatus) {
          resetStatus.style.display = 'block';
          resetStatus.style.color = '#DC3545';
          resetStatus.textContent = err.message || 'Reset failed.';
        }
      } finally {
        turnstileReset('reset');
      }
    });
  }

  // Hash Router for password reset link
  function checkResetHash() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#reset?token=')) {
      const token = new URLSearchParams(hash.slice(7)).get('token');
      if (token && resetModal) {
        const tokenInput = document.getElementById('resetTokenInput');
        if (tokenInput) tokenInput.value = token;
        resetModal.classList.add('active');
      }
    }
  }
  window.addEventListener('hashchange', checkResetHash);
  checkResetHash();

  function loadCMSConfigForm() {
    const wa = document.getElementById('doctorWaInput');
    const tg = document.getElementById('doctorTgInput');
    const adminEmail = document.getElementById('adminEmailInput');
    const cfg = bridge.cmsConfig;
    if (wa) wa.value = cfg.whatsapp || '';
    if (tg) tg.value = cfg.telegram || '';
    if (adminEmail) adminEmail.value = cfg.admin_email || '';
  }

  function renderCMSItemList() {
    const container = document.getElementById('cmsItemList');
    if (!container) return;

    container.innerHTML = bridge.galleryItems.map(item => `
      <div class="cms-item-row">
        <div class="cms-item-info">
          <img src="${escapeHTML(item.image_path)}" class="cms-item-thumb" alt="${escapeHTML(item.title)}">
          <div>
            <strong style="font-size:14px; display:block;">${escapeHTML(item.title)}</strong>
            <span style="font-size:12px; color:var(--grey);">${escapeHTML(capitalize(item.category))} \u2022 ${escapeHTML(item.created_at ? item.created_at.slice(0, 10) : '')}</span>
          </div>
        </div>
        <button class="btn-danger btn-sm" data-cms-action="gallery-delete" data-cms-id="${escapeHTML(item.id)}">Delete</button>
      </div>
    `).join('');
  }

  async function deleteCMSItem(id, btn) {
    if (!confirmOnButton(btn, 'Confirm delete?')) return;
    try {
      await api('DELETE', '/api/gallery/' + id);
    } catch (err) {
      cmsToast('Could not delete the photo: ' + err.message, 'err');
      return;
    }
    bridge.galleryItems = bridge.galleryItems.filter(item => item.id !== id);
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
              <button class="btn btn-out btn-sm" data-cms-action="appointment-status" data-cms-id="${escapeHTML(app.id)}">Update Status</button>
              <button class="btn-danger btn-sm" data-cms-action="appointment-delete" data-cms-id="${escapeHTML(app.id)}">Delete</button>
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
      // /api/appointments/:id — Pages routes [id].js to a single segment, so the
      // '/status' suffix this used to carry matched no Function and 404'd.
      await api('PUT', '/api/appointments/' + id, { status: nextStatus });
    } catch (err) {
      cmsToast('Could not update the status: ' + err.message, 'err');
      return;
    }
    appointmentsList = appointmentsList.map(a => a.id === id ? { ...a, status: nextStatus } : a);
    renderCMSAppointmentsList();
  }

  async function deleteAppointment(id, btn) {
    if (!confirmOnButton(btn, 'Delete permanently?')) return;
    try {
      await api('DELETE', '/api/appointments/' + id);
    } catch (err) {
      cmsToast('Could not delete the appointment: ' + err.message, 'err');
      return;
    }
    appointmentsList = appointmentsList.filter(app => app.id !== id);
    renderCMSAppointmentsList();
  }

  // CMS row actions. These buttons are built as HTML strings by the two render
  // functions above, so they used to carry onclick="deleteCMSItem('${item.id}')"
  // and friends -- inline handlers, which the CSP added in F9 drops with no
  // console error the admin would ever see, and an id interpolated raw into an
  // attribute on top of that. Delegating on document instead of on the containers
  // means no re-binding after each innerHTML re-render.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cms-action]');
    if (!btn) return;
    const id = btn.dataset.cmsId;
    if (!id) return;

    // The button is passed through because the two delete paths now confirm on
    // it -- a first click arms it, a second within the window commits.
    if (btn.dataset.cmsAction === 'gallery-delete') deleteCMSItem(id, btn);
    else if (btn.dataset.cmsAction === 'appointment-status') toggleAppointmentStatus(id);
    else if (btn.dataset.cmsAction === 'appointment-delete') deleteAppointment(id, btn);
  });

  window.initCMS = function initCMS(sharedBridge) {
    bridge = sharedBridge;
    checkResetHash();
    return { open: openCms };
  };
})();
