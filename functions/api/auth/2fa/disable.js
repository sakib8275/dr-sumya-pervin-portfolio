import { requireAuth, hashPin, safeEqual, readJson, json } from '../../../lib/auth.js';
import { verifyTotp } from '../../../lib/totp.js';
import { loggedWrite } from '../../../lib/log.js';

export async function onRequestPost(context) {
  const authErr = await requireAuth(context.request, context.env);
  if (authErr) return authErr;

  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { current_pin, code } = body;
  if (!current_pin || typeof current_pin !== 'string' || !code || typeof code !== 'string') {
    return json({ error: 'Current PIN and 6-digit 2FA code are required.' }, 400);
  }

  const row = await context.env.DB
    .prepare('SELECT pin_hash, pin_salt, totp_secret, totp_enabled FROM admin_settings WHERE id = 1')
    .first();

  if (!row || !row.pin_salt || row.totp_enabled !== 1 || !row.totp_secret) {
    return json({ error: '2FA is not enabled or credentials invalid.' }, 400);
  }

  const inputHash = await hashPin(current_pin, row.pin_salt);
  if (!safeEqual(inputHash, row.pin_hash)) {
    return json({ error: 'Incorrect PIN' }, 401);
  }

  const isValidCode = await verifyTotp(row.totp_secret, code);
  if (!isValidCode) {
    return json({ error: 'Invalid 2FA code' }, 400);
  }

  await context.env.DB
    .prepare('UPDATE admin_settings SET totp_secret = "", totp_enabled = 0, updated_at = datetime("now") WHERE id = 1')
    .run();

  await loggedWrite('auth.twofa.disabled', {}, () => Promise.resolve());

  return json({ success: true, message: '2FA disabled.' });
}
