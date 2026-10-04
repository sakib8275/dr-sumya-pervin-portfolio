#!/usr/bin/env node
// Renders the brand kit in design/brand-kit/ from the same sources the site
// uses, so a printed card can never disagree with the website:
//
//   the mark        content/brand.mjs        (MARK_PATHS, the approved Signature SP)
//   the facts       content/site.mjs         (name, phone, domain, BMDC, chambers)
//   the hours       functions/lib/schedule.js (via CHAMBERS_NOW; same-day cutoff)
//   the type        design/brand-kit/type-paths.json (outlined Outfit, from
//                   design/brand-kit/tools/outline-type.py)
//
//   logo/      mark, horizontal and stacked lockups: SVG (outlined) + PNG,
//              in indigo, reverse (white) and black
//   digital/   profile picture, Facebook cover, chamber-hours post, email
//              signature (HTML + preview)
//   print/     written-plan pad, letterhead, visiting card, follow-up card,
//              chamber nameboards: PDF at trim + 3 mm bleed, plus PNG previews
//   index.html the guidelines page that shows and links all of the above
//
//   npm run build:brand-kit
//
// Uses the Playwright Chromium the e2e suite installs. Fonts are embedded from
// design/brand-kit/.cache/ (fetched once from google/fonts, OFL), so renders do
// not depend on the network after the first run. Rerun after any change to the
// mark, the name, the credentials or a chamber's hours, and commit the output.
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { crc32 } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { SITE, CHAMBERS_NOW } from '../content/site.mjs';
import { MARK_PATHS } from '../content/brand.mjs';
import { CHAMBERS, CUTOFF_MIN } from '../functions/lib/schedule.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'design', 'brand-kit');
const CACHE = join(KIT, '.cache');

// DESIGN.md tokens (public/css/site.css :root).
const C = {
  nil: '#23336B', deep: '#1A2756', tint: '#E4E8F4', onNil: '#C9D1EA',
  haldi: '#E0A526', haldiInk: '#8A5A00', paper: '#F7F3EA', paper2: '#EFE8DA',
  surface: '#FFFDF8', ink: '#1C2233', ink2: '#4F5568', rule: '#DDD5C6',
  ruleDark: '#3A4677', fieldLine: '#8C8576',
};

