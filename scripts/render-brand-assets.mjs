#!/usr/bin/env node
// Renders the raster brand assets from the one mark definition
// (content/brand.mjs) and the site facts (content/site.mjs):
//
//   public/assets/og-card.png           1200×630  share card (og:image)
//   public/assets/apple-touch-icon.png   180×180  phone home-screen icon
//   public/assets/logo-512.png           512×512  structured-data logo
//
//   node scripts/render-brand-assets.mjs     (npm run build:brand)
//
// Uses the Playwright Chromium the e2e suite already installs. Needs network
// for the Outfit webfont; it waits for fonts before every capture. Rerun when
// the mark, the name or the credentials change, and commit the PNGs.
//
// The share card replaces assets/clinic.jpg, which appeared AI-generated and
// was captioned as the practice's own consultation suite (PRODUCT.md, Evidence
// on Hand): a mark and plain facts make no claim about rooms or people.
import { chromium } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../content/site.mjs';
import { MARK_PATHS } from '../content/brand.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');
const C = { paper: '#F7F3EA', nil: '#23336B', deep: '#1A2756', onNil: '#C9D1EA', haldi: '#E0A526' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// The headline credential: FCPS if listed, else the last (highest) one, so a
// renamed or reordered credential list changes the card instead of crashing it.
const topCredential = SITE.credentials.find((c) => c.startsWith('FCPS')) ?? SITE.credentials.at(-1) ?? '';
const svg = (stroke, weight, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 100 100"><g fill="none" stroke="${stroke}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round">${MARK_PATHS.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;

const page = (w, h, css, body) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:Outfit,sans-serif;-webkit-font-smoothing:antialiased}${css}</style></head><body>${body}</body></html>`;

const ogCard = page(1200, 630, `
  body { background: ${C.deep}; color: #fff; display: grid; grid-template-columns: 400px 1fr; align-items: center; }
  body::before { content: ""; position: absolute; inset: 0;
    background: radial-gradient(70% 90% at 18% 30%, ${C.nil}, rgba(35,51,107,0) 70%); }
  .m { position: relative; width: 400px; height: 400px; margin-left: 48px; }
  .t { position: relative; padding: 0 84px 0 40px; }
  .n { font-size: 72px; font-weight: 600; line-height: 1.02; letter-spacing: -.02em; }
  .r { margin-top: 18px; font-size: 27px; color: ${C.onNil}; }
  .rule { width: 88px; height: 3px; background: ${C.haldi}; margin: 34px 0 30px; border-radius: 2px; }
  .p { font-size: 30px; line-height: 1.35; font-weight: 500; }
  .d { margin-top: 30px; font-size: 21px; letter-spacing: .14em; text-transform: uppercase; color: ${C.onNil}; }`,
  `<div class="m">${svg('#fff', 4)}</div>
   <div class="t"><p class="n">${esc(SITE.name)}</p>
     <p class="r">Dermatologist in Dhaka${topCredential ? ` · ${esc(topCredential)}` : ''}</p>
     <div class="rule"></div>
     <p class="p">Diagnosis first. Published prices.<br>A written plan at every visit.</p>
     <p class="d">${SITE.domain.replace(/^https?:\/\//, '')}</p></div>`);

const touchIcon = page(180, 180, `body { background: ${C.deep}; display: grid; place-items: center; }
  svg { width: 150px; height: 150px; }`, svg(C.paper, 6));

const logo512 = page(512, 512, `body { background: transparent; display: grid; place-items: center; }
  svg { width: 512px; height: 512px; }`, svg(C.nil, 4));

const browser = await chromium.launch();
try {
  for (const [file, html, w, h, transparent] of [
    ['og-card.png', ogCard, 1200, 630, false],
    ['apple-touch-icon.png', touchIcon, 180, 180, false],
    ['logo-512.png', logo512, 512, 512, true],
  ]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: join(OUT, file), omitBackground: transparent });
    await p.close();
    console.log(`wrote public/assets/${file}`);
  }
} finally {
  await browser.close();
}
