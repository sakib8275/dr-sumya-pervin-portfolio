// Settings: the public contact channels, and PIN rotation.
//
// /api/config/public exists because the doctor's WhatsApp number sat behind
// requireAuth, so anonymous patients got a 401 and the booking form built a
// "https://wa.me/" link with no number -- the forward the practice depends on
// went nowhere for everyone except the admin. That split must not regress.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, tokens, TEST_PIN } from './helpers/harness.mjs';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

test('the public route serves the contact channels and nothing else', async () => {
  await h.db
    .prepare("UPDATE admin_settings SET whatsapp = '8801700000000', telegram = 'drsumya' WHERE id = 1")
    .run();

  const res = await h.anon('GET', '/api/config/public');
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.deepEqual(body, { whatsapp: '8801700000000', telegram: 'drsumya' });
  // Anything beyond these two keys would be a leak: this row also holds the PIN
  // hash and salt.
  assert.deepEqual(Object.keys(body).sort(), ['telegram', 'whatsapp']);
});

test('the public route never exposes the PIN hash or salt', async () => {
  const body = await (await h.anon('GET', '/api/config/public')).text();
  assert.ok(!body.includes('pin_hash'));
  assert.ok(!body.includes('pin_salt'));

  const row = await h.db.prepare('SELECT pin_hash, pin_salt FROM admin_settings WHERE id = 1').first();
  assert.ok(!body.includes(row.pin_hash));
  assert.ok(!body.includes(row.pin_salt));
});

test('the admin settings route requires auth for both read and write', async () => {
  assert.equal((await h.anon('GET', '/api/config')).status, 401);
  assert.equal((await h.anon('PUT', '/api/config', { body: { whatsapp: '1' } })).status, 401);
});

test('an admin can set the contact channels, and the public route sees them', async () => {
  const res = await h.asAdmin('PUT', '/api/config', {
    body: { whatsapp: '8801711111111', telegram: '@sumya' }
  });
  assert.equal(res.status, 200);

  const pub = await (await h.anon('GET', '/api/config/public')).json();
  assert.deepEqual(pub, { whatsapp: '8801711111111', telegram: '@sumya' });
});

test('a config write without new_pin leaves the PIN untouched', async () => {
  const before = await h.db.prepare('SELECT pin_hash FROM admin_settings WHERE id = 1').first();
  await h.asAdmin('PUT', '/api/config', { body: { whatsapp: '8801722222222', telegram: '' } });
  const after = await h.db.prepare('SELECT pin_hash FROM admin_settings WHERE id = 1').first();

  assert.equal(after.pin_hash, before.pin_hash);
});

test('a too-short new PIN is refused', async () => {
  const res = await h.asAdmin('PUT', '/api/config', {
    body: { current_pin: TEST_PIN, new_pin: 'short' }
  });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /at least 8/);
});

test('rotating without the current PIN is refused', async () => {
  const res = await h.asAdmin('PUT', '/api/config', { body: { new_pin: 'a-long-enough-pin' } });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /Current PIN required/);
});

test('rotating with the wrong current PIN is a 401', async () => {
  const res = await h.asAdmin('PUT', '/api/config', {
    body: { current_pin: 'wrong-current-pin', new_pin: 'a-long-enough-pin' }
  });
  assert.equal(res.status, 401);
  assert.match((await res.json()).error, /Current PIN is incorrect/);
});

test('a successful rotation changes the salt and retires the old PIN', async () => {
  const fresh = await createHarness();
  try {
    const before = await fresh.db.prepare('SELECT pin_hash, pin_salt FROM admin_settings WHERE id = 1').first();

    const res = await fresh.asAdmin('PUT', '/api/config', {
      body: { current_pin: TEST_PIN, new_pin: 'the-rotated-pin-9876', whatsapp: '', telegram: '' }
    });
    assert.equal(res.status, 200);

    const after = await fresh.db.prepare('SELECT pin_hash, pin_salt FROM admin_settings WHERE id = 1').first();
    assert.notEqual(after.pin_salt, before.pin_salt, 'each rotation must draw a fresh salt');
    assert.notEqual(after.pin_hash, before.pin_hash);

    const old = await fresh.anon('POST', '/api/auth/login', {
      body: { pin: TEST_PIN, 'cf-turnstile-response': tokens.good('login') }
    });
    assert.equal(old.status, 401, 'the old PIN must stop working');

    const next = await fresh.anon('POST', '/api/auth/login', {
      body: { pin: 'the-rotated-pin-9876', 'cf-turnstile-response': tokens.good('login') }
    });
    assert.equal(next.status, 200, 'the new PIN must work');
  } finally {
    await fresh.dispose();
  }
});

test('the same PIN rotated twice never produces the same hash', async () => {
  const fresh = await createHarness();
  try {
    const rotate = (current, next) =>
      fresh.asAdmin('PUT', '/api/config', { body: { current_pin: current, new_pin: next } });

    await rotate(TEST_PIN, 'repeated-pin-value');
    const first = await fresh.db.prepare('SELECT pin_hash FROM admin_settings WHERE id = 1').first();

    await rotate('repeated-pin-value', 'interim-pin-value');
    await rotate('interim-pin-value', 'repeated-pin-value');
    const second = await fresh.db.prepare('SELECT pin_hash FROM admin_settings WHERE id = 1').first();

    assert.notEqual(second.pin_hash, first.pin_hash);
  } finally {
    await fresh.dispose();
  }
});
