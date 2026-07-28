import { json } from '../lib/auth.js';

export async function onRequestPost(context) {
  const { name, email, phone, message } = await context.request.json();
  if (!name || !message) return json({ error: 'Name and message are required' }, 400);

  const id = 'msg-' + crypto.randomUUID().slice(0, 8);
  await context.env.DB.prepare(
    'INSERT INTO contact_messages (id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, name, email || '', phone || '', message).run();

  return json({ id, message: 'Message received. Dr. Pervin will respond shortly.' }, 201);
}

export async function onRequestGet(context) {
  const from = context.request.url.split('?from=')[1];
  if (from !== (context.env.SITE_SECRET || 'portfoliosumyapervin')) {
    return json({ error: 'Invalid access code' }, 403);
  }
  const { results } = await context.env.DB.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  return json(results);
}
