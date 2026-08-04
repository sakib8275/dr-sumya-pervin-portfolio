// F11 — one-line JSON logs on the D1 write paths.
//
// Why structured and not console.log('booked ' + id): these lines are read in
// Cloudflare's Workers Logs UI, which indexes JSON fields and can filter on
// them. A prose line is greppable at best; `evt = "appointment.create"` is
// queryable, which is the difference between "was there a burst of failures at
// 3am" taking a second and taking an afternoon.
//
// ⚠️ WHAT MUST NEVER GO IN HERE
//
// Logs are the widest-access surface this system has -- anyone with dashboard
// read can see every line, they persist independently of D1, and they are not
// covered by any deletion the doctor performs in the CMS. So:
//
//   NEVER log patient_name, patient_phone, notes, the admin PIN or any hash,
//   JWT_SECRET / SITE_SECRET / TURNSTILE_SECRET, or a Turnstile token.
//
// What IS logged is the row id, the chamber, the date and the outcome: enough
// to answer "did that write land, and how long did it take" without turning the
// log stream into a second copy of the patient database. The digest email is
// deliberately the ONLY place patient details leave the system, because it goes
// to one verified address the owner chose.
//
// Failures are logged with the error's message, not the error object: a D1
// error's message can name a column, which is useful, but its stack can carry
// bound values -- which are patient data on this path.

const REDACTED_KEYS = new Set([
  'patient_name', 'patient_phone', 'notes', 'pin', 'pin_hash', 'pin_salt',
  'password', 'token', 'cf-turnstile-response', 'authorization'
]);

/**
 * Emits one JSON line.
 *
 * @param {string} evt   dot-namespaced event, e.g. 'appointment.create'
 * @param {object} fields operational fields only -- see the header
 */
export function logWrite(evt, fields = {}) {
  const safe = {};
  for (const [key, value] of Object.entries(fields)) {
    // A defence in depth, not the primary control: callers are supposed to not
    // pass these at all. If one ever does, this keeps it out of the log rather
    // than trusting every future edit to remember the rule.
    if (REDACTED_KEYS.has(key.toLowerCase())) continue;
    safe[key] = value;
  }
  console.log(JSON.stringify({ evt, ts: new Date().toISOString(), ...safe }));
}

/**
 * Wraps a D1 write so both outcomes are logged with a duration, and re-throws.
 *
 * Returning the result and re-throwing on failure keeps this a pure observer:
 * adding logging must never change what a route does, and a logger that
 * swallowed an error would turn a failed booking into a silent success.
 */
export async function loggedWrite(evt, fields, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    logWrite(evt, { ...fields, ok: true, ms: Date.now() - started });
    return result;
  } catch (err) {
    logWrite(evt, { ...fields, ok: false, ms: Date.now() - started, error: err && err.message });
    throw err;
  }
}