// Print facts. Title, specialty and qualifications are the confirmed wording in
// content/source/website-content.md (docx "Facts already confirmed"). The
// Assistant Professor post and BCS (Health) in PRODUCT.md are not on the kit
// until the owner confirms they are current (see design/brand-kit/README.md).
const F = {
  name: SITE.name,
  title: 'Consultant Dermatologist',
  specialty: 'Skin, Hair, Nail, Allergy & Venereal Diseases',
  quals: 'MBBS (SSMC) · DDV (BSMMU) · FCPS (Skin & VD)',
  bmdc: SITE.bmdc,
  phone: SITE.phone,
  web: SITE.domain.replace(/^https?:\/\//, ''),
  email: SITE.email,
};

const fmtTime = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const CH = CHAMBERS_NOW.map((c) => ({
  ...c,
  slug: c.short.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, ''),
  hours: c.hours.replace(' – ', '–'),
  cutoff: fmtTime(CHAMBERS[c.key].startMin - CUTOFF_MIN),
  area: 'Shyamoli',
}));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------- fonts ----------
const FONTS = {
  'Outfit.ttf': 'https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf',
  'HindSiliguri-SemiBold.ttf': 'https://github.com/google/fonts/raw/main/ofl/hindsiliguri/HindSiliguri-SemiBold.ttf',
};
await mkdir(CACHE, { recursive: true });
for (const [file, url] of Object.entries(FONTS)) {
  if (existsSync(join(CACHE, file))) continue;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font fetch failed: ${url} (${res.status})`);
  await writeFile(join(CACHE, file), Buffer.from(await res.arrayBuffer()));
}
const b64 = async (file) => (await readFile(join(CACHE, file))).toString('base64');
// Hind Siliguri carries only the Taka sign here (Outfit has no Bengali block),
// the same pairing the site uses for Bangla.
const FONT_CSS = `
@font-face{font-family:Outfit;font-weight:100 900;src:url(data:font/ttf;base64,${await b64('Outfit.ttf')}) format('truetype')}
@font-face{font-family:Taka;font-weight:400 700;unicode-range:U+09F3;src:url(data:font/ttf;base64,${await b64('HindSiliguri-SemiBold.ttf')}) format('truetype')}`;

// ---------- the mark ----------
const markG = (color, w) =>
  `<g fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${MARK_PATHS.map((d) => `<path d="${d}"/>`).join('')}</g>`;
const markSvg = (color, w, cls = '', label = '') =>
  `<svg class="${cls}" viewBox="0 0 100 100"${label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"'}>${markG(color, w)}</svg>`;

const TYPE = JSON.parse(await readFile(join(KIT, 'type-paths.json'), 'utf8'));
const typeRun = (key, x, baseline, cap, fill) => {
  const t = TYPE[key];
  const s = cap / t.capHeight;
  return { svg: `<path transform="translate(${x} ${baseline}) scale(${+s.toFixed(6)})" fill="${fill}" d="${t.d}"/>`, width: t.advance * s };
};

const browser = await chromium.launch();
const out = [];
const save = async (rel, data) => {
  const p = join(KIT, rel);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, data);
  out.push(rel);
};

try {
  // Geometry bounds of the mark (no stroke), measured rather than assumed.
  const probe = await browser.newPage();
  await probe.setContent(`<svg viewBox="0 0 100 100" width="100" height="100">${markG('#000', 4)}</svg>`);
  const BB = await probe.evaluate(() => {
    const b = document.querySelector('g').getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  await probe.close();
  const vis = (w) => ({ x: BB.x - w / 2, y: BB.y - w / 2, w: BB.w + w, h: BB.h + w, r: BB.x + BB.w + w / 2, b: BB.y + BB.h + w / 2 });

  // ---------- logo files ----------
  // P stem in MARK_PATHS runs y 27–68; with the 4-unit round stroke it reads
  // 25–70. The horizontal lockup centres its two lines of type on that span,
  // so the type is locked to the letters and the skin contour stays the mark's
  // own ground line.
  const W = 4;
  const V = vis(W);
  const pTop = 27 - W / 2, pFoot = 68 + W / 2;
  const COLOURWAYS = { indigo: C.nil, reverse: '#FFFFFF', black: '#000000' };

  const lockups = {};
  {
    const x = V.r + 12;
    const nameCap = 21, descCap = 6, gap = 10;
    const top = (pTop + pFoot) / 2 - (nameCap + gap + descCap) / 2;
    const name = typeRun('name', x, top + nameCap, nameCap, '{c}');
    const desc = typeRun('descriptor', x + 0.5, top + nameCap + gap + descCap, descCap, '{c}');
    const r = Math.max(x + name.width, x + desc.width);
    lockups.horizontal = { vb: [V.x - 1, V.y - 1, r - V.x + 2, V.h + 2], body: markG('{c}', W) + name.svg + desc.svg };
  }
  {
    const cx = V.x + V.w / 2;
    const nameCap = 13, descCap = 4.2;
    const nw = TYPE.name.advance * (nameCap / TYPE.name.capHeight);
    const dw = TYPE.descriptor.advance * (descCap / TYPE.descriptor.capHeight);
    const nb = V.b + 13 + nameCap;
    const db = nb + 8 + descCap;
    const name = typeRun('name', cx - nw / 2, nb, nameCap, '{c}');
    const desc = typeRun('descriptor', cx - dw / 2, db, descCap, '{c}');
    const half = Math.max(nw, dw) / 2;
    lockups.stacked = { vb: [cx - half - 1, V.y - 1, half * 2 + 2, db - V.y + 2], body: markG('{c}', W) + name.svg + desc.svg };
  }
  lockups.mark = { vb: [0, 0, 100, 100], body: markG('{c}', W) };

  const svgFile = (l, colour) => {
    const [x, y, w, h] = l.vb.map((n) => +n.toFixed(2));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${(w * 10).toFixed(0)}" height="${(h * 10).toFixed(0)}">\n<title>${esc(F.name)}</title>\n${l.body.replaceAll('{c}', colour)}\n</svg>\n`;
  };
  for (const [kind, l] of Object.entries(lockups)) {
    for (const [cw, colour] of Object.entries(COLOURWAYS)) {
      const svg = svgFile(l, colour);
      await save(`logo/${kind}-${cw}.svg`, svg);
      const [, , w, h] = l.vb;
      const pxW = kind === 'mark' ? 1024 : kind === 'horizontal' ? 2400 : 1600;
      const pxH = Math.round((pxW * h) / w);
      const p = await browser.newPage({ viewport: { width: pxW, height: pxH } });
      await p.setContent(`<style>*{margin:0}svg{display:block;width:${pxW}px;height:${pxH}px}</style>${svg}`);
      await mkdir(join(KIT, 'logo'), { recursive: true });
      await p.screenshot({ path: join(KIT, `logo/${kind}-${cw}.png`), omitBackground: true });
      out.push(`logo/${kind}-${cw}.png`);
      await p.close();
    }
  }

  // ---------- shared page shell ----------
  const shell = (css, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:Outfit,Taka,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased;font-feature-settings:"tnum" 0}
.tnum{font-variant-numeric:tabular-nums}
svg{display:block}
${css}</style></head><body>${body}</body></html>`;

  const shot = async (rel, w, h, html, { scale = 1, clip, transparent = false } = {}) => {
    const p = await browser.newPage({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: scale });
    await p.setContent(html);
    await p.evaluate(() => document.fonts.ready);
    await mkdir(dirname(join(KIT, rel)), { recursive: true });
    await p.screenshot({ path: join(KIT, rel), clip, omitBackground: transparent });
    await p.close();
    out.push(rel);
  };

  // ---------- digital ----------
  // Profile picture: WhatsApp, Facebook and Google crop it to a circle and show
  // it at ~40–56 px, so the mark is centred on its drawn bounds (not the 100-unit
  // box) and set at the drawer's weight (6) to stay at ~2 px when that small.
  {
    const w = 6, v = vis(w), size = 1080, span = 0.5;
    const s = (size * span) / Math.max(v.w, v.h);
    const tx = size / 2 - (v.x + v.w / 2) * s, ty = size / 2 - (v.y + v.h / 2) * s;
    const html = shell(`body{width:${size}px;height:${size}px;background:${C.deep}}`,
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g transform="translate(${tx} ${ty}) scale(${s})">${markG(C.paper, w)}</g></svg>`);
    await shot('digital/profile-1080.png', size, size, html);
  }

  // Facebook cover, 1640 × 624. Phones crop the sides to the centre ~1110 px
  // and desktop puts the profile picture over the bottom left, so the copy is
  // one centred block. The turmeric underline repeats the website hero's.
  await shot('digital/cover-facebook-1640x624.png', 1640, 624, shell(`
    body{width:1640px;height:624px;background:${C.deep};color:#fff;display:grid;place-items:center;text-align:center}
    h1{font-size:78px;font-weight:600;line-height:1.08;letter-spacing:-.02em}
    u{text-decoration:none;background:linear-gradient(${C.haldi},${C.haldi}) 0 100%/100% 7px no-repeat;padding-bottom:4px}
    p{margin-top:34px;font-size:27px;color:${C.onNil};letter-spacing:.01em}`,
    `<div><h1><u>Diagnosis</u> first. Published prices.<br>A written plan at every visit.</h1>
     <p>${esc(F.name)} · ${esc(F.title)} · ${esc(CH[0].area)}, Dhaka</p></div>`));

  // Chamber hours post, 1080 × 1080: WhatsApp status, Facebook, Google posts.
  await shot('digital/post-chamber-hours-1080.png', 1080, 1080, shell(`
    body{width:1080px;height:1080px;background:${C.paper};padding:80px 84px 72px;display:flex;flex-direction:column}
    .top{display:flex;align-items:center;gap:22px}
    .top svg{width:84px;height:84px}
    .top b{display:block;font-size:30px;font-weight:700;letter-spacing:-.01em}
    .top span{display:block;margin-top:4px;font-size:17px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${C.ink2}}
    h1{margin:64px 0 40px;font-size:64px;font-weight:700;line-height:1.04;letter-spacing:-.02em}
    .ch{border-top:3px solid ${C.ink};padding:22px 0 30px;display:grid;grid-template-columns:1fr auto;align-items:end;gap:6px 24px}
    .ch h2{font-size:31px;font-weight:700;letter-spacing:-.01em}
    .ch .ad{font-size:20px;color:${C.ink2};grid-column:1}
    .ch .d{font-size:24px;grid-column:1}
    .ch .h{grid-column:2;grid-row:1/4;text-align:right;font-size:58px;font-weight:600;color:${C.nil};line-height:1}
    .ch .h small{display:block;margin-top:10px;font-size:18px;font-weight:500;color:${C.ink2}}
    .ft{margin-top:auto;display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid ${C.rule};padding-top:24px}
    .ft b{font-size:28px;font-weight:600;color:${C.nil}}
    .ft span{font-size:21px;color:${C.ink2}}`,
    `<div class="top">${markSvg(C.nil, 5)}<div><b>${esc(F.name)}</b><span>${esc(F.title)}</span></div></div>
     <h1>Where to see<br>Dr. Sumya this week</h1>
     ${CH.map((c) => `<div class="ch"><h2>${esc(c.name.replace(/ \(.*\)$/, ''))}</h2><p class="ad">${esc(c.address)}</p><p class="d">${esc(c.days)}</p>
       <p class="h tnum">${esc(c.hours)}<small>Same-day serials close ${esc(c.cutoff)}</small></p></div>`).join('')}
     <div class="ft"><b>Serial by WhatsApp ${esc(F.phone)}</b><span>${esc(F.web)}</span></div>`));

  // Email signature. Email clients strip SVG and webfonts, so it is a table
  // with inline styles and the hosted 512 px PNG, falling back to system sans.
  const sig = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Outfit,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.ink};font-size:14px;line-height:1.45">
  <tr>
    <td style="padding-right:16px;vertical-align:top"><img src="${SITE.domain}/assets/logo-512.png" width="56" height="56" alt="${esc(F.name)}" style="display:block;border:0"></td>
    <td style="border-left:2px solid ${C.ink};padding-left:16px;vertical-align:top">
      <div style="font-size:16px;font-weight:700">${esc(F.name)}</div>
      <div style="color:${C.nil};font-weight:600">${esc(F.title)}</div>
      <div style="color:${C.ink2};font-size:13px">${esc(F.quals)} · ${esc(F.bmdc)}</div>
      <div style="margin-top:6px;font-size:13px"><a href="https://wa.me/${SITE.whatsapp}" style="color:${C.nil};text-decoration:none;font-weight:600">${esc(F.phone)}</a> <span style="color:${C.ink2}">Call or WhatsApp</span> · <a href="${SITE.domain}" style="color:${C.nil}">${esc(F.web)}</a></div>
    </td>
  </tr>
</table>`;
  await save('digital/email-signature.html', `<!-- Paste into Gmail / Outlook signature settings (copy from the rendered page, not the source). -->\n${sig}\n`);
  await shot('digital/email-signature-preview.png', 640, 120, shell(`body{background:#fff;padding:20px}`,
    sig.replace(`${SITE.domain}/assets/logo-512.png`, `data:image/png;base64,${(await readFile(join(KIT, 'logo/mark-indigo.png'))).toString('base64')}`)), { scale: 2 });

  // ---------- print ----------
  // Every PDF is trim + 3 mm bleed on each side; floods run into the bleed and
  // type keeps at least 4 mm inside the trim. Previews are clipped to the trim.
  const B = 3;
  const PX = 96 / 25.4;
  const printDoc = async (name, tw, th, css, pages) => {
    const sheetCss = `@page{size:${tw + 2 * B}mm ${th + 2 * B}mm;margin:0}
      .sheet{position:relative;width:${tw + 2 * B}mm;height:${th + 2 * B}mm;padding:${B}mm;overflow:hidden;background:#fff;break-after:page}
      .sheet:last-child{break-after:auto}
      .trim{position:relative;width:${tw}mm;height:${th}mm}
      ${css}`;
    const pdfPage = await browser.newPage();
    await pdfPage.setContent(shell(sheetCss, pages.map((p) => p.html).join('')));
    await pdfPage.evaluate(() => document.fonts.ready);
    await mkdir(join(KIT, 'print'), { recursive: true });
    await pdfPage.pdf({ path: join(KIT, `print/${name}.pdf`), preferCSSPageSize: true, printBackground: true });
    await pdfPage.close();
    out.push(`print/${name}.pdf`);
    for (const p of pages) {
      const w = (tw + 2 * B) * PX, h = (th + 2 * B) * PX;
      const scale = tw > 200 ? 1.5 : 3;
      await shot(`print/preview/${name}${p.id ? `-${p.id}` : ''}.png`, w, h, shell(sheetCss, p.html),
        { scale, clip: { x: B * PX, y: B * PX, width: tw * PX, height: th * PX } });
    }
  };

  const field = (label, cls = '') => `<div class="f ${cls}"><span>${esc(label)}</span></div>`;
  const box = '<i class="bx"></i>';

  // Shared stationery header + footer (pad and letterhead).
  const statCss = `
    .pad{padding:12mm 13mm ${17 + 7}mm;display:flex;flex-direction:column}
    .hd{display:grid;grid-template-columns:19mm 1fr auto;gap:0 5mm;align-items:start}
    .hd svg{width:19mm;height:19mm;margin-top:-1.6mm}
    .nm{font-size:21pt;font-weight:700;letter-spacing:-.02em;line-height:1.05}
    .ttl{margin-top:1.2mm;font-size:10pt;font-weight:600;color:${C.nil}}
    .sp,.q{font-size:8.4pt;color:${C.ink2};line-height:1.4}
    .ct{text-align:right;font-size:8.4pt;color:${C.ink2};line-height:1.45;padding-top:.6mm}
    .ct .ph{font-size:13pt;font-weight:700;color:${C.nil};letter-spacing:.01em}
    .rule{height:.6mm;background:${C.ink};margin-top:4.5mm}
    .ftb{position:absolute;left:0;right:0;bottom:0;height:${B + 17}mm;background:${C.deep};color:#fff;
      padding:4.2mm ${B + 13}mm ${B + 3.6}mm;display:grid;grid-template-columns:1fr 1fr 1.05fr;gap:6mm;align-items:start}
    .ftb b{display:block;font-size:8.4pt;font-weight:600}
    .ftb span{display:block;font-size:7.6pt;color:${C.onNil};line-height:1.4}
    .ftb .rm{font-size:8.2pt;font-weight:600;color:${C.haldi};line-height:1.35}`;
  const header = `<header class="hd">${markSvg(C.nil, 4.5)}
      <div><p class="nm">${esc(F.name)}</p><p class="ttl">${esc(F.title)}</p><p class="sp">${esc(F.specialty)}</p><p class="q">${esc(F.quals)} · ${esc(F.bmdc)}</p></div>
      <div class="ct"><p class="ph tnum">${esc(F.phone)}</p><p>Call or WhatsApp for a serial</p><p>${esc(F.web)}</p></div></header>
    <div class="rule"></div>`;
  const footer = (note) => `<footer class="ftb">${CH.map((c) => `<div><b>${esc(c.short)}, ${esc(c.area)}</b><span class="tnum">${esc(c.days)}<br>${esc(c.hours)}</span></div>`).join('')}
      <p class="rm">${esc(note)}</p></footer>`;

  await printDoc('written-plan-a4', 210, 297, statCss + `
    .pt{display:grid;grid-template-columns:1fr 13mm 15mm 17mm 25mm 19mm;gap:4mm;margin-top:5.5mm}
    .f{border-bottom:.25mm solid ${C.fieldLine};height:9mm;display:flex;align-items:flex-start}
    .f span{font-size:6.6pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.ink2}}
    .bd{display:grid;grid-template-columns:52mm 1fr;margin-top:6mm;flex:1}
    .l{display:grid;grid-template-rows:1fr 1.15fr .8fr 1fr;border-right:.25mm solid ${C.rule};padding-right:5mm}
    .l section{border-top:.6mm solid ${C.ink};padding-top:1.6mm}
    .l h3,.pl h3{font-size:7pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
    .l p{font-size:6.6pt;color:${C.ink2};margin-top:.6mm;line-height:1.35}
    .r{padding-left:6mm;display:flex;flex-direction:column}
    .rx{font-size:25pt;font-weight:700;color:${C.nil};line-height:1;letter-spacing:-.04em}
    .rx sub{font-size:15pt;vertical-align:-.12em}
    .pl{margin-top:auto;border-top:.6mm solid ${C.ink};padding-top:2.4mm;display:grid;grid-template-columns:1fr 1fr;gap:3.2mm 6mm}
    .pl .f{height:8mm}
    .pl .wide{grid-column:1/-1}
    .cost span::after{content:" ৳";font-family:Taka;letter-spacing:0;font-size:8pt;color:${C.ink}}
    .nx{grid-column:1/-1;display:flex;gap:5mm;align-items:center;font-size:7.6pt;color:${C.ink}}
    .nx .lab{font-size:6.6pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.ink2}}
    .bx{display:inline-block;width:3.2mm;height:3.2mm;border:.3mm solid ${C.ink};border-radius:.6mm;vertical-align:-.7mm;margin-right:1.6mm}
    .sg{margin-top:7mm;margin-left:auto;width:66mm;border-top:.25mm solid ${C.fieldLine};padding-top:1.2mm;text-align:right;font-size:7pt;color:${C.ink2}}`,
    [{ id: '', html: `<div class="sheet"><div class="trim pad">${header}
      <div class="pt">${field('Patient name')}${field('Age')}${field('Sex')}${field('Weight kg')}${field('Date')}${field('Serial no.')}</div>
      <div class="bd">
        <div class="l">
          <section><h3>History</h3><p>Complaint, duration, creams and medicines tried</p></section>
          <section><h3>Examination</h3><p>Findings, dermoscopy</p></section>
          <section><h3>Tests</h3><p>Only if they change treatment</p></section>
          <section><h3>Diagnosis</h3></section>
        </div>
        <div class="r">
          <p class="rx">R<sub>x</sub></p>
          <div class="pl">
            ${field('Timeline', 'wide')}${field('Total cost of this plan', 'cost')}${field('Next visit date')}
            <div class="nx"><span class="lab">At</span>${CH.map((c) => `<span>${box}${esc(c.short)}, ${esc(c.daysShort)} ${esc(c.hours)}</span>`).join('')}</div>
          </div>
          <div class="sg">${esc(F.name)} · ${esc(F.bmdc)}</div>
        </div>
      </div></div>${footer('Bring this plan, and every cream and medicine you use, to your next visit.')}</div>` }]);

  await printDoc('letterhead-a4', 210, 297, statCss, [{ id: '', html: `<div class="sheet"><div class="trim pad">${header}</div>${footer(F.specialty)}</div>` }]);

  // Visiting card and follow-up card: 3.5 × 2 in (88.9 × 50.8 mm), the size
  // Dhaka printers stock card holders and cutters for.
  const cardCss = `
    .dk{background:${C.deep}}
    .dk .trim{color:#fff;padding:5mm}
    .lt .trim{padding:4.6mm 5mm}
    .fr-mark{position:absolute;left:5mm;top:5mm;width:15mm;height:15mm}
    .fr-id{position:absolute;left:5mm;bottom:5mm}
    .fr-id b{display:block;font-size:12pt;font-weight:600;letter-spacing:-.01em}
    .fr-id span{display:block;margin-top:.8mm;font-size:6.2pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${C.onNil}}
    .fr-id i{display:block;width:8mm;height:.5mm;background:${C.haldi};margin-bottom:2.4mm}
    .bk-n{font-size:9pt;font-weight:700;letter-spacing:-.01em}
    .bk-s{font-size:6pt;color:${C.ink2};line-height:1.4}
    .bk-r{height:.45mm;background:${C.ink};margin:2.2mm 0 1.8mm}
    .bk-c{display:grid;grid-template-columns:1fr 1fr;gap:3mm}
    .bk-c b{display:block;font-size:6.4pt;font-weight:700}
    .bk-c span{display:block;font-size:5.9pt;color:${C.ink2}}
    .bk-c em{display:block;font-style:normal;font-size:8.6pt;font-weight:600;color:${C.nil};margin-top:.3mm}
    .bk-f{position:absolute;left:5mm;right:5mm;bottom:4.4mm;display:flex;justify-content:space-between;align-items:baseline}
    .bk-f b{font-size:10pt;font-weight:700;color:${C.nil}}
    .bk-f span{font-size:6pt;color:${C.ink2}}
    .fu-h{font-size:16pt;font-weight:600;letter-spacing:-.02em;line-height:1.1}
    .fu-p{margin-top:1.6mm;font-size:6.6pt;color:${C.onNil}}
    .fu-m{position:absolute;right:5mm;bottom:5mm;width:11mm;height:11mm}
    .fu-n{position:absolute;left:5mm;bottom:5mm;font-size:6.4pt;color:${C.onNil}}
    .fu-f{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:3.4mm}
    .fu-f i{display:block;height:9mm;border-bottom:.3mm solid ${C.ink}}
    .fu-f span{display:block;margin-top:.9mm;font-size:5.4pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${C.ink2}}
    .fu-c{margin-top:3.4mm;font-size:6.3pt;line-height:1.75}
    .fu-c .tnum{color:${C.ink2}}
    .bx{display:inline-block;width:2.5mm;height:2.5mm;border:.25mm solid ${C.ink};border-radius:.5mm;vertical-align:-.5mm;margin-right:1.4mm}
    .fu-b{position:absolute;left:5mm;right:5mm;bottom:4.2mm;font-size:5.9pt;color:${C.ink2};line-height:1.4;border-top:.25mm solid ${C.rule};padding-top:1.4mm}
    .fu-b b{color:${C.nil}}`;
  const cardFront = `<div class="sheet dk"><div class="trim">${markSvg(C.paper, 5, 'fr-mark')}
      <div class="fr-id"><i></i><b>${esc(F.name)}</b><span>${esc(F.title)}</span></div></div></div>`;
  await printDoc('visiting-card-89x51', 88.9, 50.8, cardCss, [
    { id: 'front', html: cardFront },
    { id: 'back', html: `<div class="sheet lt"><div class="trim">
      <p class="bk-n">${esc(F.name)}</p><p class="bk-s">${esc(F.specialty)}<br>${esc(F.quals)} · ${esc(F.bmdc)}</p>
      <div class="bk-r"></div>
      <div class="bk-c">${CH.map((c) => `<div><b>${esc(c.short)}, ${esc(c.area)}</b><span>${esc(c.days)}</span><em class="tnum">${esc(c.hours)}</em></div>`).join('')}</div>
      <div class="bk-f"><b class="tnum">${esc(F.phone)}</b><span>Call or WhatsApp · ${esc(F.web)}</span></div></div></div>` },
  ]);

  await printDoc('follow-up-card-89x51', 88.9, 50.8, cardCss, [
    { id: 'front', html: `<div class="sheet dk"><div class="trim"><p class="fu-h">Your next visit</p><p class="fu-p">Bring this card back with you.</p>
      <p class="fu-n">${esc(F.name)} · ${esc(F.title)}</p>${markSvg(C.paper, 6, 'fu-m')}</div></div>` },
    { id: 'back', html: `<div class="sheet lt"><div class="trim">
      <div class="fu-f">${['Date', 'Time', 'Serial no.'].map((l) => `<div><i></i><span>${l}</span></div>`).join('')}</div>
      <div class="fu-c">${CH.map((c) => `<div>${box}${esc(c.short)}, ${esc(c.area)} <span class="tnum">${esc(c.daysShort)}, ${esc(c.hours)}</span></div>`).join('')}</div>
      <p class="fu-b">Bring your written plan and every cream and medicine you use.<br>Can't come? WhatsApp <b class="tnum">${esc(F.phone)}</b></p></div></div>` },
  ]);

  // Chamber nameboard, A3 landscape, one per chamber: the board on the chamber
  // door that Dhaka patients read for the doctor's days and hours.
  for (const c of CH) {
    await printDoc(`nameboard-${c.slug}-a3`, 420, 297, `
      .sheet{background:${C.deep}}
      .trim{color:#fff;padding:24mm 28mm 20mm;display:grid;grid-template-columns:104mm 1fr;grid-template-rows:1fr auto;gap:0 22mm}
      .trim>svg{width:104mm;height:104mm;align-self:center}
      .trim>div:not(.bt){align-self:center}
      .nm{font-size:72pt;font-weight:600;letter-spacing:-.025em;line-height:1}
      .tt{margin-top:6mm;font-size:26pt;font-weight:500;color:${C.onNil}}
      .sp,.q{font-size:16pt;color:${C.onNil};line-height:1.45}
      .sp{margin-top:3mm}
      .hr{width:34mm;height:1.3mm;background:${C.haldi};margin:14mm 0 11mm}
      .d{font-size:28pt;font-weight:500}
      .h{font-size:80pt;font-weight:600;letter-spacing:-.02em;line-height:1.05}
      .cu{margin-top:3mm;font-size:16pt;color:${C.onNil}}
      .bt{grid-column:1/-1;border-top:.5mm solid ${C.ruleDark};padding-top:6mm;display:flex;justify-content:space-between;font-size:16pt;color:${C.onNil}}
      .bt b{color:#fff;font-weight:600}`,
      [{ id: '', html: `<div class="sheet"><div class="trim">${markSvg(C.paper, 4)}
        <div><p class="nm">${esc(F.name)}</p><p class="tt">${esc(F.title)}</p><p class="sp">${esc(F.specialty)}</p><p class="q">${esc(F.quals)} · ${esc(F.bmdc)}</p>
          <div class="hr"></div><p class="d">${esc(c.days)}</p><p class="h tnum">${esc(c.hours)}</p><p class="cu">Same-day serials close at ${esc(c.cutoff)}</p></div>
        <div class="bt"><span>For a serial, call or WhatsApp <b class="tnum">${esc(F.phone)}</b></span><span>${esc(F.web)}</span></div></div></div>` }]);
  }

  // ---------- guidelines page ----------
  const lk = (rel, label) => `<a href="${rel}" download>${label}</a>`;
  const logoRow = (kind) => Object.keys(COLOURWAYS).map((cw) =>
    `<li>${cw[0].toUpperCase() + cw.slice(1)} ${lk(`logo/${kind}-${cw}.svg`, 'SVG')} ${lk(`logo/${kind}-${cw}.png`, 'PNG')}</li>`).join('');
  // CMYK builds: sRGB -> Artifex SWOP coated (ghostscript default_cmyk.icc),
  // relative colorimetric. A starting point for the printer, not a match.
  const CMYK = { [C.nil]: '100 93 27 30', [C.deep]: '99 88 27 58', [C.haldi]: '12 38 100 0', [C.ink]: '84 75 58 79' };
  const sw = (hex, name, role) => `<li class="sw"><span style="background:${hex}"></span><b>${name}</b><code>${hex}</code>${CMYK[hex] ? `<code class="cm">C M Y K ${CMYK[hex]}</code>` : ''}<p>${role}</p></li>`;
  const xIcon = '<svg class="no" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const dont = (svg, text) => `<li><div class="dn">${svg}</div><p>${xIcon}${text}</p></li>`;

  const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sumya Pervin Brand Kit</title>
