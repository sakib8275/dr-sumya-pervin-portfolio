// Findings A5, A6, A7 from the 2026-08-27 audit round.
//
// Each of these is a control that was correct in one place and weaker in
// another: the strict check existed, but a second path reached the same state
// without it.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, tokens, TEST_PIN, TEST_JWT_SECRET } from './helpers/harness.mjs';
import { signChallengeToken } from '../functions/lib/auth.js';
import { totp } from '../functions/lib/totp.js';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

const env = { JWT_SECRET: TEST_JWT_SECRET };

// ---------------------------------------------------------------- A5 -------
test('A5: /api/auth/check rejects a pending-2FA challenge token', async () => {
  // The challenge token is a valid JWT signed by this deployment, issued after
  // the PIN but BEFORE the TOTP code. verifyToken accepts it; requireAuth does
  // not. /api/auth/check used to answer with a bare !!payload, so it said
  // "authenticated" for a half-finished login -- and main.js reveals the CMS on
  // this endpoint's word alone.
  const challenge = await signChallengeToken(env, { challenge: 'challenge-id-under-test' });

  const res = await h.withToken(challenge, 'GET', '/api/auth/check');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).authenticated, false,
    'a token that has not cleared the second factor must not read as authenticated');
});

test('A5: /api/auth/check still answers true for a real admin token', async () => {
  const res = await h.asAdmin('GET', '/api/auth/check');
  assert.equal((await res.json()).authenticated, true);
});

test('A5: a challenge token cannot reach an authenticated route either', async () => {
  // requireAuth was always strict -- this is the belt to check.js's braces, and
  // it is what kept the weaker predicate from ever being exploitable.
  const challenge = await signChallengeToken(env, { challenge: 'challenge-id-under-test' });
  const res = await h.withToken(challenge, 'GET', '/api/appointments');
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------- A6 -------
let phoneSeq = 0;
function booking(over = {}) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 3);
  while (d.getUTCDay() === 5) d.setUTCDate(d.getUTCDate() + 1);
  return {
    patient_name: 'Duplicate Probe',
    patient_phone: '018000' + String(phoneSeq++).padStart(4, '0'),
    chamber: 'Alliance Hospital Limited (Shyamoli)',
    appointment_date: d.toISOString().slice(0, 10),
    service: 'General Skin Consultation',
    'cf-turnstile-response': tokens.good('booking'),
    ...over
  };
}

test('A6: the duplicate-booking 409 does not disclose the existing reference id', async () => {
  const body = booking();
  const first = await h.anon('POST', '/api/appointments', { body });
  assert.equal(first.status, 201);
  const { id } = await first.json();
  assert.match(id, /^book-/);

  const retry = await h.anon('POST', '/api/appointments', { body });
  assert.equal(retry.status, 409);
  const message = (await retry.json()).error;

  // The endpoint is unauthenticated. Echoing the reference let anyone who
  // supplied a phone number confirm that its owner has an appointment at a named
  // chamber on a given date, and handed them its id.
  assert.ok(!message.includes(id), `the 409 body leaked the reference id: ${message}`);
  assert.ok(!/book-[0-9a-f]{8}/.test(message), `the 409 body leaked a reference id: ${message}`);
  assert.match(message, /already exists/);
});

// --------------------------------------------------------------- A7a -------
test('A7: the server rejects a phone number with too few digits', async () => {
  // main.js's validatePhone() strips non-digits and then tests a class that
  // includes digits, so client-side this is only a length check -- and a caller
  // can skip the form entirely. A stored 'aaaa' renders a WhatsApp button
  // pointing at https://wa.me/ with no number.
  for (const bad of ['aaaa', '12345', 'not-a-phone', '+++']) {
    const res = await h.anon('POST', '/api/appointments', { body: booking({ patient_phone: bad }) });
    assert.equal(res.status, 400, `expected 400 for phone ${bad!==undefined?JSON.stringify(bad):bad}`);
    assert.match((await res.json()).error, /valid mobile number/);
  }
});

test('A7: the server rejects a phone number longer than E.164 allows', async () => {
  const res = await h.anon('POST', '/api/appointments', { body: booking({ patient_phone: '1'.repeat(16) }) });
  assert.equal(res.status, 400);
});

