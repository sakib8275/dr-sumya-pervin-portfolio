import { requireAuth, json } from '../../lib/auth.js';

export async function onRequestDelete(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const { id } = context.params;
  const item = await context.env.DB.prepare('SELECT image_path FROM gallery WHERE id = ?').bind(id).first();
  if (!item) return json({ error: 'Gallery item not found' }, 404);

  await context.env.DB.prepare('DELETE FROM gallery WHERE id = ?').bind(id).run();

  if (item.image_path && item.image_path.startsWith('/api/uploads/')) {
    const key = item.image_path.replace('/api/uploads/', '');
    try {
      await context.env.GALLERY_BUCKET.delete(key);
    } catch (err) {
      // The D1 row is already gone, so the delete still succeeded from the caller's
      // view. Log it — silently swallowing this is how R2 accumulates orphans.
      console.error(`R2 delete failed for key "${key}":`, err);
    }
  }

  return json({ success: true });
}
