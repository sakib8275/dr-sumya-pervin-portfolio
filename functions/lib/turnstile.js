import { json } from './auth.js';

// Canonical Turnstile siteverify, shaped like requireAuth: returns null when the
// request is good, or the Response to send when it is not, so callers stay
// `const ts = await verifyTurnstile(...); if (ts) return ts;`.
//
// Fails closed. A network error, a non-2xx from siteverify, a non-JSON body, a
// missing secret, an unset hostname allowlist, a mismatched action, or an
// unapproved hostname all reject. Never fail open on infrastructure trouble --
// that would silently disable bot protection exactly when it is under load.
//
// TURNSTILE_HOSTNAMES is deployment-specific and must NOT contain localhost or
// 127.0.0.1 in production: one widget covers local and production domains, so the
// hostname returned by siteverify is the only thing stopping a token minted
// against localhost from being replayed at the live site.
export async function verifyTurnstile(context, expectedAction, token) {
  const expectedHostnames = new Set(
    String(context.env.TURNSTILE_HOSTNAMES || '')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean)
  );

  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    token.length > 2048 ||
    expectedHostnames.size === 0
  ) {
    return json({ error: 'Verification failed. Please try again.' }, 403);
  }

  let result;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10000),
      body: new URLSearchParams({
        secret: context.env.TURNSTILE_SECRET || '',
        response: token,
        remoteip: context.request.headers.get('CF-Connecting-IP') || ''
      })
    });
    if (!response.ok) throw new Error(`siteverify ${response.status}`);
    result = await response.json();
  } catch {
    return json({ error: 'Verification failed. Please try again.' }, 403);
  }

  if (
    !result.success ||
    result.action !== expectedAction ||
    !expectedHostnames.has(result.hostname)
  ) {
    return json({ error: 'Verification failed. Please try again.' }, 403);
  }

  return null;
}
