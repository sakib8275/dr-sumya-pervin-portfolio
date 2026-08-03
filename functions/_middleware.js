// Same-origin is the only caller this API has. The wildcard that used to be here
// applied to the authenticated routes too.
function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGIN || '').trim();
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
  if (allowed && origin === allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
  }
  return headers;
}

// F9 security headers. This middleware sits at the root of functions/, so it runs
// for static assets as well as API routes and these land on the HTML too.
//
// ⚠️ script-src has NO 'unsafe-inline'. That is the point of the directive, and it
// means every inline event handler on the page is dead: an onclick= attribute is
// dropped with no console error the patient will ever see, no failed request and
// no failing test — the button simply does nothing. F9 removed all twelve
// (8 onclick + 1 onsubmit in index.html, 3 onclick generated as HTML strings in
// main.js) BEFORE this header shipped. Before adding markup or building HTML in
// JS, use a listener or a data- attribute; never an on* attribute.
//
// Third-party origins, and why each one is here:
//   challenges.cloudflare.com  Turnstile — api.js (script) and the widget iframe
//                              (frame). Removing either fails every booking with
//                              a 403 that looks exactly like a working system.
//   fonts.googleapis.com       the Outfit webfont stylesheet.
//   static.cloudflareinsights.com  the Web Analytics beacon, which the ZONE injects
//                              into the apex HTML. It is not in this repo.
// 'unsafe-inline' stays in style-src: the pages carry ~55 inline style attributes
// and 404.html has a <style> block. That is a cosmetic surface, not a script one.
//
// Deliberately NOT set: default-src, connect-src, font-src. Turnstile issues its
// own network requests, including to *.challenges.cloudflare.com subdomains that
// Cloudflare documents as normal, and a connect-src that misses one breaks
// bookings silently. Leaving those directives unset keeps the blast radius of
// this header to script execution, which is what actually stops XSS here.
// ⚠️ The nonce is NOT for anything in this repo. Every script we ship is external
// and matches 'self'.
//
// Cloudflare's zone injects TWO scripts into the apex HTML, after this middleware
// has run and on the apex only — never on pages.dev, so no amount of local or
// preview testing can surface them. The first deploy of F9 blocked both:
//
//   1. JavaScript Detections (`__CF$cv$params`, /cdn-cgi/challenge-platform/…).
//      This is an INLINE script, and its body embeds a per-request ray id and
//      timestamp, so a CSP hash cannot ever match it — it changes every request.
//      It is auto-enabled by Bot Fight Mode and cannot be turned off on this plan.
//   2. The Web Analytics beacon from static.cloudflareinsights.com.
//
// Cloudflare documents the fix for (1): if the CSP carries a nonce for scripts,
// their CDN parses this response header and stamps that nonce onto the scripts it
// injects. Hence a fresh nonce per request. Adding a nonce does NOT weaken the
// host sources — only 'strict-dynamic' would do that — so 'self' and Turnstile
// keep working exactly as before.
//
// Regenerated per request on purpose: a fixed nonce is 'unsafe-inline' wearing a
// hat, since an injected script could just quote it.
function buildCSP(nonce) {
  return [
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com https://static.cloudflareinsights.com`,
    "frame-src https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' https: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
}

// Nothing on this site uses a sensor, the camera, the mic, location or payments.
// The Upload Photo control is <input type="file"> with no capture= attribute, so
// camera=() does not touch it.
const PERMISSIONS_POLICY = [
  'accelerometer=()', 'camera=()', 'geolocation=()', 'gyroscope=()',
  'magnetometer=()', 'microphone=()', 'payment=()', 'usb=()'
].join(', ');

// Sent only because L5 (SSL/TLS Full (strict) + Always Use HTTPS) is confirmed
// live — checked in STATUS.md and re-verified with curl before this shipped.
// includeSubDomains is safe here: the zone's only HTTP hostnames are the apex and
// www, both Cloudflare-proxied and both already HTTPS-only (verified against the
// zone's DNS records, 2026-08-03). No preload — that one really is irreversible.
// Sent unconditionally: browsers ignore this header when it arrives over plain
// HTTP, so there is no need to branch on the scheme.
const HSTS = 'max-age=31536000; includeSubDomains';

function securityHeaders() {
  return {
    'Content-Security-Policy': buildCSP(crypto.randomUUID()),
    'Permissions-Policy': PERMISSIONS_POLICY,
    'Strict-Transport-Security': HSTS,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Legacy companion to frame-ancestors, for browsers that predate it.
    'X-Frame-Options': 'DENY'
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders(request, env), ...securityHeaders() }
    });
  }

  // The admin row is created by migrations/001_schema.sql. There is no runtime
  // seeder — one that invents a default PIN is a backdoor, and it cost a D1 read
  // on every single request.
  const response = await context.next();

  for (const [key, val] of Object.entries(corsHeaders(request, env))) {
    response.headers.set(key, val);
  }
  for (const [key, val] of Object.entries(securityHeaders())) {
    response.headers.set(key, val);
  }
  return response;
}
