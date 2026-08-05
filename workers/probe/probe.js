// F11 — Cloudflare-native uptime probe: all the logic, none of the runtime.
//
// The scheduled uptime monitor on GitHub Actions can never pass: the zone's
// Bot Fight Mode (auto-enabled, not disableable on this plan) challenges
// GitHub Actions' Azure IPs with a 403 while real browsers get 200 — 9
// consecutive scheduled runs failed exactly that way before this Worker
// existed. A Worker subrequest to the same zone originates from Cloudflare's
// own network and is the vantage point the monitor actually needs.
//
// Everything here is pure and importable from plain Node so
// tests/probe.test.mjs can exercise it with a stubbed fetch and a stubbed D1.
// The only things living in index.js are the `cloudflare:email` import and the
// `scheduled()` entry point, because neither can be imported outside workerd.
//
// Alerting is on STATE TRANSITIONS, not on every probe, so an outage mails the
// doctor once (when it starts) and once again when it recovers; every healthy
// probe and every mid-outage retry stays silent. Consecutive-failure state
// lives in a single row of uptime_state (migrations/002_uptime_state.sql).
import { buildMimeMessage } from '../lib/email.js';

export const DEFAULT_PROBE_URL = 'https://drsumyapervin.com/api/config/public';
const STATE_ID = 1;

export async function loadState(db) {
  return db
    .prepare(
      'SELECT consecutive_failures, last_check, last_ok_at, last_fail_at FROM uptime_state WHERE id = ?'
    )
    .bind(STATE_ID)
    .first();
}

export async function saveState(db, { consecutiveFailures, lastCheck, lastOkAt, lastFailAt }) {
  await db
    .prepare(
      `INSERT INTO uptime_state (id, consecutive_failures, last_check, last_ok_at, last_fail_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         consecutive_failures = excluded.consecutive_failures,
         last_check = excluded.last_check,
         last_ok_at = excluded.last_ok_at,
         last_fail_at = excluded.last_fail_at`
    )
    .bind(STATE_ID, consecutiveFailures, lastCheck, lastOkAt, lastFailAt)
    .run();
}

// The endpoint's contract (the same shape the GH workflow asserts): a 200 alone
// is not a result — a catch-all can return the homepage with a 200 — so the
// body must actually be the JSON object with the two contact fields.
export function hasExpectedShape(bodyText) {
  let json;
  try {
    json = JSON.parse(bodyText);
  } catch {
    return false;
  }
  return json !== null && typeof json === 'object' && 'whatsapp' in json && 'telegram' in json;
}

// Probe the live endpoint once. Returns the raw outcome; runProbe decides what
// to do with it. fetchImpl is injected so tests can stub it.
export async function probeOnce(fetchImpl, url, nowIso) {
  try {
    const res = await fetchImpl(url, { method: 'GET', redirect: 'follow' });
    const bodyText = await res.text();
    const headers = { 'content-type': res.headers.get('content-type') || '' };
    const cfMitigated = res.headers.get('cf-mitigated');
    if (cfMitigated) headers['cf-mitigated'] = cfMitigated;

    return {
      ok: res.status === 200 && hasExpectedShape(bodyText),
      status: res.status,
      headers,
      bodySnippet: bodyText.slice(0, 500),
      ts: nowIso
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      headers: {},
      bodySnippet: `fetch failed: ${err?.message || String(err)}`,
      ts: nowIso
    };
  }
}

export function buildDownSubject(outcome) {
  return `⚠️ drsumyapervin.com DOWN — /api/config/public ${outcome.status}`;
}

export function buildDownBody({ url, outcome }) {
  const head = Object.entries(outcome.headers)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');
  return [
    `The Cloudflare-native probe stopped getting a healthy /api/config/public.`,
    ``,
    `URL:      ${url}`,
    `Time:     ${outcome.ts} UTC`,
    `Status:   ${outcome.status === 0 ? 'no response' : outcome.status}`,
    head ? `Headers:\n${head}` : 'Headers:   (none)',
    ``,
    `Body (first 500 chars):`,
    outcome.bodySnippet || '(empty)',
    ``,
    `This probe runs from Cloudflare's own network, so this is NOT the GitHub-`,
    `Actions 403 (that one is Bot Fight Mode challenging the runner's IP). A`,
    `DOWN here while the site loads in a browser means the Function, its D1`,
    `binding, or the route itself is broken.`,
    ``,
    `The probe will keep checking every 30 minutes and will mail once more when`,
    `the site recovers.`,
    ``,
    `— the drsumyapervin.com uptime probe`
  ].join('\n');
}