test('A7: real Bangladeshi formats are still accepted', async () => {
  for (const good of ['01725196101', '+880 1725-196101', '8801725196101']) {
    const res = await h.anon('POST', '/api/appointments', { body: booking({ patient_phone: good }) });
    assert.equal(res.status, 201, `expected 201 for phone ${good}, got ${res.status}`);
  }
});

// --------------------------------------------------------------- A7b -------
test('A7: 2FA setup refuses to run while 2FA is already enabled', async () => {
  // Disabling 2FA requires the current PIN AND a live code. Re-running setup
  // overwrote the secret and reset totp_enabled to 0, reaching the same state
  // with neither -- an unguarded second path to the guarded outcome.
  const setup = await h.asAdmin('POST', '/api/auth/2fa/setup');
  assert.equal(setup.status, 200);
  const { secret } = await setup.json();

  const enable = await h.asAdmin('POST', '/api/auth/2fa/verify-setup', { body: { code: await totp(secret) } });
  assert.equal(enable.status, 200);

  const again = await h.asAdmin('POST', '/api/auth/2fa/setup');
  assert.equal(again.status, 409, 're-running setup while enabled must be refused');

  // ...and the enrolled secret must be untouched, or the doctor's authenticator
  // would stop working even though the request was refused.
  const row = await h.db.prepare('SELECT totp_secret, totp_enabled FROM admin_settings WHERE id = 1').first();
  assert.equal(row.totp_enabled, 1);
  assert.equal(row.totp_secret, secret);

  // Clean up so the challenge-login path in auth2fa.test.mjs is unaffected.
  await h.db.prepare("UPDATE admin_settings SET totp_secret = '', totp_enabled = 0 WHERE id = 1").run();
});

test('A7: the otpauth URI labels the account with the stored admin_email', async () => {
  await h.db.prepare("UPDATE admin_settings SET admin_email = ? WHERE id = 1").bind('owner@example.com').run();
  const res = await h.asAdmin('POST', '/api/auth/2fa/setup');
  const { otpauth_uri } = await res.json();
  assert.ok(
    decodeURIComponent(otpauth_uri).includes('owner@example.com'),
    `otpauth URI should carry the configured admin_email, got: ${otpauth_uri}`
  );
  // It must no longer carry the address that used to be hardcoded here.
  assert.ok(!otpauth_uri.includes('dr.enamtalha'), 'the hardcoded account label is still present');
  await h.db.prepare("UPDATE admin_settings SET totp_secret = '', totp_enabled = 0 WHERE id = 1").run();
});

// --------------------------------------------------------------- A7d -------
test('A7: expired and spent password-reset rows are pruned when a new one is minted', async () => {
  await h.db.prepare("UPDATE admin_settings SET admin_email = ? WHERE id = 1").bind('owner@example.com').run();
  await h.db.prepare("DELETE FROM password_resets").run();

  // One expired, one already used but not yet expired -- the prune must catch
  // both, for different reasons. created_at is set in the past deliberately:
  // the 60-second mint throttle reads the newest created_at across ALL rows and
  // returns early, so a fresh timestamp here would short-circuit the request
  // before it ever reached the prune. Real stale rows are old by definition.
  await h.db.prepare("INSERT INTO password_resets (token_hash, created_at, expires_at) VALUES ('stale-hash', datetime('now', '-2 hours'), datetime('now', '-1 hour'))").run();
  await h.db.prepare("INSERT INTO password_resets (token_hash, created_at, expires_at, used_at) VALUES ('spent-hash', datetime('now', '-10 minutes'), datetime('now', '+20 minutes'), datetime('now', '-9 minutes'))").run();
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM password_resets').first()).n, 2);

  const res = await h.anon('POST', '/api/auth/forgot-password', {
    body: { email: 'owner@example.com', 'cf-turnstile-response': tokens.good('forgot-password') }
  });
  assert.equal(res.status, 200);

  const rows = await h.db.prepare('SELECT token_hash FROM password_resets').all();
  const hashes = rows.results.map(r => r.token_hash);
  assert.ok(!hashes.includes('stale-hash'), 'the expired row survived');
  assert.ok(!hashes.includes('spent-hash'), 'the spent row survived');
  assert.equal(hashes.length, 1, 'exactly the freshly minted token should remain');
});
