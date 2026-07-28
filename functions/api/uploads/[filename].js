export async function onRequestGet(context) {
  const { filename } = context.params;
  const object = await context.env.GALLERY_BUCKET.get(filename);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}
