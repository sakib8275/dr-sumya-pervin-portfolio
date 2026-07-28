const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function onRequestGet(context) {
  const { filename } = context.params;
  const object = await context.env.GALLERY_BUCKET.get(filename);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  // Uploads predating the type allowlist could carry any content type. Serving one
  // as text/html would be same-origin script execution, so anything unrecognised is
  // pinned to a safe type and nosniff stops the browser second-guessing it.
  const stored = object.httpMetadata?.contentType;
  const contentType = ALLOWED_TYPES.includes(stored) ? stored : 'application/octet-stream';

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
