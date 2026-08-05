import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, tokens, TEST_PIN } from './helpers/harness.mjs';
import { totp } from '../functions/lib/totp.js';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

test('2FA lifecycle: setup, verify setup, challenge login, and disable', async () => {
  // 1. Check status (initially disabled)
  const resStatus1 = await h.asAdmin('GET', '/api/auth/2fa/status');
  assert.equal(resStatus1.status, 200);
  assert.equal((await resStatus1.json()).enabled, false);

  // 2. Initiate setup
  const resSetup = await h.asAdmin('POST', '/api/auth/2fa/setup');
  assert.equal(resSetup.status, 200);
  const setupData = await resSetup.json();
  assert.equal(typeof setupData.secret, 'string');
  assert.ok(setupData.otpauth_uri.startsWith('otpauth://totp/'));

  // Status should still be false until verified
  const resStatus2 = await h.asAdmin('GET', '/api/auth/2fa/status');
  assert.equal((await resStatus2.json()).enabled, false);

  // 3. Verify setup with generated code
  const currentCode = await totp(setupData.secret);
  const resVerifySetup = await h.asAdmin('POST', '/api/auth/2fa/verify-setup', {
    body: { code: currentCode }
  });
  assert.equal(resVerifySetup.status, 200);
  assert.equal((await resVerifySetup.json()).success, true);

  // Status should now be enabled
  const resStatus3 = await h.asAdmin('GET', '/api/auth/2fa/status');
  assert.equal((await resStatus3.json()).enabled, true);

  // 4. Test login flow with 2FA enabled
  const resLogin = await h.anon('POST', '/api/auth/login', {
    body: { pin: TEST_PIN, 'cf-turnstile-response': tokens.good('login') }
  });
  assert.equal(resLogin.status, 200);
  const loginData = await resLogin.json();
  assert.equal(loginData.pending_2fa, true);
  assert.equal(typeof loginData.challenge, 'string');

  // Attempting to use the challenge token as full auth on protected endpoint fails
  const resProtectedFail = await h.withToken(loginData.challenge, 'GET', '/api/auth/2fa/status');
  assert.equal(resProtectedFail.status, 401);

  // 5. Verify 2FA challenge with valid code
  const challengeCode = await totp(setupData.secret);
  const res2faVerify = await h.anon('POST', '/api/auth/2fa/verify', {
    body: { challenge: loginData.challenge, code: challengeCode }
  });
  assert.equal(res2faVerify.status, 200);
  const verifyData = await res2faVerify.json();
  assert.equal(typeof verifyData.token, 'string');

  // Authenticated request with final token succeeds
  const resProtectedSuccess = await h.withToken(verifyData.token, 'GET', '/api/auth/2fa/status');
  assert.equal(resProtectedSuccess.status, 200);

  // 6. Disable 2FA with current PIN & TOTP code
  const disableCode = await totp(setupData.secret);
  const resDisable = await h.asAdmin('POST', '/api/auth/2fa/disable', {
    body: { current_pin: TEST_PIN, code: disableCode }
  });
  assert.equal(resDisable.status, 200);
  assert.equal((await resDisable.json()).success, true);

  // Status should be disabled again
  const resStatus4 = await h.asAdmin('GET', '/api/auth/2fa/status');
  assert.equal((await resStatus4.json()).enabled, false);
});
