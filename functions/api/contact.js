import { readJson, safeEqual, json } from '../lib/auth.js';

const MAX_NAME = 120;
const MAX_MESSAGE = 4000;

export async function onRequestPost(context) {
  const body = await readJson(context.request);
  if (!body) return json({ error: 'Invalid request body' }, 400);

  const name = String(body.name || '').trim();
  const message = String(body.message || '').trim();
  if (!name || !message) return json({ error: 'Name and message are required' }, 400);
  if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
    return json({ error: 'Name or message is too long' }, 400);
  }

  const id = 'msg-' + crypto.randomUUID().slice(0, 8);
  await context.env.DB.prepare(
    'INSERT INTO contact_messages (id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, name, String(body.email || '').slice(0, MAX_NAME), String(body.phone || '').slice(0, 40), message).run();

  return json({ id, message: 'Message received. Dr. Pervin will respond shortly.' }, 201);
}

export async function onRequestGet(context) {
  const configured = context.env.SITE_SECRET;
  if (!configured || !configured.trim()) {
    return json({ error: 'SITE_SECRET is not configured.' }, 500);
  }

  // searchParams, not a string split — the old `url.split('?from=')[1]` returned
  // the wrong value for any URL carrying more than one query parameter.
  const from = new URL(context.request.url).searchParams.get('from');
  if (!from || !safeEqual(from, configured)) {
    return json({ error: 'Invalid access code' }, 403);
  }

  const { results } = await context.env.DB
    .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC')
    .all();
  return json(results);
}
