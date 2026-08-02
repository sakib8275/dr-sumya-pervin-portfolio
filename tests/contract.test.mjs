// The client/server route contract.
//
// public/js/main.js and functions/ are edited independently, and nothing but a
// real request proves they agree. Pages routing is strict about segments --
// functions/api/appointments/[id].js serves /api/appointments/:id and NOT
// /api/appointments/:id/status -- so a path the client invents falls through to
// the static-asset handler and comes back as a 404 HTML page. main.js turns that
// into "Server returned 404 and no JSON", and the CMS shows a generic failure.
//
// This file extracts every call site from main.js and asserts a Function
// actually handles it.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHarness, repoRoot, ONE_PIXEL_PNG } from './helpers/harness.mjs';

let h;
let callSites;

before(async () => {
  h = await createHarness();

  const source = await readFile(join(repoRoot, 'public', 'js', 'main.js'), 'utf8');

  // Captures the method and the whole path expression, including concatenated
  // suffixes -- '/api/appointments/' + id + '/status' must not be truncated to
  // its literal prefix, or the very bug this file exists to catch is invisible.
  const pattern = /\bapi\(\s*'(GET|POST|PUT|DELETE)'\s*,\s*([^,)]+)/g;

  callSites = [...source.matchAll(pattern)].map(([, method, expression]) => ({
    method,
    expression: expression.trim(),
    path: expression
      .split('+')
      .map((part) => part.trim())
      .map((part) => {
        const literal = part.match(/^'([^']*)'$/) || part.match(/^"([^"]*)"$/);
        // A runtime value (an id) stands in as a plausible sample segment.
        return literal ? literal[1] : 'sample-id';
      })
      .join('')
  }));
});

after(async () => { await h.dispose(); });

test('the extractor found the call sites it is supposed to guard', () => {
  assert.ok(callSites.length >= 10, `expected the API call sites, found ${callSites.length}`);
  const paths = callSites.map((c) => c.path);
  assert.ok(paths.includes('/api/appointments'), 'booking call site missing');
  assert.ok(paths.includes('/api/auth/login'), 'login call site missing');
});

test('every path main.js calls is handled by a Function, not the 404 page', async () => {
  const unrouted = [];

  for (const site of callSites) {
    // Authenticated, so a 401 can never mask a routing failure. A handler that
    // runs always answers in JSON; the static 404 page is HTML.
    const body = site.method === 'GET' || site.method === 'DELETE' ? undefined : {};
    const res = await h.asAdmin(site.method, site.path, body ? { body } : {});
    const contentType = res.headers.get('Content-Type') || '';

    if (!contentType.includes('application/json')) {
      unrouted.push(`${site.method} ${site.path}  (from ${site.expression})  -> ${res.status} ${contentType}`);
    } else if (res.status === 405) {
      unrouted.push(`${site.method} ${site.path}  (from ${site.expression})  -> 405 method not allowed`);
    }
  }

  assert.deepEqual(unrouted, [], `main.js calls paths with no matching route:\n  ${unrouted.join('\n  ')}`);
});

test('the CMS status toggle reaches the appointment update route', async () => {
  // Regression guard for PUT /api/appointments/:id/status, which never existed.
  const { id } = await (await h.asAdmin('POST', '/api/appointments', {
    body: {
      patient_name: 'Status Test', patient_phone: '01700000000',
      chamber: 'Alliance', appointment_date: '2026-10-01', service: 'Consultation',
      'cf-turnstile-response': 'good:booking'
    }
  })).json();

  const source = await readFile(join(repoRoot, 'public', 'js', 'main.js'), 'utf8');
  const call = source.match(/toggleAppointmentStatus[\s\S]*?api\(\s*'PUT'\s*,\s*([^,)]+)/);
  assert.ok(call, 'toggleAppointmentStatus no longer PUTs through api()');

  const path = call[1].split('+').map((p) => p.trim())
    .map((p) => (p.match(/^'([^']*)'$/) ? p.slice(1, -1) : id))
    .join('');

  const res = await h.asAdmin('PUT', path, { body: { status: 'Confirmed' } });
  assert.equal(res.status, 200, `the CMS status toggle 404s: PUT ${path}`);

  const row = await h.db.prepare('SELECT status FROM appointments WHERE id = ?').bind(id).first();
  assert.equal(row.status, 'Confirmed', 'the status change must actually persist');
});

test('the CMS photo upload reaches the multipart gallery route', async () => {
  // Regression guard for POST /api/gallery/upload, which never existed. Its
  // failure was swallowed by a catch that substituted a stock image, so every
  // "successfully published" photo silently showed assets/clinic.jpg.
  const form = new FormData();
  form.append('title', 'Contract upload');
  form.append('category', 'clinic');
  form.append('caption', '');
  form.append('image', new Blob([ONE_PIXEL_PNG], { type: 'image/png' }), 'photo.png');

  const res = await h.asAdmin('POST', '/api/gallery', { body: form });
  assert.equal(res.status, 201);

  const { id } = await res.json();
  const row = await h.db.prepare('SELECT image_path FROM gallery WHERE id = ?').bind(id).first();
  assert.match(row.image_path, /^\/api\/uploads\/gallery-/, 'the upload must yield a real R2 path');

  // Matched against the extracted call sites rather than the raw file, so the
  // comment in main.js explaining this history does not trip the assertion.
  const uploadCalls = callSites.filter((c) => /gallery\/upload/.test(c.path));
  assert.deepEqual(uploadCalls, [], 'main.js still calls a gallery upload route that no Function serves');

  const source = await readFile(join(repoRoot, 'public', 'js', 'main.js'), 'utf8');
  assert.ok(
    !/catch\s*\([^)]*\)\s*\{\s*imagePath\s*=/.test(source),
    'a failed upload must surface to the admin, not silently become a stock image'
  );
});
