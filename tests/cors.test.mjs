// _middleware.js: CORS.
//
// The wildcard that used to be here applied to the authenticated routes too, so
// any origin could read patient records with a stolen token. Same-origin is the
// only caller this API has.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, TEST_ORIGIN } from './helpers/harness.mjs';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

test('a preflight is answered without invoking the handler', async () => {
  const res = await h.anon('OPTIONS', '/api/appointments', { origin: TEST_ORIGIN });

  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), TEST_ORIGIN);
  assert.match(res.headers.get('Access-Control-Allow-Methods'), /POST/);
  assert.match(res.headers.get('Access-Control-Allow-Headers'), /Authorization/);
});

test('an unapproved origin is granted nothing', async () => {
  for (const origin of ['https://evil.example', 'http://drsumyapervin.com', 'null']) {
    const res = await h.anon('OPTIONS', '/api/appointments', { origin });
    assert.equal(
      res.headers.get('Access-Control-Allow-Origin'),
      null,
      `${origin} was granted an allow-origin header`
    );
  }
});

test('Vary: Origin is always set, so a permissive response is never cached for everyone', async () => {
  const withOrigin = await h.anon('GET', '/api/config/public', { origin: TEST_ORIGIN });
  const without = await h.anon('GET', '/api/config/public');

  assert.match(withOrigin.headers.get('Vary'), /Origin/);
  assert.match(without.headers.get('Vary'), /Origin/);
});

test('the CORS headers reach real responses, not only preflights', async () => {
  const res = await h.anon('GET', '/api/config/public', { origin: TEST_ORIGIN });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), TEST_ORIGIN);
});

test('an authenticated response is not shared with a foreign origin', async () => {
  const res = await h.asAdmin('GET', '/api/appointments', { headers: { Origin: 'https://evil.example' } });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
});

test('an unset ALLOWED_ORIGIN grants no origin at all', async () => {
  const broken = await createHarness({ bindings: { ALLOWED_ORIGIN: '' } });
  try {
    const res = await broken.anon('OPTIONS', '/api/appointments', { origin: TEST_ORIGIN });
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
  } finally {
    await broken.dispose();
  }
});
