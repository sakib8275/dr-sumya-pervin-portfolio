#!/usr/bin/env node
// Static page builder for the multi-page site (Change Request 2026-10-02).
//
//   node scripts/build-pages.mjs     (npm run build:site)
//
// Reads content/ (site config, sitemap, price data, bespoke page bodies) and
// writes public/**/index.html — the site root, after the cutover flipped BASE
// to '' and moved the build off the /new/ staging prefix.
//
// No dependencies: node built-ins only. CSP-safe output: zero inline event
// handlers, one external stylesheet, one deferred script.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, BASE, NAV, FOOTER, href } from '../content/site.mjs';
import { PAGES } from '../content/sitemap.mjs';
import home from '../content/pages/home.mjs';
import prices from '../content/pages/prices.mjs';
import about from '../content/pages/about.mjs';
import ethics from '../content/pages/ethics.mjs';
import article from '../content/pages/article.mjs';
import { moleCheck, skinType, prep } from '../content/pages/tools.mjs';
import book from '../content/pages/book.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const BODIES = { home, prices, about, ethics, moleCheck, skinType, prep, book };

// The build now writes into the site root alongside hand-maintained assets
// (css/, js/, assets/, admin/, favicon, robots). Remove only what this script
// owns — each page directory, the root index and the sitemap — plus the
// retired /new/ staging tree. Never rm OUT itself.
async function clean() {
  await rm(join(OUT, 'index.html'), { force: true });
  await rm(join(OUT, 'sitemap.xml'), { force: true });
  for (const page of PAGES) {
    if (page.path !== '/') await rm(join(OUT, page.path), { recursive: true, force: true });
  }
  await rm(join(OUT, 'new'), { recursive: true, force: true });
}

// A page renders its bespoke body if named, else the generic article renderer
// when Phase 3 content exists for its path, else the honest stub.
function bodyFor(page) {
  if (BODIES[page.body]) return BODIES[page.body]();
  return article(page) || stubBody(page);
}

