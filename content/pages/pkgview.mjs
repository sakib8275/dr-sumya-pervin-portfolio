// Package detail view — one native <dialog> per page plus a <template> per
// package. Cards carry <button data-pkg-open="key">; public/js/site.js clones
// the matching template into the dialog and calls showModal(), which gives
// focus containment, Esc and a backdrop for free. Built at build time from
// content/prices.mjs PACKAGES, so the view never assembles markup from data
// at runtime (CSP-safe, nothing to escape).
import { href, SITE } from '../site.mjs';
import { PACKAGES, PLAN_TERMS, WHO, FOLLOW_UPS } from '../prices.mjs';

const vatPct = Math.round(SITE.vatRate * 100);
const withVat = (taka) => '৳' + Math.round(Number(taka.replace(/[^0-9]/g, '')) * (1 + SITE.vatRate)).toLocaleString('en-IN');
const CLOSE = '<svg class="ico-x" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9m0-9-9 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const who = (keys) => keys.map((k) => `<span class="pkg-who"><span class="who who-${k}">${WHO[k].label}</span> ${WHO[k].text}</span>`).join('');
const row = ([l, v]) => `<li><span>${l}</span><b>${v === '৳0' ? 'Free' : v}</b></li>`;

function consult(p) {
  return `
    <h2 class="pkg-title" id="pkgTitle" tabindex="-1">${p.name}</h2>
    <p class="pkg-meta"><span>${p.duration}</span>${who(p.who)}</p>
    ${p.band !== 'Standard' && p.band !== 'Premium' ? `<p class="pkg-band">${p.band}</p>` : ''}
    <div class="pkg-price"><b>${p.price}</b><span>${withVat(p.price)} with ${vatPct}% VAT</span></div>
    <h3>What you get</h3>
    <ul class="ticks pkg-list">${p.get.map((g) => `<li>${g}</li>`).join('')}</ul>
    ${p.note ? `<p class="pkg-note">${p.note}</p>` : ''}
    <h3>After this visit</h3>
    <ul class="pkg-rows">${FOLLOW_UPS.slice(0, 3).map(([price, label]) => row([label, price])).join('')}</ul>
    <p class="pkg-fine">Centre price, from opening in 2027. At Alliance and DCIMCH today, fees follow each hospital’s own tariff. No package is sold at a first visit.</p>
    <div class="pkg-actions">
      <a class="btn btn-ink" href="${href('/book/')}?tier=${encodeURIComponent(p.tier)}">Book this visit</a>
      <button type="button" class="btn btn-ghost" data-pkg-close>Close</button>
    </div>`;
}

function plan(p) {
  return `
    <h2 class="pkg-title" id="pkgTitle" tabindex="-1">${p.name}</h2>
    <p class="pkg-meta"><span>${p.duration}</span>${who(p.who)}</p>
    <p class="pkg-band">${p.band}</p>
    <div class="pkg-price"><b>${p.price}</b><span>${withVat(p.price)} with ${vatPct}% VAT</span></div>
    <h3>What’s inside, and what it costs separately</h3>
    <ul class="pkg-rows">${p.value.map(row).join('')}</ul>
    <p class="pkg-save"><span>${p.payg}</span><b>${p.save}</b></p>
    <h3>Who it’s for</h3>
    <p class="pkg-text">${PLAN_TERMS.conditions}</p>
    <p class="pkg-note">${PLAN_TERMS.offered}</p>
    <p class="pkg-fine">${PLAN_TERMS.cancel} Centre price, from opening in 2027.</p>
    <div class="pkg-actions">
      <a class="btn btn-ink" href="${href('/book/')}">Book a consultation first</a>
      <button type="button" class="btn btn-ghost" data-pkg-close>Close</button>
    </div>`;
}

// The card trigger: stretched over its card by .card-link::after.
export function pkgButton(key, cls) {
  return `<button type="button" class="btn ${cls} card-link" data-pkg-open="${key}" aria-haspopup="dialog">See what’s included</button>`;
}

export function pkgViews(keys) {
  const templates = keys.map((k) => {
    const p = PACKAGES[k];
    return `<template id="pkg-${k}">${p.kind === 'plan' ? plan(p) : consult(p)}</template>`;
  }).join('\n');
  return `
<dialog class="pkg-view" id="pkgView" aria-labelledby="pkgTitle">
  <div class="pkg-in">
    <button type="button" class="pkg-close" data-pkg-close aria-label="Close">${CLOSE}</button>
    <div class="pkg-body" id="pkgBody"></div>
  </div>
</dialog>
${templates}`;
}
