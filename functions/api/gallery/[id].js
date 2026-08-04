import { requireAuth, json } from '../../lib/auth.js';
import { loggedWrite, logWrite } from '../../lib/log.js';

export async function onRequestDelete(context) {
  const auth = await requireAuth(context.request, context.env);
  if (auth) return auth;

  const { id } = context.params;
  const item = await context.env.DB.prepare('SELECT image_path FROM gallery WHERE id = ?').bind(id).first();
  if (!item) return json({ error: 'Gallery item not found' }, 404);

  await loggedWrite('gallery.delete', { id }, () =>
    context.env.DB.prepare('DELETE FROM gallery WHERE id = ?').bind(id).run()
  );

  if (item.image_path && item.image_path.startsWith('/api/uploads/')) {
    const key = item.image_path.replace('/api/uploads/', '');
    try {
      await context.env.GALLERY_BUCKET.delete(key);
    } catch (err) {
      // The D1 row is already gone, so the delete still succeeded from the caller's
      // view. Log it — silently swallowing this is how R2 accumulates orphans.
      // Structured so the stranded key can be queried out of the log stream and
      // removed from the bucket by hand; after this line nothing else records it.
      logWrite('gallery.orphan', { id, stored_key: key, error: err && err.message });
    }
  }

  return json({ success: true });
}
