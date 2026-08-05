// Reset token utilities: token generation, SHA-256 hashing, and expiration checks.

function getCrypto() {
  const g = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : {});
  if (g.crypto) {
    if (typeof g.crypto.getRandomValues === 'function') {
      return g.crypto;
    }
    if (g.crypto.webcrypto && typeof g.crypto.webcrypto.getRandomValues === 'function') {
      return g.crypto.webcrypto;
    }
  }
  return g.crypto;
}

/**
 * Generates a cryptographically secure 64-character hex reset token (32 random bytes).
 */
export function newResetToken() {
  const bytes = new Uint8Array(32);
  getCrypto().getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes SHA-256 hash of a plaintext token string, returning a 64-char hex string.
 *
 * @param {string} token
 * @returns {Promise<string>}
 */
export async function hashToken(token) {
  if (typeof token !== 'string' || !token) {
    return '';
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await getCrypto().subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Formats an ISO expiration date string for a given duration in minutes.
 *
 * @param {number} [minutes=30]
 * @param {Date} [now=new Date()]
 * @returns {string} ISO date string (or SQLite compatible string)
 */
export function resetExpiry(minutes = 30, now = new Date()) {
  const expiry = new Date(now.getTime() + minutes * 60 * 1000);
  return expiry.toISOString();
}

/**
 * Checks whether an expiration ISO date string has passed.
 *
 * @param {string} expiresAt ISO timestamp or SQLite datetime string
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function isExpired(expiresAt, now = new Date()) {
  if (!expiresAt) return true;
  const expiryTime = new Date(expiresAt.endsWith('Z') ? expiresAt : `${expiresAt}Z`).getTime();
  return isNaN(expiryTime) || expiryTime <= now.getTime();
}
