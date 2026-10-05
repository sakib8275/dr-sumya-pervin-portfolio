// Multi-page build guards (Change Request 2026-10-02, Phase 1).
//
// The one-pager suites pin the one-pager; these pin the new site's build
// contract: every sitemap page exists on disk, every internal link resolves
// (the interlinking rulebook made executable), SEO is unique and complete,
// the token block has not drifted between site.css and style.css, no inline handler has
// crept into generated markup (F9's rule), and the load-bearing docx price
// figures are present verbatim (docx-is-truth, made executable).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot } from './helpers/harness.mjs';
import { PAGES } from '../content/sitemap.mjs';
import { BASE, SITE } from '../content/site.mjs';
import { JOURNEY, REEL } from '../content/pages/home.mjs';
import { CONDITIONS } from '../content/sitemap.mjs';

const OUT = join(repoRoot, 'public');

test('the site builds from content', () => {
  const out = execFileSync('node', [join(repoRoot, 'scripts', 'build-pages.mjs')], { encoding: 'utf8' });
  assert.match(out, /built \d+ pages/);
});

async function readPage(page) {
  const file = page.path === '/' ? join(OUT, 'index.html') : join(OUT, page.path, 'index.html');
  return readFile(file, 'utf8');
}

test('every sitemap page exists with complete, unique SEO', async () => {
  const titles = new Set();
  const descs = new Set();
  for (const page of PAGES) {
    const html = await readPage(page);
    assert.match(html, new RegExp(`<title>${page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`), `title missing on ${page.path}`);
    assert.ok(html.includes(`name="description"`), `description missing on ${page.path}`);
    assert.ok(html.includes('rel="canonical"'), `canonical missing on ${page.path}`);
    assert.ok(html.includes('application/ld+json'), `JSON-LD missing on ${page.path}`);
    assert.ok(html.includes('og:image'), `OG incomplete on ${page.path}`);
    titles.add(page.title);
    descs.add(page.desc);
  }
  assert.equal(titles.size, PAGES.length, 'duplicate page titles');
  assert.equal(descs.size, PAGES.length, 'duplicate meta descriptions');
});

test('every internal link in the built pages resolves', async () => {
  const built = new Set(PAGES.map((p) => BASE + p.path));
  const assetOk = async (target) => {
    try { await access(join(repoRoot, 'public', target), constants.R_OK); return true; } catch { return false; }
  };
  const external = (href) => /^(https?:|tel:|mailto:|#)/.test(href) || href.includes('wa.me');
  for (const page of PAGES) {
    const html = await readPage(page);
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = m[1];
      if (external(url) || url === '/') continue;
      if (url.startsWith('/')) {
        const clean = url.split('#')[0].split('?')[0];
        if (built.has(clean)) continue;
        if (/\.(css|js|svg|png|jpg|webp|ico|xml)$/.test(clean)) {
          assert.ok(await assetOk(clean), `${page.path}: asset link ${url} does not exist in public/`);
          continue;
        }
        assert.fail(`${page.path}: internal link ${url} is not a built page or existing asset`);
      } else if (url.endsWith('.html')) {
        assert.fail(`${page.path}: relative file link ${url} — the build uses clean directory URLs`);
      }
    }
  }
});

test('the Nil & Haldi token block has not drifted between the two stylesheets', async () => {
  const grab = (css) => {
    const m = css.match(/:root\s*\{([\s\S]*?)\}/);
    assert.ok(m, 'no :root block');
    return m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  };
  const onePager = grab(await readFile(join(repoRoot, 'public', 'css', 'style.css'), 'utf8'));
  const multi = grab(await readFile(join(repoRoot, 'public', 'css', 'site.css'), 'utf8'));
  assert.equal(multi, onePager, 'style.css :root must stay a verbatim copy of site.css :root — the identity is one token set');
});

test('no inline event handlers in generated pages', async () => {
  for (const page of PAGES) {
    const html = await readPage(page);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `${page.path}: inline handler — F9's CSP drops it silently`);
  }
});

test('load-bearing docx price figures publish verbatim at the opening gate', async () => {
  const html = await readFile(join(OUT, 'prices', 'index.html'), 'utf8');
  // The live 'opening' gate publishes consultations, care plans, tests and
  // policies only. If any of these change, content/prices.mjs changed — make
  // sure that came from the docx, not from a typo.
  for (const figure of ['৳2,000', '৳3,500', '৳6,000', '৳1,500', '৳1,200', '৳6,500', '৳12,500']) {
    assert.ok(html.includes(figure), `figure ${figure} missing from the built Prices page`);
  }
});

