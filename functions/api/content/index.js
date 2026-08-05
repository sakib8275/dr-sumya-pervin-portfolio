import { requireAuth, readJson, json } from '../../lib/auth.js';
import { loggedWrite } from '../../lib/log.js';

const ALLOWED_KEYS = new Set([
  'hero.headline',
  'hero.tagline',
  'about.heading',
  'about.intro',
  'about.stat1_value',
  'about.stat1_label',
  'about.stat2_value',
  'about.stat2_label',
  'about.stat3_value',
  'about.stat3_label',
  'section.about.title',
  'section.chambers.title',
  'section.results.title',
  'section.gallery.title',
  'section.services.title',
  'band.text',
  'chambers',
  'services'
]);

export async function onRequestGet(context) {
  const { results } = await context.env.DB
    .prepare('SELECT key, content FROM site_content')
    .all();

  const contentMap = {};
  if (Array.isArray(results)) {
    for (const r of results) {
      if (r.key === 'chambers' || r.key === 'services') {
        try {
          contentMap[r.key] = JSON.parse(r.content);
        } catch {
          contentMap[r.key] = [];
        }
      } else {
        contentMap[r.key] = r.content;
      }
    }
  }

  return json(contentMap);
}

export async function onRequestPut(context) {
  const authErr = await requireAuth(context.request, context.env);
  if (authErr) return authErr;

  const body = await readJson(context.request);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Request body must be a key-value object.' }, 400);
  }

  const keys = Object.keys(body);
  if (keys.length === 0) {
    return json({ error: 'No content keys provided.' }, 400);
  }

  for (const k of keys) {
    if (!ALLOWED_KEYS.has(k)) {
      return json({ error: `Disallowed or invalid content key: ${k}` }, 400);
    }
  }

  const statements = [];
  const changedKeys = [];

  for (const [key, val] of Object.entries(body)) {
    changedKeys.push(key);
    if (val === null || val === '') {
      statements.push(
        context.env.DB
          .prepare('DELETE FROM site_content WHERE key = ?')
          .bind(key)
      );
      continue;
    }

    if (key === 'chambers' || key === 'services') {
      let arr = val;
      if (typeof val === 'string') {
        try {
          arr = JSON.parse(val);
        } catch {
          return json({ error: `Invalid JSON format for array key: ${key}` }, 400);
        }
      }
      if (!Array.isArray(arr) || arr.length > 100) {
        return json({ error: `Key ${key} must be an array with <= 100 items.` }, 400);
      }
      for (const item of arr) {
        if (typeof item !== 'object' || item === null) {
          return json({ error: `Items in ${key} must be objects.` }, 400);
        }
        for (const [prop, propVal] of Object.entries(item)) {
          if (typeof propVal === 'string' && propVal.length > 500) {
            return json({ error: `Field ${prop} in ${key} exceeds maximum length of 500 characters.` }, 400);
          }
        }
      }
      const stringified = JSON.stringify(arr);
      statements.push(
        context.env.DB
          .prepare("INSERT INTO site_content (key, content, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET content=excluded.content, updated_at=datetime('now')")
          .bind(key, stringified)
      );
    } else {
      if (typeof val !== 'string') {
        return json({ error: `Scalar key ${key} must be a string.` }, 400);
      }
      if (val.length > 2000) {
        return json({ error: `Content for ${key} exceeds maximum length of 2000 characters.` }, 400);
      }
      statements.push(
        context.env.DB
          .prepare("INSERT INTO site_content (key, content, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET content=excluded.content, updated_at=datetime('now')")
          .bind(key, val)
      );
    }
  }

  if (statements.length > 0) {
    await context.env.DB.batch(statements);
  }

  await loggedWrite('content.update', { keys: changedKeys }, () => Promise.resolve());

  return json({ success: true, updated: changedKeys });
}
