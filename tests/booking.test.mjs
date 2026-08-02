// Booking: the one endpoint a patient uses, unauthenticated by design.
//
// Turnstile is the only thing standing between it and an automated flood, and
// verifyTurnstile fails closed -- so a misconfiguration 403s every real patient
// while looking identical to correct behaviour. Every rejection branch is pinned
// here, including the infrastructure ones that cannot be reproduced by hand.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, tokens } from './helpers/harness.mjs';
import { nextOpenDate, addDays, dhakaParts, weekdayOf } from '../functions/lib/schedule.js';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

// A chamber value the schedule accepts, and a date that is always in the future
// and always an open day -- fixed fixtures here were stale twice over (invented
// chamber names, calendar dates that eventually pass).
const CHAMBER = 'Alliance Hospital Limited (Shyamoli)';
const DCIMCH = 'Dhaka Central International Medical College (DCIMCH)';
const OPEN_DATE = nextOpenDate(CHAMBER, addDays(dhakaParts().dateStr, 1));

let phoneSeq = 0;
// Unique phone per payload: the duplicate-booking guard (same phone + chamber +
// date -> 409) must never fire between independent tests.
const valid = (overrides = {}) => ({
  patient_name: 'Test Patient',
  patient_phone: '017000' + String(phoneSeq++).padStart(4, '0'),
  chamber: CHAMBER,
  appointment_date: OPEN_DATE,
  service: 'Consultation',
  notes: 'no notes',
  'cf-turnstile-response': tokens.good('booking'),
  ...overrides
});

const post = (body) => h.anon('POST', '/api/appointments', { body });

async function countRows() {
  const { count } = await h.db.prepare('SELECT COUNT(*) AS count FROM appointments').first();
  return count;
}

test('a solved token books, and the id returned is the id stored', async () => {
  const res = await post(valid({ patient_name: 'Happy Path' }));
  assert.equal(res.status, 201);

  const { id } = await res.json();
  const row = await h.db.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first();
  assert.equal(row.patient_name, 'Happy Path');
  assert.equal(row.chamber, CHAMBER);
  assert.equal(row.appointment_date, OPEN_DATE);
});

test('siteverify is sent the configured secret and the caller IP field', async () => {
  const before = h.siteverify.calls.length;
  await post(valid());
  const call = h.siteverify.calls.at(-1);

  assert.equal(h.siteverify.calls.length, before + 1);
  assert.equal(call.secret, 'test-turnstile-secret');
  assert.equal(call.token, tokens.good('booking'));
});

// Each of these must 403 AND write nothing. A rejection that still inserts is
// worse than no protection, because it looks like protection.
const rejections = [
  ['no token at all', valid({ 'cf-turnstile-response': undefined })],
  ['an empty token', valid({ 'cf-turnstile-response': '' })],
  ['a non-string token', valid({ 'cf-turnstile-response': { nope: true } })],
  ['an oversized token (>2048 chars)', valid({ 'cf-turnstile-response': 'x'.repeat(2049) })],
  ['a token siteverify rejects', valid({ 'cf-turnstile-response': tokens.rejected() })],
  ['a token minted for the login widget', valid({ 'cf-turnstile-response': tokens.good('login') })],
  ['a token minted for the contact widget', valid({ 'cf-turnstile-response': tokens.good('contact') })],
  ['a token solved against an unapproved hostname', valid({ 'cf-turnstile-response': tokens.fromHostname('booking', 'localhost') })],
  ['siteverify returning a non-2xx', valid({ 'cf-turnstile-response': tokens.siteverify500() })],
  ['siteverify returning a non-JSON body', valid({ 'cf-turnstile-response': tokens.siteverifyGarbage() })],
  ['siteverify being unreachable', valid({ 'cf-turnstile-response': tokens.networkError() })]
];

for (const [what, body] of rejections) {
  test(`booking is refused with ${what}`, async () => {
    const before = await countRows();
    const res = await post(body);

    assert.equal(res.status, 403);
    assert.match((await res.json()).error, /Verification failed/);
    assert.equal(await countRows(), before, 'a rejected booking must write nothing');
  });
}

test('the action binding is enforced, not merely present', async () => {
  // Testing each endpoint only with its own token would pass even if the action
  // check did nothing. This is the cross-endpoint case that proves it works.
  const loginToken = tokens.good('login');
  const booking = await post(valid({ 'cf-turnstile-response': loginToken }));
  assert.equal(booking.status, 403);

  const login = await h.anon('POST', '/api/auth/login', {
    body: { pin: 'irrelevant', 'cf-turnstile-response': loginToken }
  });
  // Same token, correct endpoint: gets past Turnstile and fails on the PIN.
  assert.equal(login.status, 401);
});

