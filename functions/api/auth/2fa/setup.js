import { requireAuth, json } from '../../../lib/auth.js';
import { generateTotpSecret, totpUri } from '../../../lib/totp.js';
import { loggedWrite } from '../../../lib/log.js';

export async function onRequestPost(context) {
  const authErr = await requireAuth(context.request, context.env);
  if (authErr) return authErr;

  const secret = generateTotpSecret();
  await context.env.DB
    .prepare('UPDATE admin_settings SET totp_secret = ?, totp_enabled = 0, updated_at = datetime("now") WHERE id = 1')
    .bind(secret)
    .run();

  await loggedWrite('auth.twofa.setup_initiated', {}, () => Promise.resolve());

  const uri = totpUri('dr.enamtalha@gmail.com', secret, { issuer: 'Dr. Sumya Pervin CMS' });
  return json({ secret, otpauth_uri: uri });
}
