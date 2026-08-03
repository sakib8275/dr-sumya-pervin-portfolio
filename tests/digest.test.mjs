// F8 — the daily digest Worker, unit-tested against a stubbed D1 and a captured
// email payload.
//
// Not a Miniflare test: workers/digest/index.js imports `cloudflare:email`,
// which only resolves inside workerd, so all the logic lives in digest.js and is
// exercised here directly. What index.js adds on top is the transport, and the
// only way to verify that is a real send (blocked on the human Email Routing
// prereqs -- HUMAN-TASKS Task 13).
//
// Reference calendar: 2026-08-02 is a Sunday; both chambers consult on Sundays.
// Alliance: Sat-Thu, consultation 17:00 Dhaka, cutoff 16:30 = 10:30 UTC.
// DCIMCH:   Sat-Wed, consultation 15:00 Dhaka, cutoff 14:30 = 08:30 UTC.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  cronForChamber, chamberForCron, dhakaToday, buildSubject, buildBody,
  buildMimeMessage, runDigest
} from '../workers/digest/digest.js';

const ALLIANCE = 'Alliance Hospital Limited (Shyamoli)';
const DCIMCH = 'Dhaka Central International Medical College (DCIMCH)';
// Day-of-week must be names, not numbers: Cloudflare's schedules API rejects
// "30 8 * * 0-3,6" with `10100: invalid cron string` (checked live 2026-08-03).
const ALLIANCE_CRON = '30 10 * * SUN-THU,SAT';
const DCIMCH_CRON = '30 8 * * SUN-WED,SAT';

// Two bookings, deliberately out of insertion order in the fixture so an
// assertion on ordering is meaningful only if the SQL asks for created_at ASC.
const rows = [
  {
    patient_name: 'Rahima Khatun',
    patient_phone: '01712345678',
    service: 'Consultation',
    notes: 'first visit',
    status: 'Confirmed',
    created_at: '2026-08-02 09:00:00'
  },
  {
    patient_name: 'Md. Karim',
    patient_phone: '01898765432',
    service: 'Follow-up',
    notes: '',
    status: 'Pending',
    created_at: '2026-08-02 11:30:00'
  }
];

/**
 * Minimal D1 stand-in. Records every prepare/bind so the query itself can be
 * asserted -- the scaffold's bug was a query that was syntactically fine and
 * wrong about the schema, which no amount of result-shape checking would catch.
 */
function stubDb(results = []) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const call = { sql, bindings: [] };
      calls.push(call);
      return {
        bind(...bindings) {
          call.bindings = bindings;
          return this;
        },
        async all() {
          return { results };
        }
      };
    }
  };
}

/** Captures what would have been emailed instead of sending it. */
function capture() {
  const sent = [];
  return { sent, send: async (message) => { sent.push(message); } };
}

const env = (db, over = {}) => ({
  DB: db,
  DIGEST_FROM: 'digest@drsumyapervin.com',
  DIGEST_TO: 'doctor@example.com',
  ...over
});

// --- schedule wiring ---------------------------------------------------------

