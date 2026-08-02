// The anonymous surface, pinned route by route.
//
// This file exists because of G09: a regression that hid the practice's WhatsApp
// contact from every visitor survived a full audit, because the audit was carried
// out while logged in. Anything that changes what a patient with no credentials
// sees must break a test here.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, tokens } from './helpers/harness.mjs';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

// status alone is not a result -- each case also asserts on the body, because a
// 200 can be an asset fallback and a 404 can be a route that no longer exists.
const surface = [
  {
    what: 'published contact channels are readable without logging in',
    method: 'GET', path: '/api/config/public', status: 200,
    body: (b) => assert.deepEqual(Object.keys(b).sort(), ['telegram', 'whatsapp'])
  },
  {
    what: 'the admin settings route is not',
    method: 'GET', path: '/api/config', status: 401,
    body: (b) => assert.match(b.error, /Unauthorized/)
  },
  {
    what: 'patient records are not readable',
    method: 'GET', path: '/api/appointments', status: 401,
    body: (b) => assert.match(b.error, /Unauthorized/)
  },
  {
    what: 'the public gallery is readable',
    method: 'GET', path: '/api/gallery', status: 200,
    body: (b) => assert.ok(Array.isArray(b))
  },
  {
    what: 'auth check reports not-authenticated rather than erroring',
    method: 'GET', path: '/api/auth/check', status: 200,
    body: (b) => assert.equal(b.authenticated, false)
  },
  {
    what: 'booking without a Turnstile token is refused',
    method: 'POST', path: '/api/appointments', status: 403,
    send: { patient_name: 'A', patient_phone: '1', chamber: 'c', appointment_date: '2026-09-01', service: 's' },
    body: (b) => assert.match(b.error, /Verification failed/)
  },
  {
    what: 'login without a Turnstile token is refused before the PIN is touched',
    method: 'POST', path: '/api/auth/login', status: 403,
    send: { pin: 'anything' },
    body: (b) => assert.match(b.error, /Verification failed/)
  },
  {
    what: 'the contact endpoint is refused without a Turnstile token',
    method: 'POST', path: '/api/contact', status: 403,
    send: { name: 'A', message: 'hello' },
    body: (b) => assert.match(b.error, /Verification failed/)
  },
  {
    what: 'gallery writes require auth, not just a Turnstile token',
    method: 'POST', path: '/api/gallery', status: 401,
    send: { title: 'x', category: 'clinic' },
    body: (b) => assert.match(b.error, /Unauthorized/)
  },
  {
    what: 'appointment status cannot be changed anonymously',
    method: 'PUT', path: '/api/appointments/book-does-not-exist', status: 401,
    send: { status: 'Confirmed' },
    body: (b) => assert.match(b.error, /Unauthorized/)
  },
  {
    what: 'appointments cannot be deleted anonymously',
    method: 'DELETE', path: '/api/appointments/book-does-not-exist', status: 401,
    body: (b) => assert.match(b.error, /Unauthorized/)
  },
  {
    what: 'gallery items cannot be deleted anonymously',
    method: 'DELETE', path: '/api/gallery/item-does-not-exist', status: 401,
    body: (b) => assert.match(b.error, /Unauthorized/)
  },
  {
    what: 'stored contact messages need the access code',
    method: 'GET', path: '/api/contact', status: 403,
    body: (b) => assert.match(b.error, /Invalid access code/)
  }
];

for (const c of surface) {
  test(`anonymous: ${c.what} (${c.method} ${c.path} -> ${c.status})`, async () => {
    const res = await h.anon(c.method, c.path, c.send ? { body: c.send } : {});
    assert.equal(res.status, c.status, `${c.method} ${c.path}`);
    c.body(await res.json());
  });
}

test('anonymous: a patient can complete a booking end to end', async () => {
  const before = h.siteverify.calls.length;

  const res = await h.anon('POST', '/api/appointments', {
    body: {
      patient_name: 'Anonymous Patient',
      patient_phone: '01700000000',
      chamber: 'Alliance Hospital Shyamoli',
      appointment_date: '2026-09-15',
      service: 'Consultation',
      notes: '',
      'cf-turnstile-response': tokens.good('booking')
    }
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.match(body.id, /^book-[0-9a-f]{8}$/);

  // The row must really exist. A 201 with nothing written is exactly the class of
  // false pass this suite is here to prevent.
  const row = await h.db.prepare('SELECT * FROM appointments WHERE id = ?').bind(body.id).first();
  assert.equal(row.patient_name, 'Anonymous Patient');
  assert.equal(row.status, 'Pending');

  // ...and verification must actually have happened, not been short-circuited.
  assert.equal(h.siteverify.calls.length, before + 1);
});

test('anon() refuses to send credentials, so no test can accidentally authenticate', () => {
  assert.throws(
    () => h.anon('GET', '/api/appointments', { headers: { Authorization: 'Bearer x' } }),
    /must never send Authorization/
  );
});
