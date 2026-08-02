import { requireAuth, readJson, json } from '../../lib/auth.js';

// Must stay in step with the data-filter buttons in index.html.
const CATEGORIES = ['clinical', 'procedures', 'clinic'];
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
// Extension comes from the validated MIME, never from the uploaded filename.
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

export async function onRequestGet(context) {
  const { results } = await context.env.DB
    .prepare('SELECT * FROM gallery ORDER BY created_at DESC')
    .all();
  return json(results);
}

export async function onRequestPost(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  let title, category, caption, imagePath, storedKey = null;
  const ct = context.request.headers.get('Content-Type') || '';
  const isMultipart = ct.includes('multipart/form-data');

  let body, file, urlInput;
  if (isMultipart) {
    const formData = await context.request.formData();
    title = formData.get('title');
    category = formData.get('category');
    caption = formData.get('caption');
    file = formData.get('image');
    urlInput = formData.get('image_url');
  } else {
    body = await readJson(context.request);
    if (!body) return json({ error: 'Invalid request body' }, 400);
    title = body.title;
    category = body.category;
    caption = body.caption;
  }

  // Metadata is validated before anything reaches R2. Writing first and validating
  // second orphans the object whenever validation rejects: the file is stored, the
  // request 400s, and no gallery row ever references it — so the CMS, which deletes
  // by row, can never clean it up.
  title = String(title || '').trim();
  category = String(category || '').trim().toLowerCase();
  caption = String(caption || '').trim();

  if (!title || !category) return json({ error: 'Title and category are required' }, 400);
  if (title.length > 120 || caption.length > 500) return json({ error: 'Title or caption is too long' }, 400);
  if (!CATEGORIES.includes(category)) {
    return json({ error: `Category must be one of: ${CATEGORIES.join(', ')}` }, 400);
  }

  if (isMultipart) {
    if (file && file.size > 0) {
      // Uploads are served back from this site's own origin, so an attacker-chosen
      // content type here is same-origin script execution against the admin token.
      const ext = ALLOWED_TYPES[file.type];
      if (!ext) {
        return json({ error: 'Image must be a JPEG, PNG, or WebP file' }, 400);
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return json({ error: 'Image must be 2 MB or smaller' }, 400);
      }

      const filename = `gallery-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      await context.env.GALLERY_BUCKET.put(filename, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
      });
      storedKey = filename;
      imagePath = '/api/uploads/' + filename;
    } else if (urlInput) {
      const safe = safeImageUrl(urlInput);
      if (!safe) return json({ error: 'Image URL must be an http(s) or /api/uploads/ path' }, 400);
      imagePath = safe;
    } else {
      imagePath = '/api/uploads/placeholder';
    }
  } else {
    imagePath = body.image_path ? safeImageUrl(body.image_path) : '/api/uploads/placeholder';
    if (!imagePath) return json({ error: 'image_path must be an http(s) or /api/uploads/ path' }, 400);
  }

  const id = 'item-' + crypto.randomUUID().slice(0, 8);
  try {
    await context.env.DB.prepare(
      'INSERT INTO gallery (id, title, category, caption, image_path) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, title, category, caption, imagePath).run();
  } catch (err) {
    // The R2 put already happened. Without this compensating delete the object
    // is stranded: the CMS deletes by row, and no row will ever reference it.
    if (storedKey) {
      try {
        await context.env.GALLERY_BUCKET.delete(storedKey);
      } catch (delErr) {
        console.error('R2 cleanup failed after gallery insert failure; object orphaned:', storedKey, delErr);
      }
    }
    console.error('Gallery insert failed:', err);
    return json({ error: 'Could not save the gallery item. Please try again.' }, 500);
  }

  return json({ id, message: 'Gallery item created' }, 201);
}

// Blocks javascript: and data: URLs from reaching an img src or href.
function safeImageUrl(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (v.startsWith('/api/uploads/')) return v;
  try {
    const parsed = new URL(v);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
  } catch {
    return null;
  }
}
