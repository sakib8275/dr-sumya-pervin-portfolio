// Pure RFC 6238 TOTP engine using WebCrypto (crypto.subtle) & RFC 4648 Base32.
// No external dependencies. Safe for Cloudflare Pages / Workers & Node 18+.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a Base32 string (RFC 4648) into a Uint8Array.
 * Ignores spaces and padding '='. Case-insensitive.
 */
export function base32Decode(str) {
  if (typeof str !== 'string') return new Uint8Array(0);
  const clean = str.toUpperCase().replace(/[\s=]/g, '');
  if (!clean) return new Uint8Array(0);

  let bits = 0;
  let value = 0;
  const output = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${clean[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Encodes a Uint8Array or ArrayBuffer into a Base32 string (RFC 4648).
 */
export function base32Encode(buffer) {
  const bytes = new Uint8Array(buffer);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

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
 * Generates a random 20-byte (160-bit) Base32 secret string.
 */
export function generateTotpSecret() {
  const bytes = new Uint8Array(20);
  const cryptoObj = getCrypto();
  cryptoObj.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * Calculates an RFC 6238 TOTP code.
 *
 * @param {string} secretBase32
 * @param {object} [options]
 * @param {number} [options.timeStep=30]
 * @param {number} [options.digits=6]
 * @param {number} [options.time=Date.now()/1000] Unix timestamp in seconds
 * @returns {Promise<string>} zero-padded digits string
 */
export async function totp(secretBase32, options = {}) {
  const timeStep = options.timeStep ?? 30;
  const digits = options.digits ?? 6;
  const time = options.time ?? (Date.now() / 1000);

  const counter = Math.floor(time / timeStep);
  const keyBytes = base32Decode(secretBase32);

  const cryptoObj = getCrypto();
  const subtle = cryptoObj?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto subtle is unavailable');
  }

  const cryptoKey = await subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  // 8-byte big-endian counter buffer
  const counterBuffer = new ArrayBuffer(8);
  const dataView = new DataView(counterBuffer);
  // High 32 bits are 0 for timestamps up to year 2038+
  dataView.setUint32(0, Math.floor(counter / 0x100000000), false);
  dataView.setUint32(4, counter % 0x100000000, false);

  const hmac = await subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hmacBytes = new Uint8Array(hmac);

  // Dynamic Truncation (RFC 4226 Section 5.4)
  const offset = hmacBytes[hmacBytes.length - 1] & 0xf;
  const binary =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return String(otp).padStart(digits, '0');
}

/**
 * Verifies a user-entered TOTP code against a secret within a time window.
 *
 * @param {string} secretBase32
 * @param {string} code 6-digit string
 * @param {object} [options]
 * @param {number} [options.window=1] allowed step offset (±1 = ±30s)
 * @param {number} [options.time=Date.now()/1000]
 * @returns {Promise<boolean>}
 */
export async function verifyTotp(secretBase32, code, options = {}) {
  if (typeof code !== 'string') return false;
  const cleanCode = code.trim();
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const window = options.window ?? 1;
  const timeStep = options.timeStep ?? 30;
  const currentTime = options.time ?? (Date.now() / 1000);

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const time = currentTime + errorWindow * timeStep;
    const generated = await totp(secretBase32, { ...options, time });
    if (generated === cleanCode) {
      return true;
    }
  }

  return false;
}

/**
 * Builds an otpauth:// URI for QR code generation.
 */
export function totpUri(label, secretBase32, options = {}) {
  const issuer = options.issuer ?? 'Dr. Sumya Pervin CMS';
  const encodedLabel = encodeURIComponent(label);
  const encodedIssuer = encodeURIComponent(issuer);
  const cleanSecret = secretBase32.replace(/[\s=]/g, '').toUpperCase();

  return `otpauth://totp/${encodedLabel}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
