import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from './helpers/harness.mjs';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

test('GET /api/content returns empty object initially', async () => {
  const res = await h.anon('GET', '/api/content');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, {});
});

test('PUT /api/content rejects unauthenticated requests', async () => {
  const res = await h.anon('PUT', '/api/content', {
    body: { 'hero.headline': 'New Headline' }
  });
  assert.equal(res.status, 401);
});

test('PUT /api/content rejects invalid or disallowed keys', async () => {
  const res = await h.asAdmin('PUT', '/api/content', {
    body: { 'unallowed.key': 'Hacked' }
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('Disallowed or invalid content key'));
});

test('PUT /api/content persists allowed scalar & array keys and GET reflects changes', async () => {
  const payload = {
    'hero.headline': 'Advanced Dermatologist & Laser Specialist',
    'hero.tagline': 'Providing world-class medical and cosmetic skincare solutions.',
    'chambers': [
      { name: 'Alliance Hospital', address: 'Shyamoli', hours: '5-8 PM' }
    ]
  };

  const resPut = await h.asAdmin('PUT', '/api/content', { body: payload });
  assert.equal(resPut.status, 200);
  const dataPut = await resPut.json();
  assert.equal(dataPut.success, true);
  assert.equal(dataPut.updated.length, 3);

  // Read back via public GET
  const resGet = await h.anon('GET', '/api/content');
  assert.equal(resGet.status, 200);
  const dataGet = await resGet.json();
  assert.equal(dataGet['hero.headline'], payload['hero.headline']);
  assert.equal(dataGet['hero.tagline'], payload['hero.tagline']);
  assert.deepEqual(dataGet['chambers'], payload['chambers']);

  // Update scalar to empty string -> deletes row (falls back to default)
  const resClear = await h.asAdmin('PUT', '/api/content', {
    body: { 'hero.headline': '' }
  });
  assert.equal(resClear.status, 200);

  const resGetAfter = await h.anon('GET', '/api/content');
  const dataGetAfter = await resGetAfter.json();
  assert.equal(dataGetAfter['hero.headline'], undefined);
  assert.equal(dataGetAfter['hero.tagline'], payload['hero.tagline']);
});
