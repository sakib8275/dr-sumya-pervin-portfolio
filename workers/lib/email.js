// Shared email plumbing for the scheduled Workers (digest and probe).
//
// Everything here is pure and importable from plain Node so the test suites can
// exercise the full MIME construction without workerd. What deliberately does
// NOT live here: the `cloudflare:email` import and the send_email transport
// wrapper, because neither can be imported outside workerd — each Worker keeps
// its own thin `sendEmail` in its index.js and only shares the byte building.
//
// Moved here from workers/digest/digest.js (2026-08-05) so the probe Worker
// sends byte-identical mail instead of maintaining a second copy. digest.js
// re-exports buildMimeMessage so tests/digest.test.mjs keeps passing unchanged.

// RFC 5322 date, e.g. "Sun, 02 Aug 2026 10:30:00 +0000". Built by hand because
// toUTCString() emits "GMT", which some strict MTAs reject in a Date header.
const RFC_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RFC_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function rfc5322Date(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${RFC_DAYS[d.getUTCDay()]}, ${p(d.getUTCDate())} ${RFC_MONTHS[d.getUTCMonth()]} ` +
    `${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} +0000`;
}

// base64 of the UTF-8 bytes, wrapped at 76 columns per RFC 2045. The body is
// sent base64 rather than raw 8-bit because free text may be Bengali; an
// unencoded multi-byte body is not valid 7-bit SMTP content and gets mangled.
function base64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/(.{76})/g, '$1\r\n');
}

/**
 * A complete RFC 5322 message. The legacy `send_email` binding takes raw MIME,
 * not an object, so this is what actually goes on the wire.
 */
export function buildMimeMessage({ from, to, subject, body, now = new Date(), messageId }) {
  const domain = from.split('@')[1] || 'localhost';
  const id = messageId ?? `<${crypto.randomUUID()}@${domain}>`;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Message-ID: ${id}`,
    `Date: ${rfc5322Date(now)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    base64Utf8(body)
  ].join('\r\n');
}
