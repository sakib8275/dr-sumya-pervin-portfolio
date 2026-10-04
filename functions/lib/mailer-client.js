// The one client for the dr-sumya-mailer Worker (workers/mailer). Pages
// Functions cannot hold send_email bindings, so every outbound email — password
// resets, booking notifications — travels over the MAILER service binding to
// that Worker, which owns the send_email binding and the recipient allowlist.
// This module owns the protocol on this side: the internal URL, the
// X-Mail-Secret shared secret, and the fact that an unbound MAILER is a no-op,
// not an error — preview environments and partial deploys must not break a
// route over mail.

/**
 * True when this environment can reach the mailer Worker at all.
 */
export function isMailerBound(env) {
  return !!(env.MAILER && typeof env.MAILER.fetch === 'function');
}

/**
 * Sends one email through the MAILER service binding.
 *
 * Callers decide what a failure means (usually: log it, never fail the
 * request) — this function only reports what happened.
 *
 * @param {object} env the Pages Function env
 * @param {{to: string, subject: string, body: string}} mail
 * @returns {Promise<{ok: boolean, status?: number, error?: string, reason?: string}>}
 *   ok:true            the Worker accepted and dispatched the send
 *   reason:'unbound'   no MAILER binding on this environment; nothing was attempted
 *   status / error     the Worker's refusal code, or the transport error
 */
export async function sendViaMailer(env, { to, subject, body }) {
  if (!isMailerBound(env)) return { ok: false, reason: 'unbound' };
  try {
    const mailRes = await env.MAILER.fetch('https://mailer.internal/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mail-Secret': env.MAIL_SECRET || ''
      },
      body: JSON.stringify({ to, subject, body })
    });
    if (!mailRes.ok) return { ok: false, status: mailRes.status };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message };
  }
}
