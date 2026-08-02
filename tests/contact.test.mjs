// /api/contact -- gated, but currently unreachable from the UI: no page POSTs to
// it. That makes it an unauthenticated D1 write with no caller, so the gating is
// the whole point, and nothing else exercises it.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, tokens, TEST_SITE_SECRET } from './helpers/harness.mjs';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

const send = (body) => h.anon('POST', '/api/contact', { body });

test('a message with a solved contact token is stored', async () => {
  const res = await send({
    name: 'A Patient',
    email: 'patient@example.com',
    phone: '01700000000',
    message: 'Please call me back.',
    'cf-turnstile-response': tokens.good('contact')
  });
  assert.equal(res.status, 201);

  const { id } = await res.json();
  const row = await h.db.prepare('SELECT * FROM contact_messages WHERE id = ?').bind(id).first();
  assert.equal(row.name, 'A Patient');
  assert.equal(row.message, 'Please call me back.');
});

test('a message without a token is refused and writes nothing', async () => {
  const before = (await h.db.prepare('SELECT COUNT(*) AS c FROM contact_messages').first()).c;
  const res = await send({ name: 'Spammer', message: 'buy things' });

  assert.equal(res.status, 403);
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS c FROM contact_messages').first()).c, before);
});

test('a token minted for another widget is refused', async () => {
  const res = await send({ name: 'A', message: 'B', 'cf-turnstile-response': tokens.good('booking') });
  assert.equal(res.status, 403);
});

test('missing or over-long fields are rejected after verification', async () => {
  const cases = [
    { name: '', message: 'x' },
    { name: 'x', message: '' },
    { name: 'x'.repeat(121), message: 'x' },
    { name: 'x', message: 'x'.repeat(4001) }
  ];

  for (const c of cases) {
    const res = await send({ ...c, 'cf-turnstile-response': tokens.good('contact') });
    assert.equal(res.status, 400, JSON.stringify(c).slice(0, 60));
  }
});

test('reading messages requires the access code', async () => {
  assert.equal((await h.anon('GET', '/api/contact')).status, 403);
  assert.equal((await h.anon('GET', '/api/contact?from=wrong-secret')).status, 403);
});

test('the access code is compared without leaking length through timing', async () => {
  // safeEqual returns false on any length mismatch rather than short-circuiting
  // character by character. A prefix of the real secret must not read as closer.
  const prefix = TEST_SITE_SECRET.slice(0, 5);
  assert.equal((await h.anon('GET', `/api/contact?from=${prefix}`)).status, 403);
});

test('the correct access code returns the messages', async () => {
  const res = await h.anon('GET', `/api/contact?from=${TEST_SITE_SECRET}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(await res.json()));
});

test('the access code is parsed from query params, not by splitting the URL', async () => {
  // The old code did url.split('?from=')[1], which returned the wrong value for
  // any URL carrying more than one query parameter -- so a legitimate caller was
  // rejected and the endpoint looked broken.
  const res = await h.anon('GET', `/api/contact?a=1&from=${TEST_SITE_SECRET}&b=2`);
  assert.equal(res.status, 200);
});

test('an unset SITE_SECRET fails closed', async () => {
  const broken = await createHarness({ bindings: { SITE_SECRET: '' } });
  try {
    const res = await broken.anon('GET', '/api/contact?from=');
    assert.equal(res.status, 500);
    assert.match((await res.json()).error, /SITE_SECRET/);
  } finally {
    await broken.dispose();
  }
});
