// CMS login and the JWT boundary.
//
// A WAF rate-limit rule cannot cover a .pages.dev hostname, so until the custom
// domain is connected, Turnstile is the ONLY brute-force defence on this endpoint.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, tokens, TEST_PIN } from './helpers/harness.mjs';
import { signToken } from '../functions/lib/auth.js';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

const login = (body) => h.anon('POST', '/api/auth/login', { body });

test('the correct PIN mints a token that the API accepts', async () => {
  const res = await login({ pin: TEST_PIN, 'cf-turnstile-response': tokens.good('login') });
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.success, true);
  assert.match(body.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);

  const authed = await h.withToken(body.token, 'GET', '/api/appointments');
  assert.equal(authed.status, 200);
});

test('a wrong PIN is a 401 and mints no token', async () => {
  const res = await login({ pin: 'definitely-not-the-pin', 'cf-turnstile-response': tokens.good('login') });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.match(body.error, /Incorrect PIN/);
  assert.equal(body.token, undefined, 'a failed login must not leak a token');
});

test('Turnstile runs before the PIN is checked', async () => {
  // If the order ever inverted, an attacker could brute-force the PIN without
  // ever solving a challenge. The tell is that the correct PIN still 403s.
  const res = await login({ pin: TEST_PIN });

  assert.equal(res.status, 403);
  assert.match((await res.json()).error, /Verification failed/);
});

test('a booking token cannot be used to log in', async () => {
  const res = await login({ pin: TEST_PIN, 'cf-turnstile-response': tokens.good('booking') });
  assert.equal(res.status, 403);
});

test('a missing PIN with a valid token is a 400', async () => {
  const res = await login({ 'cf-turnstile-response': tokens.good('login') });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /PIN is required/);
});

test('a non-string PIN is a 400, not a crash', async () => {
  const res = await login({ pin: { $ne: null }, 'cf-turnstile-response': tokens.good('login') });
  assert.equal(res.status, 400);
});

test('a token signed with a different secret is rejected', async () => {
  // The old code fell back to a constant when JWT_SECRET was unset, which meant
  // anyone reading the source could mint admin tokens. This is the regression test.
  const forged = await signToken({ JWT_SECRET: 'fallback-dev-secret' });
  const res = await h.withToken(forged, 'GET', '/api/appointments');

  assert.equal(res.status, 401);
  assert.match((await res.json()).error, /Unauthorized/);
});

test('malformed Authorization headers are rejected without erroring', async () => {
  for (const value of ['garbage', 'Bearer', 'Bearer ', 'Bearer a.b.c', 'Basic dXNlcjpwYXNz']) {
    const res = await h.mf.dispatchFetch('https://test.local/api/appointments', {
      headers: { Authorization: value }
    });
    assert.equal(res.status, 401, `Authorization: ${value}`);
  }
});

test('/api/auth/check reflects the real token state', async () => {
  const anon = await h.anon('GET', '/api/auth/check');
  assert.equal((await anon.json()).authenticated, false);

  const authed = await h.asAdmin('GET', '/api/auth/check');
  assert.equal((await authed.json()).authenticated, true);
});

test('an unconfigured admin row is a 500 that names the cause', async () => {
  const bare = await createHarness();
  try {
    await bare.db.prepare('DELETE FROM admin_settings WHERE id = 1').run();
    const res = await bare.anon('POST', '/api/auth/login', {
      body: { pin: TEST_PIN, 'cf-turnstile-response': tokens.good('login') }
    });

    assert.equal(res.status, 500);
    assert.match((await res.json()).error, /migration/i);
  } finally {
    await bare.dispose();
  }
});
