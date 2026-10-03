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
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, BASE, NAV, FOOTER, HUB_LABEL, CHAMBERS_NOW, href } from '../content/site.mjs';
import { PAGES } from '../content/sitemap.mjs';
import { mark } from '../content/brand.mjs';
import home from '../content/pages/home.mjs';
import prices from '../content/pages/prices.mjs';
import about from '../content/pages/about.mjs';
import ethics from '../content/pages/ethics.mjs';
import article from '../content/pages/article.mjs';
import { moleCheck, skinType, skinCheck, prep } from '../content/pages/tools.mjs';
import book from '../content/pages/book.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const BODIES = { home, prices, about, ethics, moleCheck, skinType, skinCheck, prep, book };

// The build now writes into the site root alongside hand-maintained assets
// (css/, js/, assets/, admin/, favicon, robots). Remove only what this script
// owns — each page directory, the root index and the sitemap — plus the
// retired /new/ staging tree. Never rm OUT itself.
async function clean() {
  await rm(join(OUT, 'index.html'), { force: true });
  await rm(join(OUT, '404.html'), { force: true });
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
  return `<div class="mega" id="${megaId(item)}">${cols}${feature}${foot}</div>`;
}

// Drawn icons (one 1.6px stroke family) instead of ▾ / ✕ text glyphs.
const CHEV = '<svg class="ico-chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CLOSE = '<svg class="ico-x" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9m0-9-9 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const megaId = (item) => `mega-${item.label.replace(/[^A-Za-z]/g, '')}`;

function nav() {
  const items = NAV.map((item) =>
    Array.isArray(item)
      ? `<a href="${href(item[1])}">${item[0]}</a>`
      : `<div class="nav-drop">
           <button type="button" class="nav-drop-btn" aria-expanded="false" aria-controls="${megaId(item)}">${item.label}${CHEV}</button>
           ${megaMenu(item)}
         </div>`
  ).join('');
  return `
<div class="u-bar"><div class="wrap u-bar-in">
  <span class="u-bar-full">Consulting now at <b>Alliance Hospital</b> and <b>DCIMCH</b>, Shyamoli · ${SITE.centre.name}, ${SITE.centre.address.replace(', Dhaka', '')}: ${SITE.centre.opening.toLowerCase()}</span>
  <span class="u-bar-full u-bar-links"><a href="tel:${SITE.phoneTel}"><b>Call ${SITE.phone}</b></a><a href="https://wa.me/${SITE.whatsapp}" rel="noopener">WhatsApp</a><a href="${href('/contact/')}">Directions</a></span>
  <span class="u-bar-m"><b>Consulting now in Shyamoli</b> · Centre ${SITE.centre.opening.toLowerCase()}</span>
</div></div>
<header class="s-nav"><div class="wrap s-nav-in">
  <a class="logo" href="${href('/')}">${mark('logo-mark', 5)}<span class="logo-t"><span class="logo-n">${SITE.name}</span><span class="logo-s">${SITE.strapline}</span></span></a>
  <nav class="s-menu" aria-label="Main">${items}</nav>
  <a class="btn btn-ink btn-nav" href="${href('/book/')}">Book a consultation</a>
  <button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="drawer">Menu</button>
</div></header>`;
}

// The drawer is the ONLY nav below the desktop breakpoint, so it mirrors the
// mega menus: each clinical group expands (<details>, no script) to its hub and
// every deep link, then flat Visit / Learn / About rows. The docx pathway map
// sends most mobile visitors to Prices and Book first; both stay one tap away.
function drawer() {
  const group = (links) => links.map(([l, h]) => `<a href="${href(h)}">${l}</a>`).join('');
  const expandable = NAV.filter((item) => !Array.isArray(item) && HUB_LABEL[item.label]).map((item) => {
    const deep = item.menu.cols.flatMap((c) => c.links);
    const extra = [item.menu.feature && [item.menu.feature[0], item.menu.feature[1]], item.menu.foot].filter(Boolean);
    return `<details class="drawer-grp"><summary>${item.label}${CHEV}</summary>
      <div class="drawer-sub"><a class="drawer-hub" href="${href(item.href)}">${HUB_LABEL[item.label]}</a>${group([...deep, ...extra])}</div></details>`;
  }).join('');
  return `
<div class="scrim" id="scrim"></div>
<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Site menu">
  <div class="drawer-head"><span class="logo logo-sm">${mark('logo-mark', 6)}<span class="logo-n">${SITE.name}</span></span>
    <button type="button" id="drawerClose" aria-label="Close menu">${CLOSE}</button></div>
  <nav class="drawer-links" aria-label="Site menu">
    <p class="drawer-cat">Care</p>${expandable}
    <p class="drawer-cat">Visit</p><a href="${href('/prices/')}">Prices</a>${group(FOOTER.visit.filter(([l]) => l !== 'Book a consultation'))}
    <p class="drawer-cat">Learn</p>${group(FOOTER.learn)}
    <p class="drawer-cat">About &amp; trust</p><a href="${href('/about/')}">About Dr. Sumya</a>${group(FOOTER.trust)}
  </nav>
  <a class="btn btn-ink drawer-book" href="${href('/book/')}">Book a consultation</a>
</div>`;
}

