import { verifyToken, json } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const payload = await verifyToken(context.request, context.env);

  // This predicate must match requireAuth's exactly. verifyToken accepts ANY
  // JWT this deployment signed, and that set includes the short-lived
  // pending-2FA challenge token minted by /api/auth/login before the TOTP code
  // has been entered (signChallengeToken in lib/auth.js). A bare `!!payload`
  // therefore answered "authenticated" for a session that had passed the PIN and
  // nothing else -- and main.js uses this endpoint's answer, and only this
  // endpoint's answer, to decide whether to reveal #cmsMainSection.
  //
  // No record was ever reachable that way: every data route calls requireAuth
  // itself, which checks both claims. But this is the one auth surface the UI
  // trusts and it should not be the one with the weaker test.
  const authenticated =
    !!payload && payload.authenticated === true && payload.twofa === true;

  return json({ authenticated });
}
