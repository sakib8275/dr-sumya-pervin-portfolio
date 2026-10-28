#!/usr/bin/env node
// Post-deploy check of the live apex: the checks every deploy in STATUS.md has
// run by hand, made repeatable.
//
//   node scripts/verify-live.mjs [base-url] [--browser]     (npm run verify:live)
//
// base-url defaults to https://drsumyapervin.com. Read-only: GET requests only,
// no booking, no login, no write. Safe to run at any time against production.
//
// Exit codes: 0 every check passed · 1 a check failed · 2 inconclusive (the
// Cloudflare edge blocked this vantage point, so nothing was actually tested).
//
// What it cannot see: a real Turnstile token, and with --browser off the
// zone-injected scripts. --browser loads pages in Chromium and fails on any
// console error or CSP violation, but it is still a datacenter IP when run from
// CI or a cloud session. The authoritative console check is a real browser on
// the apex (agent.md §5, Verification Checklist item 3).
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const BROWSER = args.includes('--browser');
const BASE = (args.find((a) => !a.startsWith('--')) || 'https://drsumyapervin.com').replace(/\/$/, '');

// The highest-value repo internals. The full list lives in
// tests/exposure.test.mjs, which runs against the harness on every `npm test`;
// this is the live spot-check of the same boundary. Every one must 404.
const MUST_NOT_BE_PUBLISHED = [
  '/wrangler.toml',
  '/.dev.vars',
  '/.env',
  '/package.json',
  '/migrations/001_schema.sql',
  '/functions/lib/auth.js',
  '/functions/_middleware.js',
  '/agent.md',
  '/CLAUDE.md',
  '/STATUS.md',
  '/context.md',
  '/drsumyapervin.com.txt',
  '/docs/README.md',
  '/workers/mailer/wrangler.toml',
  '/.claude/settings.json',
];
// Strings that only appear in real repo internals. A 404 page never carries them.
const SECRET_MARKERS = /pin_hash|pin_salt|SITE_SECRET|JWT_SECRET|MAIL_SECRET|d1_databases|database_id/;

// Served assets compared byte-for-byte with the working tree: proves the
// deploy you just made is the one being served, not a cached predecessor.
const MUST_MATCH_LOCAL = ['/css/site.css', '/js/site.js'];

const results = [];
let blocked = false;
const record = (ok, name, detail = '') => results.push({ ok, name, detail });

async function get(path) {
  const res = await fetch(BASE + path, { redirect: 'manual', headers: { 'Cache-Control': 'no-cache' } });
  if (res.headers.has('cf-mitigated')) blocked = true;
  return { res, body: await res.text() };
}

const nonceOf = (csp) => (csp.match(/'nonce-([^']+)'/) || [])[1];

async function checkHome() {
  const { res, body } = await get('/');
  record(res.status === 200, 'homepage answers 200', `status ${res.status}`);
  record(body.includes('<link rel="canonical" href="https://drsumyapervin.com/">') && !body.includes('<title>Page not found'),
    'homepage is the real home page, not the 404 page');

  const h = res.headers;
  record(/max-age=31536000/.test(h.get('strict-transport-security') || ''), 'HSTS max-age=31536000');
  record((h.get('x-content-type-options') || '').toLowerCase() === 'nosniff', 'X-Content-Type-Options: nosniff');
  record((h.get('x-frame-options') || '').toUpperCase() === 'DENY', 'X-Frame-Options: DENY');

  const csp = h.get('content-security-policy') || '';
  const scriptSrc = (csp.match(/script-src[^;]*/) || [''])[0];
  record(Boolean(nonceOf(csp)), 'CSP carries a script nonce');
  record(scriptSrc && !scriptSrc.includes("'unsafe-inline'"), "CSP script-src has no 'unsafe-inline'");
  record(scriptSrc.includes('challenges.cloudflare.com') && /frame-src[^;]*challenges\.cloudflare\.com/.test(csp),
    'CSP allows Turnstile in script-src and frame-src', 'without both, every booking 403s silently');

  // A fixed nonce is 'unsafe-inline' wearing a hat (agent.md §5).
  const again = await get('/');
  const n1 = nonceOf(csp);
  const n2 = nonceOf(again.res.headers.get('content-security-policy') || '');
  record(Boolean(n1 && n2 && n1 !== n2), 'CSP nonce is fresh per request');
}

