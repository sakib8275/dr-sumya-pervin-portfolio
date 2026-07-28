import { requireAuth, hashPin, json } from '../lib/auth.js';

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const row = await context.env.DB.prepare('SELECT whatsapp, telegram FROM admin_settings WHERE id = 1').first();
  return json({ whatsapp: row.whatsapp || '', telegram: row.telegram || '' });
}

export async function onRequestPut(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const { whatsapp, telegram, current_pin, new_pin } = await context.request.json();
  const row = await context.env.DB.prepare('SELECT pin_hash FROM admin_settings WHERE id = 1').first();

  if (new_pin) {
    if (!current_pin) return json({ error: 'Current PIN required to set new PIN' }, 400);
    const curHash = await hashPin(current_pin);
    if (curHash !== row.pin_hash) return json({ error: 'Current PIN is incorrect' }, 401);
    const newHash = await hashPin(new_pin);
    await context.env.DB.prepare(
      "UPDATE admin_settings SET pin_hash = ?, whatsapp = ?, telegram = ?, updated_at = datetime('now') WHERE id = 1"
    ).bind(newHash, whatsapp || '', telegram || '').run();
  } else {
    await context.env.DB.prepare(
      "UPDATE admin_settings SET whatsapp = ?, telegram = ?, updated_at = datetime('now') WHERE id = 1"
    ).bind(whatsapp || '', telegram || '').run();
  }

  return json({ success: true, message: 'Settings updated' });
}
