// Gallery: the only route that writes to R2, and the only one that serves
// attacker-supplied bytes back from this site's own origin.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness, ONE_PIXEL_PNG } from './helpers/harness.mjs';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

function upload({ title = 'A photo', category = 'clinic', caption = '', bytes = ONE_PIXEL_PNG, type = 'image/png', filename = 'photo.png' } = {}) {
  const form = new FormData();
  form.append('title', title);
  form.append('category', category);
  form.append('caption', caption);
  form.append('image', new Blob([bytes], { type }), filename);
  return h.asAdmin('POST', '/api/gallery', { body: form });
}

test('the gallery is readable by patients and writable only by the admin', async () => {
  assert.equal((await h.anon('GET', '/api/gallery')).status, 200);
  assert.equal((await h.anon('POST', '/api/gallery', { body: { title: 'x', category: 'clinic' } })).status, 401);
});

test('a JSON item is created with a safe image path', async () => {
  const res = await h.asAdmin('POST', '/api/gallery', {
    body: { title: 'Clinic front', category: 'clinic', caption: 'Shyamoli' }
  });
  assert.equal(res.status, 201);

  const { id } = await res.json();
  const row = await h.db.prepare('SELECT * FROM gallery WHERE id = ?').bind(id).first();
  assert.equal(row.title, 'Clinic front');
  assert.equal(row.image_path, '/api/uploads/placeholder');
});

const badMetadata = [
  ['a missing title', { category: 'clinic' }],
  ['a missing category', { title: 'x' }],
  ['an unknown category', { title: 'x', category: 'not-a-category' }],
  ['a category injection attempt', { title: 'x', category: "clinic'; DROP TABLE gallery;--" }],
  ['an over-long title', { title: 'x'.repeat(121), category: 'clinic' }],
  ['an over-long caption', { title: 'x', category: 'clinic', caption: 'x'.repeat(501) }],
  ['a javascript: image path', { title: 'x', category: 'clinic', image_path: 'javascript:alert(1)' }],
  ['a data: image path', { title: 'x', category: 'clinic', image_path: 'data:text/html,<script>alert(1)</script>' }]
];

for (const [what, body] of badMetadata) {
  test(`a gallery item with ${what} is rejected`, async () => {
    const res = await h.asAdmin('POST', '/api/gallery', { body });
    assert.equal(res.status, 400);
  });
}

test('an http(s) image URL is accepted and normalised', async () => {
  const res = await h.asAdmin('POST', '/api/gallery', {
    body: { title: 'External', category: 'clinical', image_path: 'https://example.com/x.png' }
  });
  assert.equal(res.status, 201);

  const { id } = await res.json();
  const row = await h.db.prepare('SELECT image_path FROM gallery WHERE id = ?').bind(id).first();
  assert.equal(row.image_path, 'https://example.com/x.png');
});

test('an uploaded PNG reaches R2 and is served back as an image', async () => {
  const res = await upload({ title: 'Uploaded', category: 'procedures' });
  assert.equal(res.status, 201);

  const { id } = await res.json();
  const row = await h.db.prepare('SELECT image_path FROM gallery WHERE id = ?').bind(id).first();
  assert.match(row.image_path, /^\/api\/uploads\/gallery-\d+-[0-9a-f]{8}\.png$/);

  const key = row.image_path.replace('/api/uploads/', '');
  assert.ok(await h.bucket.head(key), 'the object must exist in R2');

  // Patients load these, so the fetch is anonymous.
  const served = await h.anon('GET', row.image_path);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('Content-Type'), 'image/png');
  assert.equal(served.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.deepEqual(Buffer.from(await served.arrayBuffer()), ONE_PIXEL_PNG);
});

// The extension is taken from the validated MIME type, never the filename --
// these are served from this origin, so an HTML upload would be same-origin
// script execution against the admin token.
const badUploads = [
  ['an HTML file', { type: 'text/html', filename: 'evil.html' }],
  ['an SVG file', { type: 'image/svg+xml', filename: 'evil.svg' }],
  ['a PDF', { type: 'application/pdf', filename: 'doc.pdf' }],
  ['a PNG-named file with a script content type', { type: 'text/javascript', filename: 'photo.png' }]
];

for (const [what, opts] of badUploads) {
  test(`uploading ${what} is rejected and writes nothing`, async () => {
    const beforeRows = (await h.db.prepare('SELECT COUNT(*) AS c FROM gallery').first()).c;
    const res = await upload({ bytes: Buffer.from('<html>x</html>'), ...opts });

    assert.equal(res.status, 400);
    assert.equal((await h.db.prepare('SELECT COUNT(*) AS c FROM gallery').first()).c, beforeRows);
    assert.equal((await h.bucket.list()).objects.filter((o) => o.key.includes('evil')).length, 0);
  });
}

test('an over-sized upload is rejected', async () => {
  const res = await upload({ bytes: Buffer.alloc(2 * 1024 * 1024 + 1), title: 'Too big' });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /2 MB or smaller/);
});

test('deleting an item removes both the row and the R2 object', async () => {
  const { id } = await (await upload({ title: 'To delete' })).json();
  const row = await h.db.prepare('SELECT image_path FROM gallery WHERE id = ?').bind(id).first();
  const key = row.image_path.replace('/api/uploads/', '');

  const res = await h.asAdmin('DELETE', `/api/gallery/${id}`);
  assert.equal(res.status, 200);

  assert.equal(await h.db.prepare('SELECT id FROM gallery WHERE id = ?').bind(id).first(), null);
  assert.equal(await h.bucket.head(key), null, 'the object must not be left orphaned');
});

test('deleting a missing item is a 404, and anonymous deletes are refused', async () => {
  assert.equal((await h.asAdmin('DELETE', '/api/gallery/item-nope')).status, 404);
  assert.equal((await h.anon('DELETE', '/api/gallery/item-nope')).status, 401);
});

test('a missing upload key is a 404 rather than an empty 200', async () => {
  const res = await h.anon('GET', '/api/uploads/does-not-exist.png');
  assert.equal(res.status, 404);
});

test('an object stored with an unsafe content type is served defused', async () => {
  // Uploads predating the type allowlist could carry any content type. Serving
  // one as text/html would be same-origin script execution.
  await h.bucket.put('legacy.html', '<script>alert(1)</script>', {
    httpMetadata: { contentType: 'text/html' }
  });

  const res = await h.anon('GET', '/api/uploads/legacy.html');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'application/octet-stream');
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
});
