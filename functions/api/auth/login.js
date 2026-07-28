import { hashPin, signToken, json } from '../../lib/auth.js';

export async function onRequestPost(context) {
  const { pin } = await context.request.json();
  if (!pin) return json({ error: 'PIN is required' }, 400);

  const row = await context.env.DB.prepare('SELECT pin_hash FROM admin_settings WHERE id = 1').first();
  if (!row) return json({ error: 'No admin configured' }, 500);

  const inputHash = await hashPin(pin);
  if (inputHash !== row.pin_hash) return json({ error: 'Incorrect PIN' }, 401);

  const token = await signToken(context.env);
  return json({ success: true, token });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
