import { requireAuth, json } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const { results } = await context.env.DB.prepare('SELECT * FROM appointments ORDER BY created_at DESC').all();
  return json(results);
}

export async function onRequestPost(context) {
  const { patient_name, patient_phone, chamber, appointment_date, service, notes } = await context.request.json();
  if (!patient_name || !patient_phone || !chamber || !appointment_date || !service) {
    return json({ error: 'Missing required fields' }, 400);
  }

  const id = 'book-' + crypto.randomUUID().slice(0, 8);
  await context.env.DB.prepare(
    'INSERT INTO appointments (id, patient_name, patient_phone, chamber, appointment_date, service, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, patient_name, patient_phone, chamber, appointment_date, service, notes || '').run();

  return json({ id, message: 'Appointment created successfully' }, 201);
}