function footer() {
  const col = (h, links) => `<div><h2 class="foot-h">${h}</h2>${links.map(([l, p]) => `<a href="${href(p)}">${l}</a>`).join('')}</div>`;
  return `
<footer class="foot"><div class="wrap">
  <div class="foot-cols">
    <div class="foot-brand">${mark('foot-mark', 4.5)}<span class="logo-n">${SITE.name}</span><span class="logo-s">${SITE.centre.name}</span>
      <p>${SITE.credentials.join(' · ')}<br>${SITE.bmdc}</p>
      <p class="foot-contact"><a href="tel:${SITE.phoneTel}">Call ${SITE.phone}</a><a href="https://wa.me/${SITE.whatsapp}" rel="noopener">WhatsApp</a><a href="mailto:${SITE.email}">${SITE.email}</a></p>
      <p class="foot-hours">${CHAMBERS_NOW.map((c) => `<span><b>${c.short}</b> · ${c.daysShort}, <i>${c.hours}</i></span>`).join('')}</p></div>
    ${col('Care', FOOTER.care)}${col('Visit', FOOTER.visit)}${col('Learn', FOOTER.learn)}${col('Trust', FOOTER.trust)}
  </div>
  <div class="foot-legal"><span>Information on this site is educational and does not replace an examination.</span><span>Prices reviewed: ${SITE.pricesReviewed}</span></div>
</div></footer>
<div class="m-sticky"><a href="tel:${SITE.phoneTel}">Call</a><a href="https://wa.me/${SITE.whatsapp}" rel="noopener">WhatsApp</a><a class="m-book" href="${href('/book/')}">Book</a></div>`;
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
        logo: `${SITE.domain}/assets/logo-512.png`, image: `${SITE.domain}/assets/og-card.png`,
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
<meta property="og:image" content="${SITE.domain}/assets/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Signature SP mark of Dr. Sumya Pervin, dermatologist in Dhaka">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#1A2756">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script src="/js/site.js" type="module"></script>
</head>
<body data-page="${page.path}" data-wa="https://wa.me/${SITE.whatsapp}">
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

// The 404 is part of the site, not the one-pager: same shell, nav and footer so
// a lost visitor can still get anywhere. noindex, and no canonical (a 404 has no
// canonical URL). Pages serves this for any unmatched route.
function notFoundPage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page not found | ${SITE.name}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
<script src="/js/site.js" type="module"></script>
</head>
<body data-wa="https://wa.me/${SITE.whatsapp}">
<a class="skip-link" href="#main-content">Skip to content</a>
${nav()}
<main id="main-content" tabindex="-1">
<section class="pg-hero"><div class="wrap">
  <p class="crumb"><a href="${href('/')}">Home</a> / Not found</p>
  <h1>That page isn’t here</h1>
  <p class="lede">The link may be old, or the page may have moved. Here’s where most people go next.</p>
</div></section>
<section class="s-sec"><div class="wrap">
  <div class="h-ctas">
    <a class="btn btn-ink" href="${href('/book/')}">Book a consultation</a>
    <a class="btn btn-ghost" href="${href('/prices/')}">See prices</a>
    <a class="btn btn-ghost" href="${href('/contact/')}">Contact &amp; directions</a>
  </div>
</div></section>
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
  await writeFile(join(OUT, '404.html'), notFoundPage());
  const today = new Date().toISOString().slice(0, 10);
  const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map(
    (p) => `  <url><loc>${SITE.domain}${BASE}${p.path}</loc><lastmod>${today}</lastmod></url>`
  ).join('\n')}\n</urlset>\n`;
  await writeFile(join(OUT, 'sitemap.xml'), sm);
  // The browser adapter for the schedule module: the source is pure ESM with
  // no worker-only imports, so the site loads the very same file the booking
  // API validates with. One interface, three adapters (worker, build,
  // browser); tests/pages.test.mjs pins the copy verbatim.
  const scheduleSrc = await readFile(join(ROOT, 'functions', 'lib', 'schedule.js'), 'utf8');
  await writeFile(join(OUT, 'js', 'schedule.mjs'),
    `// GENERATED by npm run build:site — do not edit. Source: functions/lib/schedule.js\n${scheduleSrc}`);
  console.log(`built ${count} pages + sitemap at public/ root (BASE=${JSON.stringify(BASE)})`);
}

main();