export function buildRecoveredSubject() {
  return '✅ drsumyapervin.com back online';
}

export function buildRecoveredBody({ url, ts, failures }) {
  return [
    `The Cloudflare-native probe is healthy again.`,
    ``,
    `URL:      ${url}`,
    `Time:     ${ts} UTC`,
    `Unhealthy probes before recovery: ${failures}`,
    ``,
    `No action needed.`,
    ``,
    `— the drsumyapervin.com uptime probe`
  ].join('\n');
}

/**
 * The whole scheduled run, with the email transport injected so tests can
 * capture the payload instead of sending it.
 *
 * @param {object} args
 * @param {{DB: object, PROBE_URL?: string, PROBE_FROM?: string, PROBE_TO?: string}} args.env
 * @param {(msg: {from: string, to: string, subject: string, body: string, raw: string}) => Promise<any>} args.send
 * @param {typeof fetch} [args.fetch]
 * @param {Date} [args.now]
 */
export async function runProbe({ env, send, fetch: fetchImpl = fetch, now = new Date() }) {
  const from = env.PROBE_FROM || '';
  const to = env.PROBE_TO || '';
  const url = env.PROBE_URL || DEFAULT_PROBE_URL;
  const nowIso = now.toISOString();

  let state = { consecutive_failures: 0, last_ok_at: '', last_fail_at: '' };
  try {
    const row = await loadState(env.DB);
    if (row) state = row;
  } catch (err) {
    // Never let a state read failure take the probe down with it — it means a
    // migration is missing (see migrations/002_uptime_state.sql), not that the
    // site is down. Proceed with defaults and log loudly.
    console.error(`probe: could not read uptime_state: ${err?.stack || err}`);
  }

  const outcome = await probeOnce(fetchImpl, url, nowIso);
  const prevFailures = Number(state.consecutive_failures) || 0;
  const nowDown = !outcome.ok;
  const wasDown = prevFailures > 0;
  const consecutiveFailures = nowDown ? prevFailures + 1 : 0;

  let email = null;
  if (!from || !to) {
    console.error('probe: PROBE_FROM/PROBE_TO not configured — alert not sent');
  } else if (nowDown && !wasDown) {
    const subject = buildDownSubject(outcome);
    const body = buildDownBody({ url, outcome });
    const raw = buildMimeMessage({ from, to, subject, body, now });
    email = { kind: 'down', from, to, subject, body, raw };
  } else if (!nowDown && wasDown) {
    const subject = buildRecoveredSubject();
    const body = buildRecoveredBody({ url, ts: nowIso, failures: prevFailures });
    const raw = buildMimeMessage({ from, to, subject, body, now });
    email = { kind: 'recovered', from, to, subject, body, raw };
  }
  // still-down and healthy-and-healthy both stay silent by design.

  if (email) {
    try {
      await send(email);
    } catch (err) {
      // The alert is the whole point of this Worker; a failed send must be
      // visible in the logs and re-attempted next run.
      console.error(`probe: alert send failed: ${err?.stack || err}`);
      email = null;
    }
  }

  try {
    await saveState(env.DB, {
      consecutiveFailures,
      lastCheck: nowIso,
      lastOkAt: outcome.ok ? nowIso : state.last_ok_at || '',
      lastFailAt: outcome.ok ? state.last_fail_at || '' : nowIso
    });
  } catch (err) {
    console.error(`probe: could not write uptime_state: ${err?.stack || err}`);
  }

  console.log(
    `probe: ${outcome.ok ? 'ok' : `DOWN (status ${outcome.status})`} ` +
      `failures=${consecutiveFailures} alert=${email?.kind ?? 'none'}`
  );

  return {
    ok: outcome.ok,
    status: outcome.status,
    url,
    ts: nowIso,
    consecutiveFailures,
    alert: email?.kind ?? null
  };
}