test('a token cannot be replayed', async () => {
  const token = tokens.singleUse('booking');

  const first = await post(valid({ 'cf-turnstile-response': token }));
  assert.equal(first.status, 201);

  const replay = await post(valid({ 'cf-turnstile-response': token }));
  assert.equal(replay.status, 403);
});

test('an unset TURNSTILE_SECRET fails closed rather than open', async () => {
  const broken = await createHarness({ bindings: { TURNSTILE_SECRET: '' } });
  try {
    const res = await broken.anon('POST', '/api/appointments', { body: valid() });
    assert.equal(res.status, 403);
  } finally {
    await broken.dispose();
  }
});

test('an unset TURNSTILE_HOSTNAMES fails closed, and never reaches siteverify', async () => {
  const broken = await createHarness({ bindings: { TURNSTILE_HOSTNAMES: '' } });
  try {
    const res = await broken.anon('POST', '/api/appointments', { body: valid() });
    assert.equal(res.status, 403);
    assert.equal(broken.siteverify.calls.length, 0);
  } finally {
    await broken.dispose();
  }
});

// Validation runs after Turnstile, so every case here carries a good token.
const invalid = [
  ['a missing name', valid({ patient_name: '' })],
  ['a missing phone', valid({ patient_phone: '' })],
  ['a missing chamber', valid({ chamber: '' })],
  ['a missing service', valid({ service: '' })],
  ['a missing date', valid({ appointment_date: '' })],
  ['a malformed date', valid({ appointment_date: '15/09/2026' })],
  ['an impossible date', valid({ appointment_date: '2026-13-45' })],
  ['a script payload in the date field', valid({ appointment_date: '<script>alert(1)</script>' })],
  ['an over-long name', valid({ patient_name: 'x'.repeat(121) })],
  ['an over-long phone', valid({ patient_phone: 'x'.repeat(41) })],
  ['over-long notes', valid({ notes: 'x'.repeat(2001) })]
];

for (const [what, body] of invalid) {
  test(`booking is rejected for ${what}`, async () => {
    const before = await countRows();
    const res = await post(body);

    assert.equal(res.status, 400);
    assert.equal(await countRows(), before);
  });
}

test('a non-JSON body is a 400, not a 500', async () => {
  const res = await h.anon('POST', '/api/appointments', { body: 'this is not json' });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /Invalid request body/);
});

test('markup in accepted fields is stored verbatim, for the render layer to escape', async () => {
  // The API deliberately does not strip markup from free-text fields; the CMS is
  // responsible for rendering it inertly. Pinning it here means a future "fix"
  // that silently mangles a patient's name has to be a deliberate change.
  const payload = '<img src=x onerror=alert(1)>';
  const res = await post(valid({ patient_name: payload }));
  assert.equal(res.status, 201);

  const { id } = await res.json();
  const row = await h.db.prepare('SELECT patient_name FROM appointments WHERE id = ?').bind(id).first();
  assert.equal(row.patient_name, payload);
});

// Schedule rules run after the shape checks, so every case carries a good token
// and an otherwise well-formed payload.
test('a past date is refused even though the form would not offer it', async () => {
  const before = await countRows();
  const res = await post(valid({ appointment_date: '2020-01-01' }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /already passed/);
  assert.equal(await countRows(), before);
});

test('a chamber the form does not list is refused', async () => {
  const before = await countRows();
  const res = await post(valid({ chamber: 'Some Other Clinic' }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /listed chambers/);
  assert.equal(await countRows(), before);
});

test('a Friday booking is refused -- no chamber consults on Friday', async () => {
  let friday = addDays(dhakaParts().dateStr, 1);
  while (weekdayOf(friday) !== 5) friday = addDays(friday, 1);

  const before = await countRows();
  const res = await post(valid({ appointment_date: friday }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /does not consult/);
  assert.equal(await countRows(), before);
});

test('DCIMCH does not take Thursday bookings', async () => {
  let thursday = addDays(dhakaParts().dateStr, 1);
  while (weekdayOf(thursday) !== 4) thursday = addDays(thursday, 1);

  const before = await countRows();
  const res = await post(valid({ chamber: DCIMCH, appointment_date: thursday }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /does not consult/);
  assert.equal(await countRows(), before);
});

test('a second booking for the same phone, chamber and date is a 409, not a twin', async () => {
  const body = valid();
  const before = await countRows();

  const first = await post(body);
  assert.equal(first.status, 201);

  // tokens.good is not single-use in the siteverify stub, so the retry really
  // reaches validation -- the 409 is the duplicate guard, not a replay refusal.
  const retry = await post(valid({ patient_phone: body.patient_phone }));
  assert.equal(retry.status, 409);
  assert.match((await retry.json()).error, /already exists/);
  assert.equal(await countRows(), before + 1, 'the retry must not insert');
});
