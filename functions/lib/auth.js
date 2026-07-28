import { SignJWT, jwtVerify } from 'jose';

const PBKDF2_ITERATIONS = 100000;

// Fails closed. An unset JWT_SECRET used to fall back to a constant, which meant
// anyone who could read the source could mint valid admin tokens.
function getSecret(env) {
  if (!env.JWT_SECRET || !env.JWT_SECRET.trim()) {
    throw new Error('JWT_SECRET is not configured. Set it with: wrangler pages secret put JWT_SECRET');
  }
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function signToken(env) {
  const secret = getSecret(env);
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, getSecret(env));
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(request, env) {
  const payload = await verifyToken(request, env);
  if (!payload) {
    return json({ error: 'Unauthorized. Please login first.' }, 401);
  }
  return null;
}

export function newSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toHex(bytes);
}

// PBKDF2-SHA256. The previous scheme was unsalted single-round SHA-256, which is
// rainbow-table trivial for a short PIN.
export async function hashPin(pin, saltHex) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return toHex(new Uint8Array(bits));
}

// Length-invariant compare, so a failed login leaks nothing through timing.
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns the parsed body, or null if the request had no valid JSON.
// Callers turn null into a 400 rather than letting the throw become a 500.
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
