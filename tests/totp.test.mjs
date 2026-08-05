import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  base32Decode,
  base32Encode,
  generateTotpSecret,
  totp,
  verifyTotp,
  totpUri
} from '../functions/lib/totp.js';

// RFC 6238 Appendix B test secret: "12345678901234567890" ASCII
// In Base32 (RFC 4648): "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
const RFC_SECRET_BASE32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

test('base32Decode decodes valid Base32 strings and handles spacing/padding', () => {
  const decoded = base32Decode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  const expectedText = '12345678901234567890';
  const decodedText = new TextDecoder().decode(decoded);
  assert.equal(decodedText, expectedText);

  // Case-insensitive + whitespace + padding tolerance
  const decodedPadded = base32Decode('  gezdgnbvgy3tqojqgezdgnbvgy3tqojq== ');
  assert.equal(new TextDecoder().decode(decodedPadded), expectedText);
});

test('base32Encode converts binary to base32 correctly', () => {
  const text = '12345678901234567890';
  const encoded = base32Encode(new TextEncoder().encode(text));
  assert.equal(encoded, RFC_SECRET_BASE32);
});

test('generateTotpSecret returns a 32-char valid Base32 string', () => {
  const secret = generateTotpSecret();
  assert.equal(typeof secret, 'string');
  assert.equal(secret.length, 32);
  assert.doesNotThrow(() => base32Decode(secret));
});

test('totp matches RFC 6238 Appendix B SHA-1 test vectors (digits=8)', async () => {
  // RFC 6238 Table 1 test vectors for SHA-1 with digits=8
  const testVectors = [
    { time: 59, expected: '94287082' },
    { time: 1111111109, expected: '07081804' },
    { time: 1111111111, expected: '14050471' },
    { time: 1234567890, expected: '89005924' },
    { time: 2000000000, expected: '69279037' },
    { time: 20000000000, expected: '65353130' }
  ];

  for (const vector of testVectors) {
    const code = await totp(RFC_SECRET_BASE32, {
      time: vector.time,
      digits: 8,
      timeStep: 30
    });
    assert.equal(code, vector.expected, `Failed at time ${vector.time}`);
  }
});

test('totp generates a 6-digit zero-padded string by default', async () => {
  const code = await totp(RFC_SECRET_BASE32, { time: 59 });
  assert.equal(typeof code, 'string');
  assert.equal(code.length, 6);
  assert.match(code, /^\d{6}$/);
});

test('verifyTotp accepts codes within window and rejects invalid codes', async () => {
  const now = 1700000000;
  const currentCode = await totp(RFC_SECRET_BASE32, { time: now });
  const prevCode = await totp(RFC_SECRET_BASE32, { time: now - 30 });
  const nextCode = await totp(RFC_SECRET_BASE32, { time: now + 30 });
  const farFutureCode = await totp(RFC_SECRET_BASE32, { time: now + 90 });

  // Exact match
  assert.equal(await verifyTotp(RFC_SECRET_BASE32, currentCode, { time: now, window: 1 }), true);
  // Window -1 match
  assert.equal(await verifyTotp(RFC_SECRET_BASE32, prevCode, { time: now, window: 1 }), true);
  // Window +1 match
  assert.equal(await verifyTotp(RFC_SECRET_BASE32, nextCode, { time: now, window: 1 }), true);
  // Window 0 rejects offset
  assert.equal(await verifyTotp(RFC_SECRET_BASE32, prevCode, { time: now, window: 0 }), false);
  // Outside window rejects
  assert.equal(await verifyTotp(RFC_SECRET_BASE32, farFutureCode, { time: now, window: 1 }), false);
  // Invalid inputs reject
  assert.equal(await verifyTotp(RFC_SECRET_BASE32, '123', { time: now }), false);
  assert.equal(await verifyTotp(RFC_SECRET_BASE32, 'abcdef', { time: now }), false);
});

test('totpUri formats valid otpauth URL for QR codes', () => {
  const uri = totpUri('dr.enamtalha@gmail.com', RFC_SECRET_BASE32, { issuer: 'Dr. Sumya Pervin CMS' });
  assert.equal(
    uri,
    `otpauth://totp/dr.enamtalha%40gmail.com?secret=${RFC_SECRET_BASE32}&issuer=Dr.%20Sumya%20Pervin%20CMS&algorithm=SHA1&digits=6&period=30`
  );
});
