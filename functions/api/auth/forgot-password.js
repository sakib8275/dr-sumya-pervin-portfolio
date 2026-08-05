import { readJson, json } from '../../lib/auth.js';
import { verifyTurnstile } from '../../lib/turnstile.js';
import { newResetToken, hashToken } from '../../lib/reset.js';
import { loggedWrite } from '../../lib/log.js';

export async function onRequestPost(context) {
  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const ts = await verifyTurnstile(context, 'forgot-password', body['cf-turnstile-response']);
  if (ts) return ts;

  const { email } = body;
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Valid email is required.' }, 400);
  }

  const row = await context.env.DB
    .prepare('SELECT admin_email FROM admin_settings WHERE id = 1')
    .first();

  const genericResponse = json({
    success: true,
    message: 'If that address matches the CMS account, a reset link is on its way.'
  });

  const adminEmail = row ? (row.admin_email || '') : '';
  if (!adminEmail || adminEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
    await loggedWrite('auth.forgot_request', { minted: false }, () => Promise.resolve());
    return genericResponse;
  }

  // Throttle check: last created reset token within 60s
  const lastReset = await context.env.DB
    .prepare('SELECT created_at FROM password_resets ORDER BY created_at DESC LIMIT 1')
    .first();

  if (lastReset && lastReset.created_at) {
    const lastTime = new Date(lastReset.created_at.endsWith('Z') ? lastReset.created_at : `${lastReset.created_at}Z`).getTime();
    if (Date.now() - lastTime < 60000) {
      await loggedWrite('auth.forgot_request', { minted: false, throttled: true }, () => Promise.resolve());
      return genericResponse;
    }
  }

  // Mint new token (valid 30 min)
  const token = newResetToken();
  const hashed = await hashToken(token);

  await context.env.DB
    .prepare("INSERT INTO password_resets (token_hash, expires_at) VALUES (?, datetime('now', '+30 minutes'))")
    .bind(hashed)
    .run();

  const resetUrl = `${new URL(context.request.url).origin}/#reset?token=${token}`;

  // Send via MAILER service binding if available
  if (context.env.MAILER && typeof context.env.MAILER.fetch === 'function') {
    try {
      const mailRes = await context.env.MAILER.fetch('https://mailer.internal/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mail-Secret': context.env.MAIL_SECRET || ''
        },
        body: JSON.stringify({
          to: adminEmail,
          subject: 'Reset your CMS password',
          body: `A password reset was requested for your Dr. Sumya Pervin CMS account.\n\n` +
            `Click the link below to set a new password:\n${resetUrl}\n\n` +
            `This link is single-use and valid for 30 minutes. If you did not request this, you can ignore this email.`
        })
      });
      if (!mailRes.ok) {
        await loggedWrite('auth.reset_send_failure', { status: mailRes.status }, () => Promise.resolve());
      }
    } catch (err) {
      await loggedWrite('auth.reset_send_failure', { error: err.message }, () => Promise.resolve());
    }
  }

  await loggedWrite('auth.forgot_request', { minted: true }, () => Promise.resolve());
  return genericResponse;
}
