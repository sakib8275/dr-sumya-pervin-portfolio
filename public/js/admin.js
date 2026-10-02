// Admin console bridge for the standalone /admin/ page.
//
// cms.js is the whole panel; it expects a `bridge` of helpers that used to live
// in main.js (the one-pager). The multi-page site does not ship main.js, so this
// file provides the same bridge for the dedicated admin page and then boots the
// panel. Kept deliberately small and CSP-safe (external script, no inline code).
(() => {
  'use strict';

  const SITEKEY = '0x4AAAAAAEClxf8-TRYoLcZl';

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
    try { data = await res.json(); }
    catch { throw new Error(`Server returned ${res.status} and no JSON. Is the API deployed?`); }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  const getToken = () => localStorage.getItem('cms_token');
  const setToken = (t) => { if (t) localStorage.setItem('cms_token', t); else localStorage.removeItem('cms_token'); };

  let cmsConfig = { whatsapp: '', telegram: '', admin_email: '' };
  let galleryItems = [];

  function escapeHTML(str) {
    return str ? str.replace(/[&<>'"]/g,
      (tag) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    ) : '';
  }
  const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

  // The authenticated route carries admin_email; fall back to the public route
  // so the Settings form still populates before a login.
  async function loadCMSConfig() {
    try {
      cmsConfig = getToken() ? await api('GET', '/api/config') : await api('GET', '/api/config/public');
      return true;
    } catch {
      cmsConfig = { whatsapp: '', telegram: '', admin_email: '' };
      return false;
    }
  }

  async function loadGallery() {
    try { galleryItems = await api('GET', '/api/gallery'); } catch { galleryItems = []; }
  }

  // Populates the Edit-Copy form fields. There is no public page here to hydrate.
  async function loadSiteContent() {
    try {
      const data = await api('GET', '/api/content');
      if (!data) return;
      document.querySelectorAll('#siteContentForm [data-key]').forEach((input) => {
        const key = input.dataset.key;
        if (data[key] !== undefined && data[key] !== null) input.value = data[key];
      });
    } catch (e) {
      console.error('Could not load site content:', e);
    }
  }

  // No public gallery grid on this page; the admin list is rendered by cms.js.
  function renderGallery() {}

  // — Turnstile (login / forgot / reset), same sitekey + actions as the one-pager —
  const turnstileIds = { login: null, forgot: null, reset: null };
  function mountTurnstile() {
    if (!window.turnstile || typeof window.turnstile.render !== 'function') { setTimeout(mountTurnstile, 50); return; }
    const mount = (elId, key, action) => {
      const el = document.getElementById(elId);
      if (!el || turnstileIds[key] !== null) return;
      turnstileIds[key] = window.turnstile.render(el, { sitekey: SITEKEY, action });
    };
    mount('turnstileLogin', 'login', 'login');
    mount('turnstileForgot', 'forgot', 'forgot-password');
    mount('turnstileReset', 'reset', 'reset-password');
  }
  mountTurnstile();

  const turnstileToken = (key) =>
    (window.turnstile && turnstileIds[key] !== null) ? (window.turnstile.getResponse(turnstileIds[key]) || '') : '';
  const turnstileReset = (key) => {
    if (window.turnstile && turnstileIds[key] !== null) window.turnstile.reset(turnstileIds[key]);
  };

  // Boot the panel once cms.js has defined window.initCMS.
  const s = document.createElement('script');
  s.src = '/js/cms.js';
  s.onload = () => {
    if (typeof window.initCMS !== 'function') {
      const pinError = document.getElementById('pinError');
      if (pinError) { pinError.style.display = 'block'; pinError.textContent = 'The admin panel failed to load.'; }
      return;
    }
    const cms = window.initCMS({
      api, getToken, setToken,
      loadCMSConfig, loadGallery, loadSiteContent, renderGallery,
      escapeHTML, capitalize,
      turnstileToken, turnstileReset,
      get cmsConfig() { return cmsConfig; },
      get galleryItems() { return galleryItems; },
      set galleryItems(v) { galleryItems = v; }
    });
    cms.open();
  };
  s.onerror = () => {
    const pinError = document.getElementById('pinError');
    if (pinError) { pinError.style.display = 'block'; pinError.textContent = 'The admin panel could not be loaded.'; }
  };
  document.head.appendChild(s);
})();
