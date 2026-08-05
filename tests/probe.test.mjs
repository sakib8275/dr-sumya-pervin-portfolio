// F11 — the Cloudflare-native uptime probe Worker, unit-tested against a stubbed
// fetch and a stubbed D1 with a captured email payload.
//
// Not a Miniflare test: workers/probe/index.js imports `cloudflare:email`, which
// only resolves inside workerd, so all the logic lives in probe.js and is
// exercised here directly. What index.js adds on top is the transport, and the
// only way to verify that is a real send (blocked on the verified Email Routing
// destination the digest already uses).
//
// The alerting contract under test: mail on the DOWN transition and on the
// RECOVERY transition, never on a healthy probe, never on a mid-outage retry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DEFAULT_PROBE_URL, hasExpectedShape, probeOnce, buildDownSubject, buildDownBody,
  buildRecoveredSubject, buildRecoveredBody, runProbe
} from '../workers/probe/probe.js';

const HEALTHY_JSON = JSON.stringify({ whatsapp: '8801725196101', telegram: '+8801725196101' });

/** Minimal D1 stand-in; the probe reads one row (.first) and upserts one (.run). */
function stubDb({ firstRow = null } = {}) {
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
        async first() {
          return firstRow;
        },
        async run() {
          return { success: true };
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

/** A fetch stand-in returning a fixed status/body/headers. */
function jsonFetch(status, body, headers = {}) {
  return async () => ({
    status,
    async text() {
      return body;
    },
    headers: {
      get(name) {
        const lower = name.toLowerCase();
        return { 'content-type': 'application/json', ...headers }[lower] ?? null;
      }
    }
  });
}

const NOW = new Date('2026-08-05T15:00:00.000Z');
const baseEnv = () => ({
  PROBE_FROM: 'digest@drsumyapervin.com',
  PROBE_TO: 'dr.enamtalha@gmail.com',
  PROBE_URL: DEFAULT_PROBE_URL
});

test('a healthy probe from clean state sends nothing and records 0 failures', async () => {
  const db = stubDb({ firstRow: null });
  const { sent, send } = capture();
  const result = await runProbe({
    env: { ...baseEnv(), DB: db },
    send,
    fetch: jsonFetch(200, HEALTHY_JSON),
    now: NOW
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.alert, null);
  assert.equal(sent.length, 0);

  const write = db.calls.find((c) => c.sql.includes('ON CONFLICT(id)'));
  assert.ok(write, 'expected a state upsert');
  assert.deepEqual(write.bindings, [1, 0, NOW.toISOString(), NOW.toISOString(), '']);
});

test('the first failure sends one DOWN email and records 1 failure', async () => {
  const db = stubDb({ firstRow: null });
  const { sent, send } = capture();
  const result = await runProbe({
    env: { ...baseEnv(), DB: db },
    send,
    fetch: jsonFetch(403, 'forbidden', { 'cf-mitigated': 'block' }),
    now: NOW
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 403);
  assert.equal(result.consecutiveFailures, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].kind, 'down');
  assert.match(sent[0].subject, /DOWN/);
  assert.match(sent[0].subject, /403/);
  assert.match(sent[0].body, /cf-mitigated: block/);
  assert.match(sent[0].body, /forbidden/);
});

test('a mid-outage retry is silent and keeps counting', async () => {
  const db = stubDb({ firstRow: { consecutive_failures: 1, last_ok_at: '', last_fail_at: NOW.toISOString() } });
  const { sent, send } = capture();
  const result = await runProbe({
    env: { ...baseEnv(), DB: db },
    send,
    fetch: jsonFetch(503, 'unavailable'),
    now: NOW
  });

  assert.equal(result.ok, false);
  assert.equal(result.consecutiveFailures, 2);
  assert.equal(sent.length, 0);
});

test('recovery after failures sends one RECOVERED email and resets the counter', async () => {
  const db = stubDb({ firstRow: { consecutive_failures: 3, last_ok_at: '', last_fail_at: NOW.toISOString() } });
  const { sent, send } = capture();
  const result = await runProbe({
    env: { ...baseEnv(), DB: db },
    send,
    fetch: jsonFetch(200, HEALTHY_JSON),
    now: NOW
  });

  assert.equal(result.ok, true);
  assert.equal(result.consecutiveFailures, 0);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].kind, 'recovered');
  assert.match(sent[0].subject, /back online/);
  assert.match(sent[0].body, /3/);
});

test('healthy after healthy is silent', async () => {
  const db = stubDb({ firstRow: { consecutive_failures: 0, last_ok_at: NOW.toISOString(), last_fail_at: '' } });
  const { sent, send } = capture();
  const result = await runProbe({
    env: { ...baseEnv(), DB: db },
    send,
    fetch: jsonFetch(200, HEALTHY_JSON),
    now: NOW
  });

  assert.equal(result.ok, true);
  assert.equal(sent.length, 0);
});

test('a 200 with the wrong shape is a DOWN, not a pass', async () => {
  // The homepage returns 200; a catch-all could too. Only the JSON contract counts.
  const db = stubDb({ firstRow: null });
  const { sent, send } = capture();
  const result = await runProbe({
    env: { ...baseEnv(), DB: db },
    send,
    fetch: jsonFetch(200, '<!DOCTYPE html><html>…homepage…</html>'),
    now: NOW
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 200);
  assert.equal(sent.length, 1);
});

test('a fetch that throws is a DOWN with status 0', async () => {
  const db = stubDb({ firstRow: null });
  const { sent, send } = capture();
  const result = await runProbe({
    env: { ...baseEnv(), DB: db },
    send,
    fetch: async () => { throw new Error('ETIMEDOUT'); },
    now: NOW
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 0);
  assert.equal(sent.length, 1);
  assert.match(sent[0].body, /ETIMEDOUT/);
});

test('without PROBE_FROM/PROBE_TO it probes but refuses to email', async () => {
  const db = stubDb({ firstRow: null });
  const { sent, send } = capture();
  const result = await runProbe({
    env: { PROBE_FROM: '', PROBE_TO: '', DB: db },
    send,
    fetch: jsonFetch(403, 'forbidden'),
    now: NOW
  });

  assert.equal(result.ok, false);
  assert.equal(sent.length, 0);
});

test('a state read failure does not stop the probe', async () => {
  const db = stubDb({ firstRow: null });
  db.prepare = () => {
    return {
      bind() { return this; },
      async first() { throw new Error('no such table: uptime_state'); },
      async run() { return { success: true }; }
    };
  };
  const { sent, send } = capture();
  const result = await runProbe({
    env: { ...baseEnv(), DB: db },
    send,
    fetch: jsonFetch(200, HEALTHY_JSON),
    now: NOW
  });

  assert.equal(result.ok, true);
  assert.equal(sent.length, 0);
});

test('hasExpectedShape accepts the contract and rejects anything else', () => {
  assert.equal(hasExpectedShape(HEALTHY_JSON), true);
  assert.equal(hasExpectedShape(JSON.stringify({ whatsapp: '' })), false);
  assert.equal(hasExpectedShape(JSON.stringify({ whatsapp: '', telegram: '' })), true);
  assert.equal(hasExpectedShape('not json'), false);
  assert.equal(hasExpectedShape('<html>'), false);
  assert.equal(hasExpectedShape(''), false);
});

test('probeOnce surfaces status, a cf-mitigated header and a body snippet', async () => {
  const outcome = await probeOnce(
    jsonFetch(403, 'blocked body', { 'cf-mitigated': 'challenge' }),
    DEFAULT_PROBE_URL,
    NOW.toISOString()
  );

  assert.equal(outcome.ok, false);
  assert.equal(outcome.status, 403);
  assert.equal(outcome.headers['cf-mitigated'], 'challenge');
  assert.equal(outcome.bodySnippet, 'blocked body');
});

test('buildDownBody names the URL, time and a snippet', () => {
  const outcome = {
    ts: NOW.toISOString(),
    status: 502,
    headers: { 'content-type': 'text/html' },
    bodySnippet: '<h1>Bad Gateway</h1>'
  };
  const body = buildDownBody({ url: DEFAULT_PROBE_URL, outcome });
  assert.match(body, new RegExp(DEFAULT_PROBE_URL));
  assert.match(body, /502/);
  assert.match(body, /Bad Gateway/);
});

test('the probe wrangler.toml carries a 30-min cron and no public URL', async () => {
  const toml = await readFile(new URL('../workers/probe/wrangler.toml', import.meta.url), 'utf8');
  assert.match(toml, /crons = \["\*\/30 \* \* \* \*"\]/);
  assert.match(toml, /workers_dev = false/);
  assert.match(toml, /binding = "DB"/);
  assert.match(toml, /name = "EMAIL"/);
  assert.match(toml, /PROBE_FROM = "digest@drsumyapervin.com"/);
  assert.match(toml, /PROBE_TO = "dr\.enamtalha@gmail\.com"/);
});