test('the deployed crons are exactly the ones derived from schedule.js', async () => {
  const toml = await readFile(new URL('../workers/digest/wrangler.toml', import.meta.url), 'utf8');
  const line = toml.match(/^crons\s*=\s*\[(.*)\]$/m);
  assert.ok(line, 'wrangler.toml has no crons array');

  const deployed = [...line[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const derived = [cronForChamber(DCIMCH), cronForChamber(ALLIANCE)];

  // If this fails, schedule.js moved and wrangler.toml did not: the digest would
  // fire at the old cutoff while bookings close at the new one.
  assert.deepEqual(deployed.sort(), derived.sort());
});

test('each cron is its chamber cutoff in UTC, on the days that chamber consults', () => {
  assert.equal(cronForChamber(DCIMCH), DCIMCH_CRON);   // 14:30 Dhaka, Sat-Wed
  assert.equal(cronForChamber(ALLIANCE), ALLIANCE_CRON); // 16:30 Dhaka, Sat-Thu
});

test('crons route to the right chamber, and anything else routes nowhere', () => {
  assert.equal(chamberForCron(DCIMCH_CRON), DCIMCH);
  assert.equal(chamberForCron(ALLIANCE_CRON), ALLIANCE);
  assert.equal(chamberForCron('0 0 * * *'), null);
  assert.equal(chamberForCron(undefined), null);
});

// --- the query ---------------------------------------------------------------

test('the SELECT uses the real schema columns, filters by both keys, and orders by created_at', async () => {
  const db = stubDb(rows);
  await runDigest({
    event: { cron: ALLIANCE_CRON },
    env: env(db),
    send: capture().send,
    now: new Date('2026-08-02T10:30:00Z')
  });

  assert.equal(db.calls.length, 1, 'the digest must issue exactly one query');
  const { sql, bindings } = db.calls[0];

  for (const column of ['patient_name', 'patient_phone', 'appointment_date', 'created_at']) {
    assert.ok(sql.includes(column), `query is missing ${column}`);
  }
  // The scaffold selected `name`/`phone` and filtered on `date`; against
  // production that is "no such column: name" at first fire.
  assert.ok(!/\bSELECT\b[\s\S]*?\bname\b\s*,/i.test(sql.replace(/patient_name/g, 'X')),
    'query still selects a bare `name` column');
  assert.ok(/ORDER BY\s+created_at\s+ASC/i.test(sql));
  assert.deepEqual(bindings, ['2026-08-02', ALLIANCE]);
});

test('the digest never writes to D1', async () => {
  const db = stubDb(rows);
  await runDigest({
    event: { cron: DCIMCH_CRON },
    env: env(db),
    send: capture().send,
    now: new Date('2026-08-02T08:30:00Z')
  });

  for (const verb of ['INSERT', 'UPDATE', 'DELETE', 'DROP']) {
    assert.ok(!db.calls[0].sql.toUpperCase().includes(verb), `query contains ${verb}`);
  }
});

test('each cron asks for its own chamber only', async () => {
  for (const [cron, chamber] of [[DCIMCH_CRON, DCIMCH], [ALLIANCE_CRON, ALLIANCE]]) {
    const db = stubDb([]);
    const result = await runDigest({
      event: { cron },
      env: env(db),
      send: capture().send,
      now: new Date('2026-08-02T08:30:00Z')
    });

    assert.equal(db.calls[0].bindings[1], chamber);
    assert.equal(result.chamber, chamber);
  }
});

// --- Dhaka time --------------------------------------------------------------

test('"today" is the Dhaka date, not the UTC one', () => {
  // 19:30 UTC is already 01:30 the next day in Dhaka (UTC+6).
  assert.equal(dhakaToday(new Date('2026-08-02T19:30:00Z')), '2026-08-03');
  assert.equal(dhakaToday(new Date('2026-08-02T18:00:00Z')), '2026-08-03');
  assert.equal(dhakaToday(new Date('2026-08-02T17:59:59Z')), '2026-08-02');
});

test('a run after 18:00 UTC digests the Dhaka day it is actually in', async () => {
  const db = stubDb([]);
  await runDigest({
    event: { cron: ALLIANCE_CRON },
    env: env(db),
    send: capture().send,
    // A retry or a manual trigger at 00:30 Dhaka = 18:30 UTC the previous day.
    now: new Date('2026-08-02T18:30:00Z')
  });

  assert.equal(db.calls[0].bindings[0], '2026-08-03');
});

// --- the message -------------------------------------------------------------

test('an empty day still sends, and says so', async () => {
  const db = stubDb([]);
  const mail = capture();
  const result = await runDigest({
    event: { cron: DCIMCH_CRON },
    env: env(db),
    send: mail.send,
    now: new Date('2026-08-02T08:30:00Z')
  });

  // T11: silence is indistinguishable from a broken cron, so 0 bookings is
  // still a mail.
  assert.equal(result.sent, true);
  assert.equal(result.count, 0);
  assert.equal(mail.sent.length, 1);
  assert.match(mail.sent[0].subject, /0 appointments for 2026-08-02/);
  assert.match(mail.sent[0].body, /No appointments were booked for today\./);
});

test('the body lists every booking with name, phone, service and status, in query order', () => {
  const body = buildBody(ALLIANCE, '2026-08-02', rows);

  assert.match(body, /Bookings: 2/);
  assert.ok(body.indexOf('Rahima Khatun') < body.indexOf('Md. Karim'), 'row order not preserved');
  assert.match(body, /Rahima Khatun — 01712345678/);
  assert.match(body, /Service: Consultation/);
  assert.match(body, /Status:  Confirmed/);
  assert.match(body, /Notes:   first visit/);
  assert.match(body, /Md\. Karim — 01898765432/);
  assert.match(body, /Status:  Pending/);
});

test('an empty notes field produces no Notes line', () => {
  const body = buildBody(ALLIANCE, '2026-08-02', [rows[1]]);
  assert.ok(!body.includes('Notes:'), 'blank notes rendered a Notes line');
});

test('the subject names the chamber, the count and the date', () => {
  assert.equal(
    buildSubject(DCIMCH, '2026-08-02', []),
    'DCIMCH — 0 appointments for 2026-08-02'
  );
  assert.equal(
    buildSubject(ALLIANCE, '2026-08-02', [rows[0]]),
    'Alliance Hospital — 1 appointment for 2026-08-02'
  );
});

test('the raw MIME message is well formed and round-trips a non-ASCII body', () => {
  const body = buildBody(ALLIANCE, '2026-08-02', [
    { ...rows[0], patient_name: 'রাহিমা খাতুন' }
  ]);
  const raw = buildMimeMessage({
    from: 'digest@drsumyapervin.com',
    to: 'doctor@example.com',
    subject: 'test',
    body,
    now: new Date('2026-08-02T10:30:00Z'),
    messageId: '<fixed@drsumyapervin.com>'
  });

  const [headers, encoded] = raw.split('\r\n\r\n');
  assert.match(headers, /^From: digest@drsumyapervin\.com$/m);
  assert.match(headers, /^To: doctor@example\.com$/m);
  assert.match(headers, /^Subject: test$/m);
  assert.match(headers, /^Message-ID: <fixed@drsumyapervin\.com>$/m);
  assert.match(headers, /^Date: Sun, 02 Aug 2026 10:30:00 \+0000$/m);
  assert.match(headers, /^Content-Transfer-Encoding: base64$/m);
  assert.ok(!headers.includes('\n\n'), 'headers must be CRLF-separated');

  // Bengali names are why the body is base64 and not 8-bit: an unencoded
  // multi-byte body is not valid SMTP content.
  const decoded = Buffer.from(encoded.replace(/\r\n/g, ''), 'base64').toString('utf8');
  assert.equal(decoded, body);
  for (const line of encoded.split('\r\n')) {
    assert.ok(line.length <= 76, 'base64 line exceeds the RFC 2045 limit');
  }
});

// --- refusals ----------------------------------------------------------------

test('an unrecognised cron sends nothing and does not touch D1', async () => {
  const db = stubDb(rows);
  const mail = capture();
  const result = await runDigest({
    event: { cron: '0 3 * * *' },
    env: env(db),
    send: mail.send,
    now: new Date('2026-08-02T03:00:00Z')
  });

  // The scaffold emailed a digest for "Unknown Chamber" here.
  assert.equal(result.sent, false);
  assert.equal(result.reason, 'unknown-cron');
  assert.equal(mail.sent.length, 0);
  assert.equal(db.calls.length, 0);
});

test('with no configured sender or recipient it refuses rather than sending', async () => {
  for (const over of [{ DIGEST_TO: '' }, { DIGEST_FROM: '' }, { DIGEST_TO: undefined }]) {
    const db = stubDb(rows);
    const mail = capture();
    const result = await runDigest({
      event: { cron: ALLIANCE_CRON },
      env: env(db, over),
      send: mail.send,
      now: new Date('2026-08-02T10:30:00Z')
    });

    assert.equal(result.sent, false);
    assert.equal(result.reason, 'not-configured');
    assert.equal(mail.sent.length, 0);
  }
});

test('a transport failure is reported, not swallowed', async () => {
  const db = stubDb(rows);
  const result = await runDigest({
    event: { cron: ALLIANCE_CRON },
    env: env(db),
    send: async () => { throw new Error('destination address not verified'); },
    now: new Date('2026-08-02T10:30:00Z')
  });

  assert.equal(result.sent, false);
  assert.equal(result.reason, 'send-failed');
  assert.match(result.error, /not verified/);
});
