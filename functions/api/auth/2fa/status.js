import { requireAuth, json } from '../../../lib/auth.js';

export async function onRequestGet(context) {
  const authErr = await requireAuth(context.request, context.env);
  if (authErr) return authErr;

  const row = await context.env.DB
    .prepare('SELECT totp_enabled FROM admin_settings WHERE id = 1')
    .first();

  return json({ enabled: !!(row && row.totp_enabled === 1) });
}