async function checkApi() {
  const { res, body } = await get('/api/config/public');
  let shape = false;
  try {
    const data = JSON.parse(body);
    shape = typeof data.whatsapp === 'string' && typeof data.telegram === 'string';
  } catch { /* not JSON */ }
  record(res.status === 200 && shape, '/api/config/public answers 200 with {whatsapp, telegram}',
    `status ${res.status}; a 200 without the shape is a catch-all, not the Function`);
}

async function checkLeaks() {
  for (const path of MUST_NOT_BE_PUBLISHED) {
    const { res, body } = await get(path);
    const leaked = SECRET_MARKERS.test(body);
    record(res.status === 404 && !leaked, `not published: ${path}`,
      `status ${res.status}${leaked ? ', BODY CARRIES SECRET MARKERS — escalate to the owner now' : ''}`);
  }
}

async function checkServedAssets() {
  const sha = (buf) => createHash('sha256').update(buf).digest('hex');
  for (const path of MUST_MATCH_LOCAL) {
    const local = sha(await readFile(join(ROOT, 'public', path)));
    const res = await fetch(`${BASE}${path}?verify=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
    if (res.headers.has('cf-mitigated')) blocked = true;
    const served = sha(Buffer.from(await res.arrayBuffer()));
    record(res.status === 200 && served === local, `served ${path} matches the working tree`,
      served === local ? '' : 'stale CDN cache, wrong deploy, or an uncommitted local edit');
  }
}

async function checkBrowser() {
  const { chromium } = await import('@playwright/test');
  // CHROMIUM_PATH: for machines whose preinstalled Chromium is not the build
  // this Playwright version downloads (`npx playwright install chromium` otherwise).
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    for (const width of [1440, 375]) {
      for (const path of ['/', '/book/', '/prices/']) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const problems = [];
        page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
        page.on('console', (msg) => {
          const text = msg.text();
          const fromTurnstile = (msg.location().url || '').includes('challenges.cloudflare.com');
          if (fromTurnstile) return; // its iframe's WebGL/font noise is documented as harmless
          if (msg.type() === 'error' || /Content Security Policy|Refused to/.test(text)) problems.push(text);
        });
        await page.goto(BASE + path, { waitUntil: 'networkidle' });
        record(problems.length === 0, `browser ${width}px ${path}: zero console errors`, problems.slice(0, 3).join(' | '));
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

try {
  await checkHome();
  await checkApi();
  await checkLeaks();
  await checkServedAssets();
  if (BROWSER && !blocked) await checkBrowser();
} catch (err) {
  // Failing before the first response means nothing was tested: either the
  // site is down or this machine cannot reach it (a sandbox or proxy policy).
  if (results.length === 0) {
    console.log(`verify-live against ${BASE}\n`);
    console.log(`UNREACHABLE: ${err.message}${err.cause ? ` (${err.cause.code || err.cause.message})` : ''}`);
    console.log('Open the site in a browser. If it is up there, this network cannot reach it: run from the operator\'s machine.');
    process.exit(2);
  }
  record(false, 'run completed', err.message);
}

console.log(`verify-live against ${BASE}\n`);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${!r.ok && r.detail ? `  (${r.detail})` : ''}`);
const failed = results.filter((r) => !r.ok).length;

if (blocked) {
  console.log('\nINCONCLUSIVE: the Cloudflare edge challenged this vantage point (cf-mitigated).');
  console.log('Bot Fight Mode blocks datacenter IPs. Re-run from a residential network or check in a real browser.');
  process.exit(2);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
