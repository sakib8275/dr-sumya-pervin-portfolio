import { requireAuth, hashPin, newSalt, safeEqual, readJson, json } from '../../lib/auth.js';

const MIN_PIN_LENGTH = 8;

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const row = await context.env.DB
    .prepare('SELECT whatsapp, telegram FROM admin_settings WHERE id = 1')
    .first();
  if (!row) return json({ error: 'No admin configured. Run the D1 migration first.' }, 500);

  return json({ whatsapp: row.whatsapp || '', telegram: row.telegram || '' });
}

export async function onRequestPut(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { whatsapp, telegram, current_pin, new_pin } = body;
  const row = await context.env.DB
    .prepare('SELECT pin_hash, pin_salt FROM admin_settings WHERE id = 1')
    .first();
  if (!row) return json({ error: 'No admin configured. Run the D1 migration first.' }, 500);

  if (new_pin) {
    if (!current_pin) return json({ error: 'Current PIN required to set new PIN' }, 400);
    if (typeof new_pin !== 'string' || new_pin.length < MIN_PIN_LENGTH) {
      return json({ error: `New PIN must be at least ${MIN_PIN_LENGTH} characters` }, 400);
    }

    const curHash = await hashPin(current_pin, row.pin_salt);
    if (!safeEqual(curHash, row.pin_hash)) return json({ error: 'Current PIN is incorrect' }, 401);

    // Fresh salt on every rotation, so the same PIN never yields the same hash twice.
    const salt = newSalt();
    const newHash = await hashPin(new_pin, salt);
    await context.env.DB.prepare(
      "UPDATE admin_settings SET pin_hash = ?, pin_salt = ?, whatsapp = ?, telegram = ?, updated_at = datetime('now') WHERE id = 1"
    ).bind(newHash, salt, whatsapp || '', telegram || '').run();
  } else {
    await context.env.DB.prepare(
      "UPDATE admin_settings SET whatsapp = ?, telegram = ?, updated_at = datetime('now') WHERE id = 1"
    ).bind(whatsapp || '', telegram || '').run();
  }

  return json({ success: true, message: 'Settings updated' });
}
