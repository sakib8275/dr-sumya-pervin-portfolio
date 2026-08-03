// F9 security headers, and the invariant that makes the CSP survivable.
//
// The CSP's script-src has no 'unsafe-inline'. That kills every inline event
// handler on the page, and it kills them SILENTLY: no console error the patient
// sees, no failed request, no failing test. The booking modal's Confirm button
// would simply do nothing. So the header itself is only half of what is tested
// here -- the other half is `no inline event handler attribute survives in
// public/`, which is what stops a future edit from re-introducing one and
// discovering it in production.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createHarness, repoRoot, TEST_ORIGIN } from './helpers/harness.mjs';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

// Parses "a 'b' c; d 'e'" into { a: ["'b'", 'c'], d: ["'e'"] }.
function parseCSP(header) {
  const directives = {};
  for (const part of header.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) directives[name] = values;
  }
  return directives;
}

async function cspOf(response) {
  const header = response.headers.get('Content-Security-Policy');
  assert.ok(header, 'no Content-Security-Policy header on the response');
  return parseCSP(header);
}

test('the HTML document carries a CSP', async () => {
  const res = await h.anon('GET', '/');
  assert.equal(res.status, 200);
  assert.ok(
    (res.headers.get('Content-Type') || '').includes('text/html'),
    'this test is only meaningful against the real HTML asset'
  );
  await cspOf(res);
});

test("script-src has no 'unsafe-inline' -- the whole point of F9", async () => {
  const csp = await cspOf(await h.anon('GET', '/'));
  assert.ok(csp['script-src'], 'script-src missing: inline script would be unrestricted');
  assert.ok(
    !csp['script-src'].includes("'unsafe-inline'"),
    "script-src must never carry 'unsafe-inline'; that is the directive F9 exists to set"
  );
  assert.ok(
    !csp['script-src'].includes("'unsafe-eval'"),
    "script-src must never carry 'unsafe-eval'"
  );
  assert.ok(csp['script-src'].includes("'self'"), "script-src must allow 'self' or main.js will not load");
});

test('script-src carries a fresh nonce on every response', async () => {
  // Not for anything in this repo -- every script we ship is external and matches
  // 'self'. It exists so Cloudflare's CDN can stamp it onto the JavaScript
  // Detections snippet it injects into the apex HTML, whose inline body embeds a
  // per-request ray id and so can never be covered by a hash. See _middleware.js.
  const first = await cspOf(await h.anon('GET', '/'));
  const second = await cspOf(await h.anon('GET', '/'));

  const nonceOf = (csp) => csp['script-src'].find((s) => s.startsWith("'nonce-"));
  assert.ok(nonceOf(first), 'script-src has no nonce');
  assert.notEqual(
    nonceOf(first),
    nonceOf(second),
    'the nonce must be regenerated per request; a fixed one is unsafe-inline in disguise'
  );
  assert.match(nonceOf(first), /^'nonce-[A-Za-z0-9+/\-_]{16,}'$/, 'nonce must be long and random');
});

test('the zone-injected Web Analytics beacon is allowed', async () => {
  // static.cloudflareinsights.com is injected by the ZONE into the apex HTML, not
  // by anything in public/. F9's first deploy blocked it and silently killed the
  // owner's analytics.
  const csp = await cspOf(await h.anon('GET', '/'));
  assert.ok(
    csp['script-src'].includes('https://static.cloudflareinsights.com'),
    'script-src must allow the Web Analytics beacon'
  );
});

test('Turnstile is allowed as both a script and a frame source', async () => {
  // Losing either of these fails every patient booking with a 403 that looks
  // exactly like the system working correctly.
  const csp = await cspOf(await h.anon('GET', '/'));
  assert.ok(
    csp['script-src'].some((s) => s.includes('challenges.cloudflare.com')),
    'script-src must allow challenges.cloudflare.com or Turnstile api.js is blocked'
  );
  assert.ok(
    csp['frame-src'] && csp['frame-src'].some((s) => s.includes('challenges.cloudflare.com')),
    'frame-src must allow challenges.cloudflare.com or the widget iframe is blocked'
  );
});

test("style-src keeps 'unsafe-inline' and allows the Google Fonts stylesheet", async () => {
  // ~55 inline style attributes plus a <style> block in 404.html. Dropping
  // 'unsafe-inline' here is a cosmetic cliff, not a security win worth taking
  // in the same change as the script-src one.
  const csp = await cspOf(await h.anon('GET', '/'));
  assert.ok(csp['style-src'].includes("'unsafe-inline'"));
  assert.ok(csp['style-src'].some((s) => s.includes('fonts.googleapis.com')));
});

test('the framing, base and form directives are locked down', async () => {
  const csp = await cspOf(await h.anon('GET', '/'));
  assert.deepEqual(csp['frame-ancestors'], ["'none'"]);
  assert.deepEqual(csp['object-src'], ["'none'"]);
  assert.deepEqual(csp['base-uri'], ["'self'"]);
  assert.deepEqual(csp['form-action'], ["'self'"]);
});