test('prices not yet cleared are withheld at the live gate', async () => {
  const prices = await readFile(join(OUT, 'prices', 'index.html'), 'utf8');
  // Surgery, aesthetic, laser and bridal sections publish at LICENCE/LASER
  // (docx Part 9) and must not appear at the opening gate.
  for (const id of ['surgery', 'aesthetic', 'laser', 'bridal']) {
    assert.ok(!prices.includes(`id="${id}"`), `gated section ${id} leaked onto the Prices page`);
  }
  // Figures unique to the gated sections (৳15,000 also appears as an EMI
  // threshold in the visible policies, so it is not a safe sentinel).
  for (const figure of ['৳25,000', '৳45,000', '৳70,000', '৳1,75,000', '৳26,000', '৳32,000', '৳55,000']) {
    assert.ok(!prices.includes(figure), `gated figure ${figure} leaked onto the Prices page`);
  }
  // The estimator is laser-only data and must not render its controls either.
  assert.ok(!prices.includes('id="estConcern"'), 'the laser estimator leaked at a non-laser gate');
  // Gated pages keep their clinical copy but must not publish a positive price.
  for (const path of ['/treatments/laser-hair-removal/', '/treatments/excision-surgery/', '/bridal-and-groom/']) {
    const html = await readFile(join(OUT, path, 'index.html'), 'utf8');
    assert.ok(!/৳[1-9]/.test(html), `${path} still publishes a price at the live gate`);
  }
});

