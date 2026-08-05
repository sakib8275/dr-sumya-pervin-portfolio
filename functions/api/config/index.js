import { requireAuth, hashPin, newSalt, safeEqual, readJson, json } from '../../lib/auth.js';
import { loggedWrite } from '../../lib/log.js';

const MIN_PIN_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestGet(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const row = await context.env.DB
    .prepare('SELECT whatsapp, telegram, admin_email FROM admin_settings WHERE id = 1')
    .first();
  if (!row) return json({ error: 'No admin configured. Run the D1 migration first.' }, 500);

  return json({ whatsapp: row.whatsapp || '', telegram: row.telegram || '', admin_email: row.admin_email || '' });
}

export async function onRequestPut(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const { whatsapp, telegram, current_pin, new_pin, admin_email } = body;
  const row = await context.env.DB
    .prepare('SELECT pin_hash, pin_salt FROM admin_settings WHERE id = 1')
    .first();
  if (!row) return json({ error: 'No admin configured. Run the D1 migration first.' }, 500);

  if (admin_email !== undefined && typeof admin_email !== 'string') {
    return json({ error: 'admin_email must be a valid email address' }, 400);
  }
  if (admin_email && (admin_email.length > 254 || !EMAIL_RE.test(admin_email))) {
    return json({ error: 'admin_email must be a valid email address' }, 400);
  }

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
    // pin_rotated is a flag, never the PIN, the hash or the salt. That a rotation
    // happened is exactly the fact worth having a record of -- the PIN is
    // pending rotation after it surfaced in a session transcript, and this line
    // is what will show it finally happened.
    await loggedWrite('config.update', { pin_rotated: true }, () =>
      context.env.DB.prepare(
        "UPDATE admin_settings SET pin_hash = ?, pin_salt = ?, whatsapp = ?, telegram = ?, admin_email = ?, updated_at = datetime('now') WHERE id = 1"
      ).bind(newHash, salt, whatsapp || '', telegram || '', admin_email || '').run()
    );
  } else {
    // whatsapp_set rather than the number: clearing it silently un-gates the
    // WhatsApp CTAs across the site, which is a real incident and otherwise
    // leaves no trace at all.
    await loggedWrite('config.update', { pin_rotated: false, whatsapp_set: !!whatsapp }, () =>
      context.env.DB.prepare(
        "UPDATE admin_settings SET whatsapp = ?, telegram = ?, admin_email = ?, updated_at = datetime('now') WHERE id = 1"
      ).bind(whatsapp || '', telegram || '', admin_email || '').run()
    );
  }

  return json({ success: true, message: 'Settings updated' });
}
