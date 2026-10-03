import { requireAuth, readJson, json } from '../../lib/auth.js';
import { verifyTurnstile } from '../../lib/turnstile.js';
import { validateSlot, CHAMBERS } from '../../lib/schedule.js';
import { loggedWrite, logWrite } from '../../lib/log.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LIMITS = { patient_name: 120, patient_phone: 40, chamber: 120, service: 120, notes: 2000 };
// Phase 2 booking tiers (migrations/004). Optional: the one-pager omits them.
const TIERS = ['Specialist Consultation', 'Comprehensive Assessment', 'Signature Skin & Hair Review', 'Procedure Assessment', 'Private Consultation'];
// Each chamber runs exactly one session (functions/lib/schedule.js), so the
// whitelist is the set of those — a session exists only when a chamber does.
const SESSIONS = Object.values(CHAMBERS).map((c) => c.session);

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const { results } = await context.env.DB
    .prepare('SELECT * FROM appointments ORDER BY created_at DESC')
    .all();
  return json(results);
}

// Unauthenticated by design — patients book without an account. That makes every
// field here attacker-controlled, and these rows are rendered in the admin panel,
// so validate at the boundary rather than trusting the form.
export async function onRequestPost(context) {
  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  // Anonymous by design, so nothing else stops an automated flood of bookings
  // landing in the doctor's appointment log.
  const ts = await verifyTurnstile(context, 'booking', body['cf-turnstile-response']);
  if (ts) return ts;

  const f = {};
  for (const key of Object.keys(LIMITS)) f[key] = String(body[key] || '').trim();
  const appointment_date = String(body.appointment_date || '').trim();
  const consultation_type = String(body.consultation_type || '').trim();
  const preferred_session = String(body.preferred_session || '').trim();

  // The tiers are a fixed list, so an unknown value is a caller error, not a
  // free-text field. Rejecting here keeps the CMS and digest from ever showing
  // a tier the practice does not offer.
  if (consultation_type && !TIERS.includes(consultation_type)) {
    return json({ error: 'Unknown consultation type' }, 400);
  }
  if (preferred_session && !SESSIONS.includes(preferred_session)) {
    return json({ error: 'Unknown preferred session' }, 400);
  }

  if (!f.patient_name || !f.patient_phone || !f.chamber || !appointment_date || !f.service) {
    return json({ error: 'Missing required fields' }, 400);
  }

  for (const [key, max] of Object.entries(LIMITS)) {
    if (f[key].length > max) return json({ error: `${key} is too long` }, 400);
  }

  if (!DATE_RE.test(appointment_date) || Number.isNaN(Date.parse(appointment_date))) {
    return json({ error: 'appointment_date must be a valid YYYY-MM-DD date' }, 400);
  }

  // The phone is the only way the practice can reach the patient back, and the
  // client-side check is not one: main.js's validatePhone() strips every
  // non-digit and then tests a character class that includes digits, so it only
  // ever counted length -- and any caller can skip the form entirely. Without
  // this, 'aaaa' stored fine and the CMS row then rendered a WhatsApp button
  // pointing at https://wa.me/ with no number: a dead control on the one row the
  // doctor needs to act on. 15 is the E.164 maximum; 7 admits short national
  // formats without admitting junk.
  const phoneDigits = f.patient_phone.replace(/[^0-9]/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return json({ error: 'Please enter a valid mobile number, for example 01712345678.' }, 400);
  }

  // Chamber schedule: only the listed chambers, only on consultation days, and
  // same-day bookings close 30 minutes before consultation starts.
  const slotError = validateSlot(f.chamber, appointment_date);
  if (slotError) return json({ error: slotError }, 400);

  // One booking per patient per chamber per day. A retry after a transport
  // blip (or a double tap before the client guard attached) must not twin the
  // appointment. The reference in the message is the patient's own existing row.
  const duplicate = await context.env.DB
    .prepare('SELECT id FROM appointments WHERE patient_phone = ? AND appointment_date = ? AND chamber = ? LIMIT 1')
    .bind(f.patient_phone, appointment_date, f.chamber)
    .first();
  if (duplicate) {
    // The reference id is deliberately NOT echoed to the caller. This endpoint
    // is unauthenticated, so returning it let anyone who supplied a phone number
    // confirm that its owner has a dermatology appointment at a named chamber on
    // a given date -- and handed them its reference. Turnstile rate-limits that
    // probe; it does not make the disclosure acceptable. The id goes to the log
    // instead, which is where the operator looks anyway.
    logWrite('appointment.duplicate', { id: duplicate.id, chamber: f.chamber, appointment_date });
    return json({
      error: `A booking already exists for this number at this chamber on ${appointment_date}. Please contact the chamber if you need to change it.`
    }, 409);
  }

  // The /book/ form's "Send me reminders" box is pre-ticked by owner design
  // (docx behavioural defaults: reminders on, one tap to untick). There is no
  // reminders column, so an opt-out travels where staff already read before
  // messaging anyone: the front of the notes. Only an explicit false opts out;
  // the one-pager and older clients omit the field and keep the default.
  if (body.reminders === false) {
    f.notes = f.notes ? `[No reminders] ${f.notes}` : '[No reminders]';
  }

  const id = 'book-' + crypto.randomUUID().slice(0, 8);
  // Logged with the id, chamber and date only. The patient's name, phone and
  // notes stay out of the log stream on purpose -- see functions/lib/log.js.
  await loggedWrite(
    'appointment.create',
    { id, chamber: f.chamber, appointment_date, service: f.service },
    () =>
      context.env.DB.prepare(
        'INSERT INTO appointments (id, patient_name, patient_phone, chamber, appointment_date, service, notes, consultation_type, preferred_session) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, f.patient_name, f.patient_phone, f.chamber, appointment_date, f.service, f.notes, consultation_type, preferred_session).run()
  );

  return json({ id, message: 'Appointment created successfully' }, 201);
}
