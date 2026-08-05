import { requireAuth, readJson, json } from '../../../lib/auth.js';
import { verifyTotp } from '../../../lib/totp.js';
import { loggedWrite } from '../../../lib/log.js';

export async function onRequestPost(context) {
  const authErr = await requireAuth(context.request, context.env);
  if (authErr) return authErr;

  const body = await readJson(context.request);
  if (!body || typeof body.code !== 'string') {
    return json({ error: 'Code is required.' }, 400);
  }

  const row = await context.env.DB
    .prepare('SELECT totp_secret FROM admin_settings WHERE id = 1')
    .first();

  if (!row || !row.totp_secret) {
    return json({ error: 'Setup must be initiated first.' }, 400);
  }

  const isValid = await verifyTotp(row.totp_secret, body.code);
  if (!isValid) {
    return json({ error: 'Invalid code.' }, 400);
  }

  await context.env.DB
    .prepare('UPDATE admin_settings SET totp_enabled = 1, updated_at = datetime("now") WHERE id = 1')
    .run();

  await loggedWrite('auth.twofa.enabled', {}, () => Promise.resolve());

  return json({ success: true, message: '2FA successfully enabled.' });
}
