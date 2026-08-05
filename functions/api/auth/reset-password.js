import { hashPin, newSalt, readJson, json } from '../../lib/auth.js';
import { verifyTurnstile } from '../../lib/turnstile.js';
import { hashToken, isExpired } from '../../lib/reset.js';
import { loggedWrite } from '../../lib/log.js';

export async function onRequestPost(context) {
  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const ts = await verifyTurnstile(context, 'reset-password', body['cf-turnstile-response']);
  if (ts) return ts;

  const { token, new_pin } = body;
  if (!token || typeof token !== 'string') {
    return json({ error: 'This reset link is invalid or has expired.' }, 400);
  }

  if (!new_pin || typeof new_pin !== 'string' || new_pin.length < 8) {
    return json({ error: 'New PIN must be at least 8 characters long.' }, 400);
  }

  const hashedToken = await hashToken(token);
  const resetRow = await context.env.DB
    .prepare('SELECT expires_at, used_at FROM password_resets WHERE token_hash = ?')
    .bind(hashedToken)
    .first();

  if (!resetRow || resetRow.used_at !== null || isExpired(resetRow.expires_at)) {
    return json({ error: 'This reset link is invalid or has expired.' }, 400);
  }

  const salt = newSalt();
  const pinHash = await hashPin(new_pin, salt);

  // Atomically update reset token and rotate PIN + clear 2FA
  await context.env.DB.batch([
    context.env.DB
      .prepare("UPDATE password_resets SET used_at = datetime('now') WHERE token_hash = ?")
      .bind(hashedToken),
    context.env.DB
      .prepare("UPDATE admin_settings SET pin_hash = ?, pin_salt = ?, totp_secret = '', totp_enabled = 0, updated_at = datetime('now') WHERE id = 1")
      .bind(pinHash, salt)
  ]);

  await loggedWrite('auth.reset', { pin_rotated: true, twofa_cleared: true }, () => Promise.resolve());

  return json({ success: true, message: 'Password updated. Please log in.' });
}
