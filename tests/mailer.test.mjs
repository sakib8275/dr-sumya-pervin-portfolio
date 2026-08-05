import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleMailer, ALLOWED_RECIPIENT } from '../workers/mailer/mailer.js';

const TEST_SECRET = 'secret-test-key-12345';
const TEST_ENV = {
  MAIL_SECRET: TEST_SECRET,
  MAIL_FROM: 'digest@drsumyapervin.com'
};

function makeRequest(method, headers = {}, body = null) {
  return {
    method,
    headers: new Map(Object.entries(headers)),
    json: async () => body
  };
}

test('handleMailer rejects non-POST requests', async () => {
  const req = makeRequest('GET', { 'X-Mail-Secret': TEST_SECRET });
  const res = await handleMailer(TEST_ENV, req);
  assert.equal(res.ok, false);
  assert.equal(res.status, 450);
});

test('handleMailer rejects missing or incorrect X-Mail-Secret header', async () => {
  const reqMissing = makeRequest('POST', {}, { to: ALLOWED_RECIPIENT, subject: 'Hi', body: 'Test' });
  const resMissing = await handleMailer(TEST_ENV, reqMissing);
  assert.equal(resMissing.ok, false);
  assert.equal(resMissing.status, 403);

  const reqBad = makeRequest('POST', { 'X-Mail-Secret': 'wrong-secret' }, { to: ALLOWED_RECIPIENT, subject: 'Hi', body: 'Test' });
  const resBad = await handleMailer(TEST_ENV, reqBad);
  assert.equal(resBad.ok, false);
  assert.equal(resBad.status, 403);
});

test('handleMailer rejects unauthorized destination emails', async () => {
  const req = makeRequest(
    'POST',
    { 'X-Mail-Secret': TEST_SECRET },
    { to: 'unauthorized@example.com', subject: 'Hi', body: 'Test' }
  );
  const res = await handleMailer(TEST_ENV, req);
  assert.equal(res.ok, false);
  assert.equal(res.status, 400);
  assert.ok(res.error.includes(ALLOWED_RECIPIENT));
});

test('handleMailer constructs raw MIME message for authorized recipient', async () => {
  const req = makeRequest(
    'POST',
    { 'X-Mail-Secret': TEST_SECRET },
    { to: ALLOWED_RECIPIENT, subject: 'Reset Password', body: 'Click link to reset' }
  );
  const res = await handleMailer(TEST_ENV, req);
  assert.equal(res.ok, true);
  assert.equal(res.to, ALLOWED_RECIPIENT);
  assert.equal(res.subject, 'Reset Password');
  assert.ok(typeof res.raw === 'string');
  assert.ok(res.raw.includes(`To: ${ALLOWED_RECIPIENT}`));
  assert.ok(res.raw.includes(`From: ${TEST_ENV.MAIL_FROM}`));
  assert.ok(res.raw.includes(`Subject: Reset Password`));
});