test('img-src allows the R2 uploads, https images and data: previews', async () => {
  const csp = await cspOf(await h.anon('GET', '/'));
  // 'self' covers /api/uploads/*; data: is the CMS upload preview; https: is a
  // pasted image URL in the gallery form.
  assert.ok(csp['img-src'].includes("'self'"));
  assert.ok(csp['img-src'].includes('data:'));
  assert.ok(csp['img-src'].includes('https:'));
});

test('the other security headers are on the HTML', async () => {
  const res = await h.anon('GET', '/');
  assert.match(res.headers.get('Strict-Transport-Security') || '', /max-age=31536000/);
  assert.match(res.headers.get('Strict-Transport-Security') || '', /includeSubDomains/);
  // preload is a one-way door on a domain a clinic depends on. Not without an
  // explicit owner decision.
  assert.doesNotMatch(res.headers.get('Strict-Transport-Security') || '', /preload/);
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(res.headers.get('X-Frame-Options'), 'DENY');
  assert.equal(res.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  const pp = res.headers.get('Permissions-Policy') || '';
  for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
    assert.ok(pp.includes(`${feature}=()`), `Permissions-Policy must deny ${feature}`);
  }
});

test('API responses and the 404 page carry the headers too', async () => {
  // The middleware runs for every route, not just the document, so a route that
  // renders HTML in future is covered by default rather than by remembering.
  const api = await h.anon('GET', '/api/config/public');
  assert.equal(api.status, 200);
  assert.ok(api.headers.get('Content-Security-Policy'));
  assert.equal(api.headers.get('X-Content-Type-Options'), 'nosniff');

  const notFound = await h.anon('GET', '/no-such-page');
  assert.equal(notFound.status, 404);
  assert.ok(notFound.headers.get('Content-Security-Policy'));
});

test('the CORS preflight still answers, and now with security headers', async () => {
  const res = await h.anon('OPTIONS', '/api/appointments', { origin: TEST_ORIGIN });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), TEST_ORIGIN);
  assert.ok(res.headers.get('Content-Security-Policy'));
});

// --- the source invariant --------------------------------------------------

const COMMENTLESS = {
  // <!-- ... --> only; these files have no <script> comment syntax to worry about.
  '.html': (src) => src.replace(/<!--[\s\S]*?-->/g, ''),
  '.js': (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
};

async function publishedSources() {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith('.html') || entry.name.endsWith('.js')) files.push(path);
    }
  }
  await walk(join(repoRoot, 'public'));
  return files;
}

test('no inline event handler attribute survives anywhere in public/', async () => {
  // The CSP drops these without a word. Counted by hand at the start of F9:
  // 8 onclick + 1 onsubmit in index.html, 3 onclick generated as HTML strings in
  // main.js -- twelve, not the eleven the FIXPLAN recorded. The generated ones
  // are the easy ones to miss, so this scans built strings as well as markup.
  const offenders = [];

  for (const file of await publishedSources()) {
    const ext = file.slice(file.lastIndexOf('.'));
    const source = COMMENTLESS[ext](await readFile(file, 'utf8'));
    // An on* attribute in markup or in a template literal that becomes markup.
    for (const match of source.matchAll(/[\s"'`]on[a-z]+\s*=\s*["']/gi)) {
      const line = source.slice(0, match.index).split('\n').length;
      offenders.push(`${file.slice(repoRoot.length + 1)}:${line}  ${match[0].trim()}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    'inline event handlers are silently dead under the CSP -- use a listener or a data- attribute:\n  ' +
      offenders.join('\n  ')
  );
});

test('no javascript: URL survives anywhere in public/', async () => {
  const offenders = [];
  for (const file of await publishedSources()) {
    const ext = file.slice(file.lastIndexOf('.'));
    const source = COMMENTLESS[ext](await readFile(file, 'utf8'));
    if (/javascript:/i.test(source)) offenders.push(file.slice(repoRoot.length + 1));
  }
  assert.deepEqual(offenders, [], 'javascript: URLs are blocked by script-src too');
});

test('the pre-hydration submit guard is loaded from the document head', async () => {
  // This replaced onsubmit="return false" on the booking form. If the tag is
  // dropped, a submit before main.js hydrates goes back to a native GET on "/?"
  // and the patient's booking vanishes with no message.
  const html = await readFile(join(repoRoot, 'public', 'index.html'), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.match(head, /<script src="js\/formguard\.js"><\/script>/, 'formguard.js must load, blocking, from <head>');

  const guard = await readFile(join(repoRoot, 'public', 'js', 'formguard.js'), 'utf8');
  assert.match(guard, /addEventListener\(\s*'submit'/, 'formguard.js must still cancel submits');
  assert.match(guard, /preventDefault/);
});

test('the CMS row buttons carry data- actions that main.js delegates on', async () => {
  // These three buttons are built as HTML strings, which is exactly where an
  // inline onclick hides from a markup-only review.
  const main = await readFile(join(repoRoot, 'public', 'js', 'main.js'), 'utf8');
  for (const action of ['gallery-delete', 'appointment-status', 'appointment-delete']) {
    assert.ok(
      main.includes(`data-cms-action="${action}"`),
      `the ${action} button lost its data-cms-action`
    );
  }
  assert.match(
    main,
    /closest\('\[data-cms-action\]'\)/,
    'nothing delegates on [data-cms-action]: the CMS row buttons would be inert'
  );
});
