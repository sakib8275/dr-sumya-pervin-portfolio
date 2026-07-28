export async function seedAdmin(env) {
  const row = await env.DB.prepare('SELECT id FROM admin_settings WHERE id = 1').first();
  if (!row) {
    const encoder = new TextEncoder();
    const data = encoder.encode('talhatheboss');
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    await env.DB.prepare('INSERT INTO admin_settings (id, pin_hash) VALUES (1, ?)').bind(hash).run();
  }
}
