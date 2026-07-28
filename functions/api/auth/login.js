import { hashPin, safeEqual, signToken, readJson, json } from '../../lib/auth.js';

export async function onRequestPost(context) {
  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { pin } = body;
  if (!pin || typeof pin !== 'string') return json({ error: 'PIN is required' }, 400);

  const row = await context.env.DB
    .prepare('SELECT pin_hash, pin_salt FROM admin_settings WHERE id = 1')
    .first();
  if (!row || !row.pin_salt) {
    return json({ error: 'No admin configured. Run the D1 migration first.' }, 500);
  }

  const inputHash = await hashPin(pin, row.pin_salt);
  if (!safeEqual(inputHash, row.pin_hash)) return json({ error: 'Incorrect PIN' }, 401);

  const token = await signToken(context.env);
  return json({ success: true, token });
}