test('the linking rulebook holds (docx §3.4)', async () => {
  const has = (html, p) => html.includes(`href="${p}"`);
  const hasPrefix = (html, p) => new RegExp(`href="${p}`).test(html);
  const SURGICAL = ['skin-biopsy', 'cryotherapy', 'excision-surgery', 'electrosurgery', 'intralesional-injection', 'skin-cancer-treatment'];
  for (const page of PAGES) {
    const html = await readPage(page);
    if (/^\/conditions\//.test(page.path)) {
      assert.ok(has(html, '/consultation-prep/'), `${page.path}: no /consultation-prep/ link`);
      assert.ok(hasPrefix(html, '/learn/'), `${page.path}: no Learn link`);
    } else if (/^\/concerns\//.test(page.path) && page.path !== '/concerns/body-contouring/') {
      // The rulebook asks for 2–3 treatment links; where only one treatment is
      // clinically relevant (e.g. unwanted hair → laser) one is the honest set.
      assert.ok((html.match(/href="\/treatments\//g) || []).length >= 1, `${page.path}: no treatment link`);
    } else if (/^\/treatments\//.test(page.path) && SURGICAL.includes(page.path.split('/')[2])) {
      assert.ok(has(html, '/your-procedure/'), `${page.path}: no /your-procedure/ link`);
    } else if (/^\/learn\/.+\//.test(page.path)) {
      assert.ok(hasPrefix(html, '/conditions/'), `${page.path}: no primary condition link`);
      assert.ok(has(html, '/book/'), `${page.path}: no Book link`);
      assert.ok(hasPrefix(html, '/tools/') || has(html, '/consultation-prep/'), `${page.path}: no tool link`);
    }
  }
});

test('every clinical page carries a byline, review date and references (docx §1.4)', async () => {
  const clinical = PAGES.filter((p) => /^\/(conditions|concerns|treatments)\//.test(p.path) || /^\/learn\/.+\//.test(p.path));
  assert.ok(clinical.length >= 39, `expected the full set of clinical pages, found ${clinical.length}`);
  for (const page of clinical) {
    const html = await readPage(page);
    assert.ok(html.includes('Written and reviewed by Dr. Sumya Pervin'), `${page.path}: byline missing`);
    assert.ok(html.includes(`Last reviewed ${SITE.reviewed}`), `${page.path}: review date missing`);
    assert.ok(html.includes('<div class="refs">'), `${page.path}: references missing`);
  }
});

test('no internal publish-gate jargon shows to patients', async () => {
  for (const path of ['/aesthetic-and-laser/', '/concerns/acne-scars/', '/concerns/redness-visible-vessels/', '/concerns/body-contouring/']) {
    const html = await readPage({ path });
    for (const jargon of ['LICENCE', 'LASER', 'YEAR 2', 'NOT OFFERED']) {
      assert.ok(!html.includes(`>${jargon}<`), `${path}: internal tag ${jargon} shown to patients`);
    }
  }
});

test('no bracketed owner placeholder ships', async () => {
  for (const page of PAGES) {
    const html = await readPage(page);
    assert.ok(!/\[(LANDMARK|details|DATE|confirm|owner|TBC)/i.test(html), `${page.path}: bracketed owner placeholder`);
  }
});

test('no publish-gate marker leaks into the built pages', async () => {
  for (const page of PAGES) {
    const html = await readPage(page);
    assert.ok(!html.includes('[['), `${page.path}: unresolved [[gate: …]] marker`);
  }
});

test('the prices page publishes the owner VAT and review facts', async () => {
  const html = await readFile(join(OUT, 'prices', 'index.html'), 'utf8');
  assert.ok(html.includes('15% VAT is added at checkout'), 'the VAT wording is missing');
  assert.ok(html.includes('November 2026'), 'the prices-reviewed date is missing');
  assert.ok(!html.includes('[date]'), 'the prices-reviewed placeholder still ships');
  assert.ok(!html.includes('[confirm with CA]'), 'the VAT placeholder still ships');
});

test('the owner-supplied phone publishes and the placeholder is gone', async () => {
  // D-12: the phone was a bracketed placeholder until the owner supplied it.
  // The prices-reviewed date is still owner-supplied; this guards the phone.
  const home = await readFile(join(OUT, 'index.html'), 'utf8');
  assert.ok(!home.includes('01X-XXXX-XXXX'), 'the D-12 phone placeholder still ships');
  assert.ok(home.includes(SITE.phone), 'the real phone number must appear on the home page');
  assert.ok(home.includes(`tel:${SITE.phoneTel}`), 'the sticky bar must dial the real number');
});

test('the contact page carries the practice email', async () => {
  const html = await readFile(join(OUT, 'contact', 'index.html'), 'utf8');
  assert.ok(html.includes(`mailto:${SITE.email}`), 'the contact page must link the practice email');
});

test('the mobile shell contract: drawer destinations, slim u-bar, labelled cells', async () => {
  // M1 (docx §7.3). The drawer is the ONLY nav ≤820px, so every page must
  // carry the pathway map's main destinations in it; the utility bar must ship
  // the one-line mobile announcement; and every price-table cell must carry
  // its column label so the ≤820px CSS can stack rows into cards.
  for (const page of PAGES) {
    const html = await readPage(page);
    assert.ok(html.includes('id="drawer"'), `${page.path}: drawer missing`);
    const drawer = html.slice(html.indexOf('id="drawer"'));
    assert.ok(drawer.includes('>Prices</a>'), `${page.path}: drawer has no Prices link`);
    assert.ok(drawer.includes('About Dr. Sumya'), `${page.path}: drawer has no About link`);
    assert.ok(html.includes('class="u-bar-m"'), `${page.path}: mobile utility line missing`);
    assert.ok(html.includes('id="scrim"'), `${page.path}: drawer scrim missing`);
  }
  const prices = await readFile(join(OUT, 'prices', 'index.html'), 'utf8');
  const cells = prices.match(/<td(?![^>]*data-th)[^>]*>/g) || [];
  assert.equal(cells.length, 0, `price tables have ${cells.length} unlabelled cells — the stacked-card layout has no labels for them`);
});

test('the 404 is part of the multi-page shell, not the retired one-pager', async () => {
  const html = await readFile(join(OUT, '404.html'), 'utf8');
  assert.match(html, /name="robots" content="noindex"/, 'the 404 must not be indexed');
  assert.ok(html.includes('/css/site.css'), 'the 404 must use the site stylesheet');
  assert.ok(!html.includes('css/style.css'), 'the 404 must not fall back to the one-pager stylesheet');
  assert.ok(html.includes('id="main-content"'), 'the 404 must carry the skip-link target');
  assert.ok(html.includes('id="drawer"'), 'the 404 must carry the mobile drawer');
});

test('robots.txt keeps crawlers out of the admin console', async () => {
  const txt = await readFile(join(repoRoot, 'public', 'robots.txt'), 'utf8');
  assert.match(txt, /Disallow:\s*\/admin\//, 'robots.txt must disallow /admin/');
});

test('the booking form offers only real chambers, stamped with the server schedule', async () => {
  // CHAMBERS_NOW is DERIVED from functions/lib/schedule.js, so chambers can no
  // longer drift from the booking API's list — this now pins the build output
  // only: every chamber the API validates appears as an option, stamped with
  // its consulting days, and no phantom session is offered.
  const { CHAMBERS } = await import('../functions/lib/schedule.js');
  const html = await readFile(join(OUT, 'book', 'index.html'), 'utf8');
  for (const [key, c] of Object.entries(CHAMBERS)) {
    assert.ok(html.includes(`value="${key}" data-days="${c.days.join(',')}"`), `${key}: option missing or not stamped with its consulting days`);
  }
  assert.ok(!/value="Morning"/.test(html), 'the form must not offer a session no chamber runs');
});

test('the browser schedule adapter is the module itself, copied verbatim', async () => {
  // public/js/schedule.mjs is generated by npm run build:site from
  // functions/lib/schedule.js (plus a GENERATED header). The site's booking
  // form and the booking API must run the same code — this catches a stale or
  // hand-edited adapter.
  const src = await readFile(join(repoRoot, 'functions', 'lib', 'schedule.js'), 'utf8');
  const adapter = await readFile(join(OUT, 'js', 'schedule.mjs'), 'utf8');
  assert.ok(adapter.endsWith(src), 'public/js/schedule.mjs must be the generated copy of functions/lib/schedule.js — rerun npm run build:site');
});

test('no unapproved Bangla draft reaches a built page', async () => {
  // content/bn.mjs holds machine-drafted Bangla awaiting the doctor's review.
  const { BN } = await import('../content/bn.mjs');
  for (const page of PAGES) {
    const html = await readPage(page);
    for (const [path, entry] of Object.entries(BN)) {
      if (!entry.approved) assert.ok(!html.includes(entry.text), `${page.path}: unapproved Bangla draft for ${path} is published`);
    }
  }
});

test('the hero reel publishes six conditions, each line from its own page and linked to it', async () => {
  const html = await readFile(join(OUT, 'index.html'), 'utf8');
  const reel = html.slice(html.indexOf('data-reel'), html.indexOf('</section>', html.indexOf('data-reel')));
  assert.equal(REEL.length, 6);
  const paths = new Set(PAGES.map((p) => p.path));
  for (const r of REEL) {
    const [, , blurb] = CONDITIONS.find(([slug]) => slug === r.slug);
    // Verbatim from the published blurb: only the first letter and a closing
    // full stop may differ (home.mjs throws at build time if not; this pins it).
    assert.ok(blurb.includes(r.line.slice(1).replace(/\.$/, '')), `"${r.line}" is not in the ${r.slug} page's blurb`);
    assert.ok(reel.includes(`>${r.word}<`) && reel.includes(r.line), `hero reel is missing ${r.slug}`);
    const href = `/conditions/${r.slug}/`;
    assert.ok(paths.has(href), `${href} is not a published page`);
    assert.ok(reel.includes(`href="${href}"`), `the ${r.slug} slide must link to its page`);
  }
  assert.ok(!REEL.some((r) => r.slug === 'sexual-health'), 'confidential sexual health stays off the hero');
});

test('the hero credential plate carries the approved credentials and no past titles', async () => {
  const html = await readFile(join(OUT, 'index.html'), 'utf8');
  const plate = html.slice(html.indexOf('reel-plate'), html.indexOf('</section>', html.indexOf('reel-plate')));
  for (const want of ['Consultant Dermatologist', 'Skin, Hair, Nail, Allergy &amp; Venereal Diseases', '>MBBS<', '>DDV (BSMMU)<', '>FCPS (Skin &amp; VD)<', '>BMDC A-59492<']) {
    assert.ok(plate.includes(want), `the hero plate is missing ${want}`);
  }
  // agent.md §6 (owner, 2026-10-05): no MD; Assistant Professor and BCS (Health) are past roles.
  assert.doesNotMatch(plate, />MD<|Assistant Professor|BCS \(Health\)/);
});

test('the timeline publishes the five consultation steps', async () => {
  const html = await readFile(join(OUT, 'index.html'), 'utf8');
  const timeline = html.slice(html.indexOf('h-steps'));
  assert.equal(JOURNEY.length, 5);
  for (const [title, line] of JOURNEY) {
    assert.ok(timeline.includes(`<b>${title}</b>`) && timeline.includes(line), `timeline is missing step "${title}"`);
  }
});
