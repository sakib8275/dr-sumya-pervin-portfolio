// F11 — the structured D1 write logs, and the one property that matters about
// them: they must never carry patient data or a secret.
//
// This is not a formatting test. Logs persist independently of D1, are visible
// to anyone with dashboard read, and survive any deletion the doctor performs in
// the CMS. A name or phone number that reaches them has effectively left the
// system. The redaction list in functions/lib/log.js is defence in depth behind
// "callers do not pass these"; this suite is what stops a future edit quietly
// removing either.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logWrite, loggedWrite } from '../functions/lib/log.js';

// Captures console.log for the duration of fn, returning the parsed lines.
async function capture(fn) {
  const original = console.log;
  const lines = [];
  console.log = (line) => lines.push(line);
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return lines.map((l) => JSON.parse(l));
}

test('a log line is a single JSON object with an event and a timestamp', async () => {
  const [entry] = await capture(() => logWrite('appointment.create', { id: 'book-abc123' }));

  assert.equal(entry.evt, 'appointment.create');
  assert.equal(entry.id, 'book-abc123');
  assert.ok(!Number.isNaN(Date.parse(entry.ts)), 'ts must be a parseable timestamp');
});

test('patient fields and secrets are stripped even when a caller passes them', async () => {
  const [entry] = await capture(() =>
    logWrite('appointment.create', {
      id: 'book-abc123',
      chamber: 'Alliance Hospital Limited (Shyamoli)',
      patient_name: 'Real Patient Name',
      patient_phone: '01711000000',
      notes: 'a private medical complaint',
      pin: '12345678',
      pin_hash: 'deadbeef',
      token: 'secret-token',
      Authorization: 'Bearer xyz'
    })
  );

  // Operational fields survive...
  assert.equal(entry.id, 'book-abc123');
  assert.equal(entry.chamber, 'Alliance Hospital Limited (Shyamoli)');

  // ...and nothing identifying does, under any casing.
  for (const banned of ['patient_name', 'patient_phone', 'notes', 'pin', 'pin_hash', 'token', 'Authorization']) {
    assert.ok(!(banned in entry), `${banned} must not appear as a key`);
  }

  const serialised = JSON.stringify(entry);
  for (const value of ['Real Patient Name', '01711000000', 'a private medical complaint', '12345678', 'deadbeef', 'secret-token', 'Bearer xyz']) {
    assert.ok(!serialised.includes(value), `the value "${value}" must not appear anywhere in the line`);
  }
});

test('loggedWrite returns the write result and records success with a duration', async () => {
  let result;
  const [entry] = await capture(async () => {
    result = await loggedWrite('gallery.create', { id: 'item-1' }, async () => ({ meta: { changes: 1 } }));
  });

  assert.deepEqual(result, { meta: { changes: 1 } }, 'loggedWrite must be transparent to the caller');
  assert.equal(entry.evt, 'gallery.create');
  assert.equal(entry.ok, true);
  assert.equal(typeof entry.ms, 'number');
});

test('a failed write is logged and the error still propagates', async () => {
  let thrown = null;
  const [entry] = await capture(async () => {
    try {
      await loggedWrite('appointment.create', { id: 'book-fail' }, async () => {
        throw new Error('D1_ERROR: no such column: patient_nmae');
      });
    } catch (err) {
      thrown = err;
    }
  });

  // The re-throw is the point: a logger that swallowed this would turn a failed
  // booking into a 201 and the patient would believe they had an appointment.
  assert.ok(thrown instanceof Error, 'the original error must reach the caller');
  assert.match(thrown.message, /no such column/);

  assert.equal(entry.evt, 'appointment.create');
  assert.equal(entry.ok, false);
  assert.match(entry.error, /no such column/);
});

test('the error message is logged but never the stack', async () => {
  // A D1 error's stack can carry bound values, which on the booking path are
  // patient data. The message names the column; the stack names the patient.
  const [entry] = await capture(async () => {
    try {
      await loggedWrite('appointment.create', {}, async () => {
        const err = new Error('constraint failed');
        err.stack = 'Error: constraint failed\n    at bind("Real Patient Name", "01711000000")';
        throw err;
      });
    } catch {
      /* expected */
    }
  });

  assert.equal(entry.error, 'constraint failed');
  assert.ok(!JSON.stringify(entry).includes('Real Patient Name'), 'the stack must not be logged');
});
