import { verifyChallengeToken, signToken, readJson, json } from '../../../lib/auth.js';
import { verifyTotp } from '../../../lib/totp.js';

export async function onRequestPost(context) {
  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { challenge, code } = body;
  if (!challenge || typeof challenge !== 'string' || !code || typeof code !== 'string') {
    return json({ error: 'Challenge token and 6-digit code are required.' }, 400);
  }

  const payload = await verifyChallengeToken(challenge, context.env);
  if (!payload || !payload.challenge) {
    return json({ error: 'Session expired. Please log in again.' }, 401);
  }

  const challengeId = payload.challenge;
  const challengeRow = await context.env.DB
    .prepare('SELECT attempts FROM twofa_challenges WHERE challenge_id = ?')
    .bind(challengeId)
    .first();

  if (!challengeRow) {
    return json({ error: 'Session expired. Please log in again.' }, 401);
  }

  if (challengeRow.attempts >= 5) {
    await context.env.DB
      .prepare('DELETE FROM twofa_challenges WHERE challenge_id = ?')
      .bind(challengeId)
      .run();
    return json({ error: 'Too many attempts. Please log in again.' }, 401);
  }

  const adminRow = await context.env.DB
    .prepare('SELECT totp_secret, totp_enabled FROM admin_settings WHERE id = 1')
    .first();

  if (!adminRow || adminRow.totp_enabled !== 1 || !adminRow.totp_secret) {
    return json({ error: '2FA is not enabled on this account.' }, 401);
  }

  const isValid = await verifyTotp(adminRow.totp_secret, code);
  if (!isValid) {
    await context.env.DB
      .prepare('UPDATE twofa_challenges SET attempts = attempts + 1 WHERE challenge_id = ?')
      .bind(challengeId)
      .run();
    return json({ error: 'Invalid code.' }, 401);
  }

  // Clean up used challenge row
  await context.env.DB
    .prepare('DELETE FROM twofa_challenges WHERE challenge_id = ?')
    .bind(challengeId)
    .run();

  const token = await signToken(context.env);
  return json({ success: true, token });
}
