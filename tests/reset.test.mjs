import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, tokens, TEST_PIN } from './helpers/harness.mjs';
import { newResetToken, hashToken, resetExpiry, isExpired } from '../functions/lib/reset.js';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

test('reset helper functions format and hash tokens correctly', async () => {
  const token = newResetToken();
  assert.equal(typeof token, 'string');
  assert.equal(token.length, 64);
  assert.match(token, /^[0-9a-f]{64}$/);

  const hashed = await hashToken(token);
  assert.equal(hashed.length, 64);
  assert.match(hashed, /^[0-9a-f]{64}$/);

  const expiry = resetExpiry(30);
  assert.equal(isExpired(expiry), false);
  assert.equal(isExpired('2020-01-01T00:00:00.000Z'), true);
});

test('forgot-password sends reset link if email matches admin_email', async () => {
  const email = 'dr.enamtalha@gmail.com';
  // Seed admin_email in database
  await h.db
    .prepare('UPDATE admin_settings SET admin_email = ? WHERE id = 1')
    .bind(email)
    .run();

  const res = await h.anon('POST', '/api/auth/forgot-password', {
    body: {
      email,
      'cf-turnstile-response': tokens.good('forgot-password')
    }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.message.includes('If that address matches'));

  // Verify email was captured in harness mails array
  assert.equal(h.mails.length, 1);
  assert.equal(h.mails[0].to, email);
  assert.ok(h.mails[0].body.includes('/#reset?token='));
});

test('forgot-password does not send email if address does not match', async () => {
  const mailCountBefore = h.mails.length;
  const res = await h.anon('POST', '/api/auth/forgot-password', {
    body: {
      email: 'wrong@example.com',
      'cf-turnstile-response': tokens.good('forgot-password')
    }
  });

  assert.equal(res.status, 200);
  assert.equal(h.mails.length, mailCountBefore);
});

test('reset-password validates token and updates PIN, clearing 2FA', async () => {
  const token = newResetToken();
  const hashed = await hashToken(token);

  // Seed token in password_resets table and enable 2FA on admin
  await h.db
    .prepare("INSERT INTO password_resets (token_hash, expires_at) VALUES (?, datetime('now', '+30 minutes'))")
    .bind(hashed)
    .run();

  await h.db
    .prepare("UPDATE admin_settings SET totp_secret = 'TESTSECRET', totp_enabled = 1 WHERE id = 1")
    .run();

  const newPin = 'brand-new-pin-99999';
  const res = await h.anon('POST', '/api/auth/reset-password', {
    body: {
      token,
      new_pin: newPin,
      'cf-turnstile-response': tokens.good('reset-password')
    }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);

  // Attempt login with old PIN -> fails
  const loginOld = await h.anon('POST', '/api/auth/login', {
    body: { pin: TEST_PIN, 'cf-turnstile-response': tokens.good('login') }
  });
  assert.equal(loginOld.status, 401);

  // Attempt login with new PIN -> passes without 2FA challenge (2FA cleared)
  const loginNew = await h.anon('POST', '/api/auth/login', {
    body: { pin: newPin, 'cf-turnstile-response': tokens.good('login') }
  });
  assert.equal(loginNew.status, 200);
  const loginData = await loginNew.json();
  assert.equal(loginData.success, true);
  assert.equal(typeof loginData.token, 'string');
  assert.equal(loginData.pending_2fa, undefined);

  // Verify token cannot be reused
  const resReuse = await h.anon('POST', '/api/auth/reset-password', {
    body: {
      token,
      new_pin: 'another-new-pin',
      'cf-turnstile-response': tokens.good('reset-password')
    }
  });
  assert.equal(resReuse.status, 400);
});
