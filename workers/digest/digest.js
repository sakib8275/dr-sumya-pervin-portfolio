// F8 — daily per-chamber appointment digest: all the logic, none of the runtime.
//
// Everything here is pure and importable from plain Node, which is what lets
// tests/digest.test.mjs exercise it with a stubbed D1 and a captured email
// payload. The only thing living in index.js is the `cloudflare:email` import
// and the `scheduled()` entry point, because neither can be imported outside
// workerd.
//
// Chamber names, consultation times and the 30-minute cutoff are NOT restated
// here: they come from functions/lib/schedule.js, the same module the booking
// validator uses. The cron expressions are derived from it too (cronForChamber
// below), so a schedule change cannot leave the digest firing at the old time
// while bookings close at the new one -- the wrangler.toml crons are asserted
// against these derived strings in the test suite.
import { CHAMBERS, CUTOFF_MIN, dhakaParts } from '../../functions/lib/schedule.js';

const DHAKA_OFFSET_MIN = 6 * 60;

// Cloudflare's cron parser rejects NUMERIC day-of-week outright: "30 8 * * 0-3,6"
// and "30 8 * * 0,1,2,3,6" both fail with `10100: invalid cron string`, while
// "30 8 * * SUN-WED,SAT" is accepted. Verified against the schedules API on
// 2026-08-03 -- the numeric form the original scaffold shipped with could never
// have deployed. Standard-cron intuition does not apply here; use the names.
const CRON_DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Compresses [6,0,1,2,3] to "SUN-WED,SAT".
function cronDays(days) {
  const sorted = [...days].sort((a, b) => a - b);
  const parts = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (const day of sorted.slice(1).concat(Infinity)) {
    if (day !== prev + 1) {
      parts.push(
        start === prev
          ? CRON_DAY_NAMES[start]
          : `${CRON_DAY_NAMES[start]}-${CRON_DAY_NAMES[prev]}`
      );
      start = day;
    }
    prev = day;
  }
  return parts.join(',');
}

/**
 * The cron expression that fires this chamber's digest: its booking cutoff
 * (consultation start minus CUTOFF_MIN), expressed in UTC, on the days it
 * consults. Both cutoffs land in the UTC afternoon of the same UTC day as the
 * Dhaka day (14:30 Dhaka = 08:30 UTC, 16:30 Dhaka = 10:30 UTC), so the Dhaka
 * weekday and the UTC weekday agree and the day list needs no shifting. A
 * schedule that moved a cutoff across UTC midnight would break that assumption
 * -- the guard below fails loudly rather than silently emailing on the wrong day.
 */
export function cronForChamber(chamber) {
  const c = CHAMBERS[chamber];
  if (!c) throw new Error(`unknown chamber: ${chamber}`);

  const utcMinutes = c.startMin - CUTOFF_MIN - DHAKA_OFFSET_MIN;
  if (utcMinutes < 0 || utcMinutes >= 24 * 60) {
    throw new Error(
      `${chamber}'s cutoff crosses UTC midnight; cronDays() would need a day shift`
    );
  }

  return `${utcMinutes % 60} ${Math.floor(utcMinutes / 60)} * * ${cronDays(c.days)}`;
}

/** cron expression -> chamber key, derived (never hand-typed). */
export const CRON_CHAMBERS = Object.fromEntries(
  Object.keys(CHAMBERS).map((chamber) => [cronForChamber(chamber), chamber])
);

/** The chamber a fired cron belongs to, or null if it is not one of ours. */
export function chamberForCron(cron) {
  return CRON_CHAMBERS[cron] ?? null;
}

/**
 * Today's date in Dhaka (UTC+6, no DST) as YYYY-MM-DD. `new Date()` inside a
 * Worker is UTC: at the 10:30 UTC Alliance cutoff that happens to agree with
 * Dhaka, but relying on that would silently break the moment a cutoff or a
 * retry lands after 18:00 UTC. dhakaParts() is the booking path's own helper.
 */
export function dhakaToday(now = new Date()) {
  return dhakaParts(now).dateStr;
}

/**
 * The chamber's appointments for a Dhaka date, oldest booking first.
 *
 * Column names are the real ones from migrations/001_schema.sql
 * (patient_name / patient_phone / appointment_date). SELECT name ... against
 * production fails with "no such column: name".
 */
export async function fetchAppointments(db, chamber, dateStr) {
  const { results } = await db
    .prepare(
      `SELECT patient_name, patient_phone, service, notes, status, created_at
         FROM appointments
        WHERE appointment_date = ? AND chamber = ?
        ORDER BY created_at ASC`
    )
    .bind(dateStr, chamber)
    .all();

  return results ?? [];
}

export function buildSubject(chamber, dateStr, rows) {
  const { short } = CHAMBERS[chamber];
  const count = rows.length;
  return `${short} — ${count} appointment${count === 1 ? '' : 's'} for ${dateStr}`;
}