<link rel="icon" href="logo/mark-indigo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--nil:${C.nil};--deep:${C.deep};--on-nil:${C.onNil};--haldi:${C.haldi};--haldi-ink:${C.haldiInk};--paper:${C.paper};--paper-2:${C.paper2};--surface:${C.surface};--ink:${C.ink};--ink-2:${C.ink2};--rule:${C.rule};--ease:cubic-bezier(.16,1,.3,1)}
*{margin:0;padding:0;box-sizing:border-box}
html{background:var(--paper);color:var(--ink);font:400 1rem/1.55 Outfit,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;scrollbar-color:#8C8576 var(--paper)}
::selection{background:var(--haldi);color:var(--ink)}
body{max-width:1240px;margin:0 auto;padding:0 clamp(16px,3.4vw,56px) 96px}
a{color:var(--nil);text-underline-offset:3px;text-decoration-thickness:1px}
a:hover{text-decoration-thickness:2px}
a:focus-visible{outline:2px solid var(--nil);outline-offset:3px;border-radius:4px}
img{display:block;max-width:100%;height:auto}
code{font:600 .8125rem/1 Outfit,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.04em}
.top{display:flex;align-items:center;gap:14px;padding:22px 0;border-bottom:1px solid var(--rule)}
.top svg{width:40px;height:40px;color:var(--nil)}
.top b{font-size:1.125rem;letter-spacing:-.01em}
.top span{margin-left:auto;font-size:.875rem;color:var(--ink-2)}
.hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(24px,4vw,64px);align-items:center;padding:clamp(48px,7vw,96px) 0}
h1{font-size:clamp(2.375rem,5vw,3.875rem);line-height:1.04;letter-spacing:-.02em;font-weight:700;max-width:14ch}
h1 em{white-space:nowrap;font-style:normal;color:var(--nil);background:linear-gradient(var(--haldi),var(--haldi)) 0 92%/100% 4px no-repeat}
.lede{margin-top:22px;font-size:1.125rem;max-width:56ch;color:var(--ink-2)}
.plate{background:var(--deep);border-radius:20px;aspect-ratio:1;display:grid;place-items:center}
.plate svg{width:62%;color:#fff}
section{padding:clamp(48px,6vw,88px) 0;border-top:2px solid var(--ink)}
h2{font-size:clamp(1.75rem,3.4vw,2.5rem);line-height:1.12;letter-spacing:-.01em;font-weight:700;max-width:26ch}
.sub{margin-top:12px;max-width:62ch;color:var(--ink-2)}
h3{font-size:1.3125rem;line-height:1.12;letter-spacing:-.01em;font-weight:700}
.grid{display:grid;gap:clamp(24px,3.4vw,48px);margin-top:36px}
.g2{grid-template-columns:repeat(2,minmax(0,1fr))}
.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.tile{border-radius:18px;display:grid;place-items:center;padding:clamp(16px,2.4vw,32px);aspect-ratio:16/10}
.tile.p{background:var(--surface);border:1px solid var(--rule)}
.tile.d{background:var(--deep)}
.tile img{max-height:130px;max-width:100%;width:auto;height:auto}
.dl{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:14px;list-style:none;font-size:.9375rem;color:var(--ink-2)}
.dl a{font-weight:600;margin-left:4px}
.meta{margin-top:6px;font-size:.9375rem;color:var(--ink-2);max-width:60ch}
table{width:100%;border-collapse:collapse;margin-top:28px;font-size:.9375rem}
th{text-align:left;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2);font-weight:700;padding:10px 12px 10px 0;border-bottom:2px solid var(--ink)}
td{padding:12px 12px 12px 0;border-bottom:1px dashed var(--rule);vertical-align:top}
td:first-child{font-weight:600}
.num{font-variant-numeric:tabular-nums;color:var(--nil);font-weight:600}
.space{position:relative;background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:40px;display:grid;place-items:center}
.space .box{position:relative;outline:1.5px dashed var(--nil);outline-offset:0;padding:22px}
.space .box img{width:min(420px,60vw)}
.space .x{position:absolute;font:700 .75rem/1 Outfit,sans-serif;color:var(--nil);letter-spacing:.06em}
.sws{list-style:none;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:28px 20px;margin-top:36px}
.sw span{display:block;height:84px;border-radius:14px;border:1px solid var(--rule);margin-bottom:12px}
.sw b{display:block}
.sw code{display:block;color:var(--ink-2)}
.sw .cm{margin-top:4px;font-weight:500}
.sw p{margin-top:6px;font-size:.875rem;color:var(--ink-2)}
.spec{margin-top:36px;display:grid;gap:18px}
.spec p{line-height:1.15}
.s1{font-size:clamp(2.2rem,5vw,3.6rem);font-weight:700;letter-spacing:-.02em}
.s2{font-size:1.5rem;font-weight:600}
.s3{max-width:360px;padding-bottom:22px;border-bottom:1px solid #8C8576;font-size:.8125rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2)}
.s4{font-size:2.75rem;font-weight:600;color:var(--nil);font-variant-numeric:tabular-nums}
figure{margin:0}
figure img{border-radius:12px;border:1px solid var(--rule);background:#fff}
figcaption{margin-top:14px}
figcaption b{display:block;font-size:1.0625rem}
.circle{display:flex;align-items:end;gap:22px;margin-top:18px}
.circle img{border-radius:50%;border:0}
.circle small{color:var(--ink-2);font-size:.8125rem;display:block;text-align:center;margin-top:6px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.dons{list-style:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:28px 18px;margin-top:36px}
.dn{background:var(--surface);border:1px solid var(--rule);border-radius:14px;height:150px;display:grid;place-items:center;overflow:hidden}
.dn svg{width:88px;height:88px}
.dons p{margin-top:12px;font-size:.9375rem;display:flex;gap:8px;align-items:flex-start}
.no{flex:none;width:16px;height:16px;margin-top:4px;color:#A8322A}
.note{margin-top:28px;background:var(--paper-2);border-radius:14px;padding:18px 22px;max-width:76ch;font-size:.9375rem}
footer.pg{border-top:1px solid var(--rule);padding-top:22px;font-size:.875rem;color:var(--ink-2)}
@media (max-width:1080px){.g3,.dons{grid-template-columns:repeat(2,minmax(0,1fr))}.dons li:last-child{grid-column:1/-1}.sws{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:820px){.hero{grid-template-columns:1fr}.plate{max-width:360px}.g2,.g3{grid-template-columns:1fr}.top span{display:none}.space{padding:22px}.pair{grid-template-columns:1fr}.sws{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (prefers-reduced-motion:no-preference){.plate svg path{stroke-dasharray:120;stroke-dashoffset:120;animation:draw 1.4s var(--ease) forwards}.plate svg path:nth-child(2){animation-delay:.25s}.plate svg path:nth-child(3){animation-delay:.5s}@keyframes draw{to{stroke-dashoffset:0}}}
</style></head><body>
<header class="top">${markSvg('currentColor', 5)}<b>${esc(F.name)}</b><span>Brand kit · generated from the website's own sources</span></header>
<div class="hero">
  <div><h1>One mark, <em>drawn once</em>, used everywhere.</h1>
  <p class="lede">The approved Signature SP mark and everything built from it: logo files, social images, the written-plan pad, cards and chamber boards. Every file here is rendered by <code>npm run build:brand-kit</code> from the mark, facts and hours the website uses, so print and screen never disagree.</p></div>
  <div class="plate">${markSvg('currentColor', 4, '', `${F.name} mark`)}</div>
</div>

<section id="logo"><h2>Logo files</h2>
  <p class="sub">Type is outlined, so the SVGs look the same on a printer's machine without Outfit installed. Use the horizontal lockup wherever there is width, the stacked lockup in square spaces, and the mark alone where the name is already nearby.</p>
  <div class="grid g3">
    <div><div class="tile p"><img src="logo/horizontal-indigo.png" alt="Horizontal lockup"></div><h3 style="margin-top:16px">Horizontal</h3><ul class="dl">${logoRow('horizontal')}</ul></div>
    <div><div class="tile p"><img src="logo/stacked-indigo.png" alt="Stacked lockup"></div><h3 style="margin-top:16px">Stacked</h3><ul class="dl">${logoRow('stacked')}</ul></div>
    <div><div class="tile d"><img src="logo/mark-reverse.png" alt="Mark, reversed"></div><h3 style="margin-top:16px">Mark</h3><ul class="dl">${logoRow('mark')}</ul></div>
  </div>
</section>

<section id="space"><h2>Clear space and size</h2>
  <p class="sub">Keep clear space equal to the height of the P's bowl on every side, marked <b>x</b>. Nothing else enters that zone, not even the edge of a card.</p>
  <div class="space" style="margin-top:36px"><div class="box"><img src="logo/horizontal-indigo.png" alt="Horizontal lockup inside its clear-space boundary"><span class="x" style="top:4px;left:50%">x</span><span class="x" style="left:6px;top:50%">x</span></div></div>
  <table><thead><tr><th>Placement</th><th>Smallest</th><th>Stroke weight</th></tr></thead><tbody>
    <tr><td>Horizontal lockup</td><td class="num">160 px · 40 mm</td><td>4, as drawn. Below this, use the mark beside live text.</td></tr>
    <tr><td>Stacked lockup</td><td class="num">96 px · 24 mm</td><td>4, as drawn</td></tr>
    <tr><td>Mark, 40 px and up</td><td class="num">40 px · 10 mm</td><td>4, as drawn</td></tr>
    <tr><td>Mark, 24–40 px (site header, drawer)</td><td class="num">24 px</td><td>5–6, so strokes stay above 1.4 px</td></tr>
    <tr><td>Favicon tile</td><td class="num">16 px</td><td>7.5 on its 64-unit tile</td></tr>
  </tbody></table>
</section>

<section id="colour"><h2>Colour</h2>
  <p class="sub">The mark is one colour: Nil Indigo on light grounds, white or paper on Deep Nil, black when only one ink is available. Turmeric sits beside the mark at most once per view, as a rule or underline, never inside it.</p>
  <ul class="sws">
    ${sw(C.nil, 'Nil Indigo', 'The mark, headings emphasis, prices, actions.')}
    ${sw(C.deep, 'Deep Nil', 'Floods: cards, nameboards, profile picture, footers.')}
    ${sw(C.haldi, 'Haldi Turmeric', 'The one mark per view. Never text on a light ground.')}
    ${sw(C.paper, 'Unbleached Paper', 'Light ground for screen; print uses the stock itself.')}
    ${sw(C.ink, 'Ink', 'Body text and the heavy 2 px rules.')}
    ${sw(C.onNil, 'Indigo Mist', 'Secondary text on Deep Nil only.')}
  </ul>
  <p class="note">The PDFs are RGB (sRGB). The CMYK builds above are approximate conversions for coated stock; give them to the printer as a starting point and approve a printed proof on the chosen paper before the full run. Deep indigo floods shift most between presses.</p>
</section>

<section id="type"><h2>Type</h2>
  <p class="sub">Outfit, one family in four weights, on screen and in print. Emphasis is colour and a drawn underline, never italic. Prices and hours always use tabular figures.</p>
  <div class="spec">
    <p class="s1">${esc(F.name)}</p>
    <p class="s2">${esc(F.title)} · ${esc(F.specialty)}</p>
    <p class="s4">${esc(CH[0].hours)}</p>
    <p class="s3">Patient name</p>
  </div>
</section>

<section id="digital"><h2>Screens and social</h2>
  <p class="sub">The profile picture is the image patients see most, beside every WhatsApp reply. It is drawn for the circle crop and stays legible at 40 px.</p>
  <div class="grid g3">
    <figure><img src="digital/profile-1080.png" alt="Profile picture" width="1080" height="1080">
      <div class="circle"><div><img src="digital/profile-1080.png" alt="" width="40" height="40"><small>40 px</small></div><div><img src="digital/profile-1080.png" alt="" width="96" height="96"><small>96 px</small></div></div>
      <figcaption><b>Profile picture, 1080 × 1080</b><span class="meta">WhatsApp Business, Facebook, Google Business Profile, Instagram. ${lk('digital/profile-1080.png', 'Download')}</span></figcaption></figure>
    <figure><img src="digital/post-chamber-hours-1080.png" alt="Chamber hours post" width="1080" height="1080">
      <figcaption><b>Chamber hours post, 1080 × 1080</b><span class="meta">WhatsApp status and pinned posts. Re-render when hours change. ${lk('digital/post-chamber-hours-1080.png', 'Download')}</span></figcaption></figure>
    <figure><img src="digital/email-signature-preview.png" alt="Email signature preview" width="640" height="120">
      <figcaption><b>Email signature</b><span class="meta">Open the HTML file in a browser, copy the rendered signature, paste it into Gmail or Outlook settings. ${lk('digital/email-signature.html', 'HTML')}</span></figcaption></figure>
  </div>
  <figure style="margin-top:48px"><img src="digital/cover-facebook-1640x624.png" alt="Facebook cover" width="1640" height="624">
    <figcaption><b>Facebook cover, 1640 × 624</b><span class="meta">Copy sits in the centre so phones, which crop the sides, keep all of it, and the profile picture never covers it. ${lk('digital/cover-facebook-1640x624.png', 'Download')}</span></figcaption></figure>
</section>

<section id="print"><h2>Print</h2>
  <p class="sub">PDFs are trim size plus 3 mm bleed on every side, with type at least 4 mm inside the trim. The written plan is the practice in paper form: the same five steps the website publishes, ending in a timeline, a total cost and a next visit.</p>
  <div class="grid g2">
    <figure><img src="print/preview/written-plan-a4.png" alt="Written plan pad, A4" width="1191" height="1684">
      <figcaption><b>Written plan pad, A4</b><span class="meta">Padded in 50s or 100s, on 80–100 gsm uncoated. ${lk('print/written-plan-a4.pdf', 'PDF')}</span></figcaption></figure>
    <figure><img src="print/preview/letterhead-a4.png" alt="Letterhead, A4" width="1191" height="1684">
      <figcaption><b>Letterhead, A4</b><span class="meta">Referral letters and medical certificates. 100 gsm uncoated. ${lk('print/letterhead-a4.pdf', 'PDF')}</span></figcaption></figure>
  </div>
  <div class="grid g2">
    <figure><div class="pair"><img src="print/preview/visiting-card-89x51-front.png" alt="Visiting card, front" width="1008" height="576"><img src="print/preview/visiting-card-89x51-back.png" alt="Visiting card, back" width="1008" height="576"></div>
      <figcaption><b>Visiting card, 3.5 × 2 in</b><span class="meta">350 gsm matt, both sides. ${lk('print/visiting-card-89x51.pdf', 'PDF')}</span></figcaption></figure>
    <figure><div class="pair"><img src="print/preview/follow-up-card-89x51-front.png" alt="Follow-up card, front" width="1008" height="576"><img src="print/preview/follow-up-card-89x51-back.png" alt="Follow-up card, back" width="1008" height="576"></div>
      <figcaption><b>Follow-up card, 3.5 × 2 in</b><span class="meta">Filled in at the desk; uncoated 300 gsm so a pen writes on it. ${lk('print/follow-up-card-89x51.pdf', 'PDF')}</span></figcaption></figure>
  </div>
  <div class="grid g2">
    ${CH.map((c) => `<figure><img src="print/preview/nameboard-${c.slug}-a3.png" alt="Nameboard for ${esc(c.short)}" width="1588" height="1123">
      <figcaption><b>Chamber nameboard, ${esc(c.short)}</b><span class="meta">A3 landscape, on PVC or acrylic for the chamber door. ${lk(`print/nameboard-${c.slug}-a3.pdf`, 'PDF')}</span></figcaption></figure>`).join('')}
  </div>
</section>

<section id="misuse"><h2>Don't</h2>
  <ul class="dons">
    ${dont(`<svg viewBox="0 0 100 100">${markG(C.haldi, 4)}</svg>`, 'Fill or draw the mark in turmeric.')}
    ${dont(`<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:140px">${markG(C.nil, 4)}</svg>`, 'Stretch, squash or rotate it.')}
    ${dont(`<svg viewBox="0 0 100 100"><defs><linearGradient id="g"><stop offset="0" stop-color="${C.haldi}"/><stop offset="1" stop-color="${C.nil}"/></linearGradient></defs>${markG('url(#g)', 4)}</svg>`, 'Add gradients, glows or shadows.')}
    ${dont(`<svg viewBox="0 0 100 100">${markG(C.nil, 1.2)}</svg>`, 'Thin the stroke, or redraw the letters in another font.')}
    ${dont(`<svg viewBox="0 0 100 100" style="background:#D9A07A;width:100%;height:100%;padding:28px">${markG('#fff', 4)}</svg>`, 'Set it on warm skin-tone or peach grounds.')}
  </ul>
</section>
<footer class="pg">Generated by <code>scripts/render-brand-kit.mjs</code>. Edit the sources, not these files.</footer>
</body></html>`;
  await save('index.html', index);

  // Provenance: every PNG says what made it, in a tEXt chunk (Comment, plus
  // the impeccable:prompt key the design tooling scans for). None of these
  // rasters is AI-generated; each is drawn from the sources named above.
  const origin = `Rendered by scripts/render-brand-kit.mjs from content/brand.mjs (Signature SP mark), content/site.mjs and functions/lib/schedule.js. Vector-drawn in Chromium; not AI-generated.`;
  const chunk = (key, text) => {
    const body = Buffer.concat([Buffer.from(key, 'latin1'), Buffer.from([0]), Buffer.from(text, 'latin1')]);
    const head = Buffer.alloc(4); head.writeUInt32BE(body.length);
    const type = Buffer.from('tEXt', 'latin1');
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([type, body])));
    return Buffer.concat([head, type, body, crc]);
  };
  for (const rel of out.filter((f) => f.endsWith('.png'))) {
    const png = await readFile(join(KIT, rel));
    const iend = png.length - 12; // IEND is always the last 12 bytes
    await writeFile(join(KIT, rel), Buffer.concat([png.subarray(0, iend), chunk('Comment', origin), chunk('impeccable:prompt', origin), png.subarray(iend)]));
  }
} finally {
  await browser.close();
}
console.log(out.map((f) => `wrote design/brand-kit/${f}`).join('\n'));
