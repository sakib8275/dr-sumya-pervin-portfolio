import { verifyToken, json } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const payload = await verifyToken(context.request, context.env);
  return json({ authenticated: !!payload });
}