/**
 * The digest body. An empty day still produces a full message: T11 makes the
 * mail unconditional because a silent morning is indistinguishable from a
 * broken cron, and the doctor would find out by an unexpected patient.
 */
export function buildBody(chamber, dateStr, rows) {
  const c = CHAMBERS[chamber];
  const lines = [
    `Daily appointment digest`,
    `Chamber: ${chamber}`,
    `Date:    ${dateStr} (Dhaka)`,
    `Hours:   ${c.scheduleLabel}`,
    ``,
    `Bookings: ${rows.length}`,
    ``
  ];

  if (rows.length === 0) {
    lines.push('No appointments were booked for today.');
  } else {
    rows.forEach((row, i) => {
      lines.push(`${i + 1}. ${row.patient_name} — ${row.patient_phone}`);
      lines.push(`   Service: ${row.service}`);
      lines.push(`   Status:  ${row.status}`);
      if (row.notes) lines.push(`   Notes:   ${row.notes}`);
      lines.push('');
    });
  }

  lines.push('');
  lines.push('Bookings close 30 minutes before consultation starts; this digest is');
  lines.push('sent at that cutoff, so the list above is final for the day.');
  lines.push('');
  lines.push('— drsumyapervin.com');

  return lines.join('\n');
}

// RFC 5322 date, e.g. "Sun, 02 Aug 2026 10:30:00 +0000". Built by hand because
// toUTCString() emits "GMT", which some strict MTAs reject in a Date header.
const RFC_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RFC_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function rfc5322Date(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${RFC_DAYS[d.getUTCDay()]}, ${p(d.getUTCDate())} ${RFC_MONTHS[d.getUTCMonth()]} ` +
    `${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} +0000`;
}

// base64 of the UTF-8 bytes, wrapped at 76 columns per RFC 2045. The body is
// sent base64 rather than raw 8-bit because patient names and notes are free
// text and may be Bengali; an unencoded multi-byte body is not valid 7-bit
// SMTP content and gets mangled or bounced.
function base64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/(.{76})/g, '$1\r\n');
}

/**
 * A complete RFC 5322 message. The legacy `send_email` binding takes raw MIME,
 * not an object, so this is what actually goes on the wire.
 */
export function buildMimeMessage({ from, to, subject, body, now = new Date(), messageId }) {
  const domain = from.split('@')[1] || 'localhost';
  const id = messageId ?? `<${crypto.randomUUID()}@${domain}>`;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Message-ID: ${id}`,
    `Date: ${rfc5322Date(now)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64Utf8(body)
  ].join('\r\n');
}

/**
 * The whole scheduled run, with the email transport injected so tests can
 * capture the payload instead of sending it.
 *
 * Returns a result object (never throws for expected conditions) describing
 * what happened, so both the Worker log and the tests read the same outcome.
 *
 * @param {object} args
 * @param {{cron: string, scheduledTime?: number}} args.event
 * @param {{DB: object, DIGEST_FROM?: string, DIGEST_TO?: string}} args.env
 * @param {(msg: {from: string, to: string, subject: string, body: string, raw: string}) => Promise<any>} args.send
 * @param {Date} [args.now]
 */
export async function runDigest({ event, env, send, now = new Date() }) {
  const chamber = chamberForCron(event.cron);

  // An unrecognised cron used to fall through to an "Unknown Chamber" email.
  // Emailing the doctor a digest for a chamber that does not exist is worse
  // than sending nothing: log it and stop.
  if (!chamber) {
    console.error(`digest: unrecognised cron "${event.cron}" — no email sent`);
    return { sent: false, reason: 'unknown-cron', cron: event.cron };
  }

  const from = env.DIGEST_FROM || '';
  const to = env.DIGEST_TO || '';
  if (!from || !to) {
    // Human prereq (HUMAN-TASKS Task 13): Email Routing enabled, destination
    // verified, sender created. Until then there is nowhere to send.
    console.error(
      `digest: DIGEST_FROM/DIGEST_TO not configured — ${chamber} digest not sent`
    );
    return { sent: false, reason: 'not-configured', chamber };
  }

  const dateStr = dhakaToday(now);
  const rows = await fetchAppointments(env.DB, chamber, dateStr);
  const subject = buildSubject(chamber, dateStr, rows);
  const body = buildBody(chamber, dateStr, rows);
  const raw = buildMimeMessage({ from, to, subject, body, now });

  try {
    await send({ from, to, subject, body, raw });
  } catch (err) {
    // Surfaced in Workers logs; the cron will try again at the next cutoff.
    console.error(`digest: send failed for ${chamber} on ${dateStr}: ${err?.stack || err}`);
    return { sent: false, reason: 'send-failed', chamber, dateStr, count: rows.length, error: String(err) };
  }

  console.log(`digest: sent ${chamber} ${dateStr} (${rows.length} bookings) to ${to}`);
  return { sent: true, chamber, dateStr, count: rows.length, subject, body, raw };
}
