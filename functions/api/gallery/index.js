import { requireAuth, json } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const { results } = await context.env.DB.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
  return json(results);
}

export async function onRequestPost(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  let title, category, caption, imagePath;
  const ct = context.request.headers.get('Content-Type') || '';

  if (ct.includes('multipart/form-data')) {
    const formData = await context.request.formData();
    title = formData.get('title');
    category = formData.get('category');
    caption = formData.get('caption');
    const file = formData.get('image');
    const urlInput = formData.get('image_url');

    if (file && file.size > 0) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const filename = `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = await file.arrayBuffer();
      await context.env.GALLERY_BUCKET.put(filename, buffer, {
        httpMetadata: { contentType: file.type }
      });
      imagePath = '/api/uploads/' + filename;
    } else if (urlInput) {
      imagePath = urlInput;
    } else {
      imagePath = '/api/uploads/placeholder';
    }
  } else {
    const body = await context.request.json();
    title = body.title;
    category = body.category;
    caption = body.caption;
    imagePath = body.image_path || '/api/uploads/placeholder';
  }

  if (!title || !category) return json({ error: 'Title and category are required' }, 400);

  const id = 'item-' + crypto.randomUUID().slice(0, 8);
  await context.env.DB.prepare(
    'INSERT INTO gallery (id, title, category, caption, image_path) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, title, category, caption || '', imagePath).run();

  return json({ id, message: 'Gallery item created' }, 201);
}
