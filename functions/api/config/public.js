import { json } from '../../lib/auth.js';

// The doctor's WhatsApp and Telegram handles are published contact channels, not
// secrets. They sat behind requireAuth, so anonymous patients got a 401 and the
// booking form built a "https://wa.me/" link with an empty number — the forward
// the practice actually depends on went nowhere for everyone except the logged-in
// admin. This route serves those two fields and nothing else.
export async function onRequestGet(context) {
  const row = await context.env.DB
    .prepare('SELECT whatsapp, telegram FROM admin_settings WHERE id = 1')
    .first();
  if (!row) return json({ error: 'Contact configuration unavailable' }, 503);

  return json({ whatsapp: row.whatsapp || '', telegram: row.telegram || '' });
}
