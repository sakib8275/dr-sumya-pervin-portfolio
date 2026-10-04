import { readJson, json } from '../../lib/auth.js';
import { verifyTurnstile } from '../../lib/turnstile.js';
import { newResetToken, hashToken } from '../../lib/reset.js';
import { loggedWrite } from '../../lib/log.js';
import { sendViaMailer } from '../../lib/mailer-client.js';

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

  // Spent and expired tokens are dead weight -- nothing else ever removes them,
  // and this table only grows. Pruned here rather than on a cron because this is
  // the only path that writes to it. Deliberately AFTER the throttle check
  // above, so pruning can never widen the throttle window.
  await context.env.DB
    .prepare("DELETE FROM password_resets WHERE expires_at < datetime('now') OR used_at IS NOT NULL")
    .run();

  // Mint new token (valid 30 min)
  const token = newResetToken();
  const hashed = await hashToken(token);

  await context.env.DB
    .prepare("INSERT INTO password_resets (token_hash, expires_at) VALUES (?, datetime('now', '+30 minutes'))")
    .bind(hashed)
    .run();

  // The reset modal now lives on the standalone admin console, not the site
  // root (which is the patient multi-page site after the cutover).
  const resetUrl = `${new URL(context.request.url).origin}/admin/#reset?token=${token}`;

  // Send via the mailer service binding (functions/lib/mailer-client.js). A
  // missing binding or a failed send is logged but never changes the response:
  // the generic message must not reveal whether the address matched, and the
  // token is already minted above.
  const mail = await sendViaMailer(context.env, {
    to: adminEmail,
    subject: 'Reset your CMS password',
    body: `A password reset was requested for your Dr. Sumya Pervin CMS account.\n\n` +
      `Click the link below to set a new password:\n${resetUrl}\n\n` +
      `This link is single-use and valid for 30 minutes. If you did not request this, you can ignore this email.`
  });
  if (!mail.ok && mail.reason !== 'unbound') {
    await loggedWrite('auth.reset_send_failure', { status: mail.status, error: mail.error }, () => Promise.resolve());
  }

  await loggedWrite('auth.forgot_request', { minted: true }, () => Promise.resolve());
  return genericResponse;
}