const esc = (s) => s.replace(/&(?!(amp|lt|gt|quot|apos|#\d+);)/g, '&amp;');

function megaMenu(item) {
  if (!item.menu) return '';
  const cols = item.menu.cols
    .map((c) => `<div><p class="mega-head">${c.head}</p>${c.links
      .map(([l, h]) => `<a href="${href(h)}">${l}</a>`).join('')}</div>`)
    .join('');
  const feature = item.menu.feature
    ? `<a class="mega-feature" href="${href(item.menu.feature[1])}"><b>${item.menu.feature[0]}</b><span>${item.menu.feature[2]}</span></a>`
    : '';
  const foot = item.menu.foot
    ? `<a class="mega-foot" href="${href(item.menu.foot[1])}">${item.menu.foot[0]} →</a>`
    : '';
  return `<div class="mega" id="mega-${item.label.replace(/[^A-Za-z]/g, '')}">${cols}${feature}${foot}</div>`;
}

function nav() {
  const items = NAV.map((item) =>
    Array.isArray(item)
      ? `<a href="${href(item[1])}">${item[0]}</a>`
      : `<div class="nav-drop">
           <button type="button" class="nav-drop-btn" aria-expanded="false" aria-controls="mega-${item.label.replace(/[^A-Za-z]/g, '')}">${item.label} ▾</button>
           ${megaMenu(item)}
         </div>`
  ).join('');
  return `
<div class="u-bar"><div class="wrap u-bar-in">
  <span class="u-bar-full">${SITE.centre.name} · ${SITE.centre.address} · <b>${SITE.centre.opening}</b> — consulting now in Shyamoli</span>
  <span class="u-bar-full"><b>Call ${SITE.phone}</b> · WhatsApp · ${SITE.bmdc}</span>
  <span class="u-bar-m"><b>${SITE.centre.opening}</b> — consulting now in Shyamoli</span>
</div></div>
<header class="s-nav"><div class="wrap s-nav-in">
  <a class="logo" href="${href('/')}"><span class="logo-n">${SITE.name}</span><span class="logo-s">${SITE.strapline}</span></a>
  <nav class="s-menu" aria-label="Main">${items}</nav>
  <a class="btn btn-ink btn-nav" href="${href('/book/')}">Book a consultation</a>
  <button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="drawer">Menu</button>
</div></header>`;
}

// The drawer is the ONLY nav ≤820px, so it must carry every top destination:
// the docx pathway map sends most mobile visitors to Prices and Book first,
// and About is a main-nav item. Groups mirror the footer columns.
function drawer() {
  const group = (links) => links.map(([l, h]) => `<a href="${href(h)}">${l}</a>`).join('');
  return `
<div class="scrim" id="scrim"></div>
<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Site menu">
  <div class="drawer-head"><span class="logo-n">${SITE.name}</span>
    <button type="button" id="drawerClose" aria-label="Close menu">✕</button></div>
  <nav class="drawer-links" aria-label="Site menu">
    <p class="drawer-cat">Care</p>${group(FOOTER.care.slice(0, 3))}
    <a href="${href('/conditions/sexual-health/')}">Confidential sexual health</a>
    <p class="drawer-cat">Visit</p><a href="${href('/prices/')}">Prices</a>${group(FOOTER.visit.filter(([l]) => l !== 'Book a consultation'))}
    <p class="drawer-cat">About &amp; trust</p><a href="${href('/about/')}">About Dr. Sumya</a>${group(FOOTER.trust)}
  </nav>
  <a class="btn btn-ink drawer-book" href="${href('/book/')}">Book a consultation</a>
</div>`;
}

function footer() {
  const col = (h, links) => `<div><h4>${h}</h4>${links.map(([l, p]) => `<a href="${href(p)}">${l}</a>`).join('')}</div>`;
  return `
<footer class="foot"><div class="wrap">
  <div class="foot-cols">
    <div><span class="logo-n">${SITE.name}</span><span class="logo-s">${SITE.centre.name}</span>
      <p>${SITE.credentials.join(' · ')}<br>${SITE.bmdc}</p></div>
    ${col('Care', FOOTER.care)}${col('Visit', FOOTER.visit)}${col('Trust', FOOTER.trust)}
  </div>
  <div class="foot-legal"><span>Information on this site is educational and does not replace an examination.</span><span>Prices reviewed: [date]</span></div>
</div></footer>
<div class="m-sticky"><a href="tel:${SITE.phone.replace(/X/g, '0')}">Call</a><a href="https://wa.me/${SITE.whatsapp}" rel="noopener">WhatsApp</a><a class="m-book" href="${href('/book/')}">Book</a></div>`;
}

function stubBody(page) {
  const hub = page.path.startsWith('/conditions/') ? ['Medical dermatology', '/medical-dermatology/']
    : page.path.startsWith('/concerns/') || page.path.startsWith('/treatments/') ? ['Aesthetic &amp; laser', '/aesthetic-and-laser/']
    : null;
  return `
<section class="pg-hero"><div class="wrap">
  <p class="crumb"><a href="${href('/')}">Home</a> / ${esc(page.title.split('|')[0].trim().replace('Dr. Sumya Pervin, Dermatologist in Dhaka', '').trim() || 'Page')}</p>
  <h1>${esc(page.h1 || page.title.split('|')[0].trim())}</h1>
  <p class="lede">${page.desc}</p>
</div></section>
<section class="s-sec"><div class="wrap">
  <div class="stub">
    <p class="stub-badge">In preparation</p>
    <p>This page is part of the new site and fills in the next phase${page.gate ? ' — it publishes with its gate (' + page.gate + ')' : ''}. Nothing here is lost: the full copy exists in the content source and renders through the same pipeline as the pages already built.</p>
    <div class="h-ctas">
      <a class="btn btn-ink" href="${href('/book/')}">Book a consultation</a>
      <a class="btn btn-ghost" href="${href('/prices/')}">See prices</a>
    </div>
  </div>
  ${hub ? `<p class="lede" style="margin-top:34px">Browse the <a class="tlink" href="${href(hub[1])}">${hub[0]}</a> hub meanwhile.</p>` : ''}
</div></section>`;
}

function head(page) {
  const url = `${SITE.domain}${BASE === '' ? '' : BASE}${page.path === '/' && BASE === '' ? '/' : page.path}`;
  const isHome = page.path === '/';
  const ld = isHome || page.path === '/about/'
    ? {
        '@context': 'https://schema.org', '@type': 'Physician', name: SITE.name,
        medicalSpecialty: 'Dermatologic', url: SITE.domain,
        credential: SITE.credentials.join(', '), identifier: SITE.bmdc,
      }
    : { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, url };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
<meta name="description" content="${page.desc}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.domain}/assets/clinic.jpg">
<meta property="og:image:alt" content="The consultation suite at Dr. Sumya Pervin's dermatology practice">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script src="/js/site.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main-content">Skip to content</a>
${nav()}
<main id="main-content" tabindex="-1">
${bodyFor(page)}
</main>
${footer()}
${drawer()}
</body>
</html>`;
}

async function main() {
  await clean();
  let count = 0;
  for (const page of PAGES) {
    const file = page.path === '/' ? join(OUT, 'index.html') : join(OUT, page.path, 'index.html');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, head(page));
    count += 1;
  }
  const today = new Date().toISOString().slice(0, 10);
  const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map(
    (p) => `  <url><loc>${SITE.domain}${BASE}${p.path}</loc><lastmod>${today}</lastmod></url>`
  ).join('\n')}\n</urlset>\n`;
  await writeFile(join(OUT, 'sitemap.xml'), sm);
  console.log(`built ${count} pages + sitemap at public/ root (BASE=${JSON.stringify(BASE)})`);
}

main();
