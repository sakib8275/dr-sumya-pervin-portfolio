import { requireAuth, json } from '../../../lib/auth.js';
import { generateTotpSecret, totpUri } from '../../../lib/totp.js';
import { loggedWrite } from '../../../lib/log.js';

export async function onRequestPost(context) {
  const authErr = await requireAuth(context.request, context.env);
  if (authErr) return authErr;

  const row = await context.env.DB
    .prepare('SELECT totp_enabled, admin_email FROM admin_settings WHERE id = 1')
    .first();

  // Turning 2FA OFF requires the current PIN *and* a live code (2fa/disable.js
  // checks both). Re-running setup overwrote totp_secret and reset totp_enabled
  // to 0, which reaches the same end state with neither -- an unguarded second
  // path to the thing the guarded path is careful about. Re-enrolling an
  // authenticator has to go through disable first.
  if (row && row.totp_enabled === 1) {
    return json({ error: '2FA is already enabled. Disable it first to enrol a new authenticator.' }, 409);
  }

  const secret = generateTotpSecret();
  await context.env.DB
    .prepare('UPDATE admin_settings SET totp_secret = ?, totp_enabled = 0, updated_at = datetime("now") WHERE id = 1')
    .bind(secret)
    .run();

  await loggedWrite('auth.twofa.setup_initiated', {}, () => Promise.resolve());

  // The account label shown in the authenticator app. This was hardcoded to
  // dr.enamtalha@gmail.com; admin_email has been the real, editable source of
  // that address since F13, so read it rather than restating it here.
  const account = (row && row.admin_email) || 'admin';
  const uri = totpUri(account, secret, { issuer: 'Dr. Sumya Pervin CMS' });
  return json({ secret, otpauth_uri: uri });
}
