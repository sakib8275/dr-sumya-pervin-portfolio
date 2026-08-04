import { requireAuth, readJson, json } from '../../lib/auth.js';
import { loggedWrite } from '../../lib/log.js';

export async function onRequestPut(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { status } = body;
  if (!['Pending', 'Confirmed', 'Completed'].includes(status)) {
    return json({ error: 'Invalid status' }, 400);
  }

  const { id } = context.params;
  const result = await loggedWrite('appointment.status', { id, status }, () =>
    context.env.DB.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind(status, id).run()
  );
  if (result.meta.changes === 0) return json({ error: 'Appointment not found' }, 404);

  return json({ success: true });
}

export async function onRequestDelete(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const { id } = context.params;
  // The one write with no undo. Logging it is the only record that the row ever
  // existed once D1 no longer holds it.
  const result = await loggedWrite('appointment.delete', { id }, () =>
    context.env.DB.prepare('DELETE FROM appointments WHERE id = ?').bind(id).run()
  );
  if (result.meta.changes === 0) return json({ error: 'Appointment not found' }, 404);

  return json({ success: true });
}
