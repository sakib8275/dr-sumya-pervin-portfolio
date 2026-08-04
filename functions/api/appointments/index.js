import { requireAuth, readJson, json } from '../../lib/auth.js';
import { verifyTurnstile } from '../../lib/turnstile.js';
import { validateSlot } from '../../lib/schedule.js';
import { loggedWrite } from '../../lib/log.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LIMITS = { patient_name: 120, patient_phone: 40, chamber: 120, service: 120, notes: 2000 };

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

  if (!f.patient_name || !f.patient_phone || !f.chamber || !appointment_date || !f.service) {
    return json({ error: 'Missing required fields' }, 400);
  }

  for (const [key, max] of Object.entries(LIMITS)) {
    if (f[key].length > max) return json({ error: `${key} is too long` }, 400);
  }

  if (!DATE_RE.test(appointment_date) || Number.isNaN(Date.parse(appointment_date))) {
    return json({ error: 'appointment_date must be a valid YYYY-MM-DD date' }, 400);
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
    return json({
      error: `A booking already exists for this number at this chamber on ${appointment_date} (reference ${duplicate.id}).`
    }, 409);
  }

  const id = 'book-' + crypto.randomUUID().slice(0, 8);
  // Logged with the id, chamber and date only. The patient's name, phone and
  // notes stay out of the log stream on purpose -- see functions/lib/log.js.
  await loggedWrite(
    'appointment.create',
    { id, chamber: f.chamber, appointment_date, service: f.service },
    () =>
      context.env.DB.prepare(
        'INSERT INTO appointments (id, patient_name, patient_phone, chamber, appointment_date, service, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, f.patient_name, f.patient_phone, f.chamber, appointment_date, f.service, f.notes).run()
  );

  return json({ id, message: 'Appointment created successfully' }, 201);
}
