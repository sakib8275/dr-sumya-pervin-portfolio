// Test harness: runs the real compiled Pages Worker under Miniflare with real D1
// and R2, and with siteverify intercepted.
//
// Why Miniflare and not `wrangler pages dev`:
//
// verifyTurnstile() requires siteverify to return BOTH the expected action and a
// hostname in TURNSTILE_HOSTNAMES. Cloudflare's always-pass testing keys mint a
// dummy token carrying no action, so they can never satisfy that check, and a
// browser-solved token is not repeatable (the widget did not re-arm within 20s
// after turnstile.reset() during the 2026-07-31 verification). The only way to
// test the POSITIVE booking path deterministically is to intercept siteverify
// server-side, and Miniflare's outboundService is the only local runner that can.
//
// Everything else stays real: the route table below is compiled by
// `wrangler pages functions build`, so /api/appointments/:id really is a
// single-segment match, and _middleware.js really runs.
import { readFile, stat } from 'node:fs/promises';
import { join, dirname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare } from 'miniflare';
import { hashPin, newSalt, signToken } from '../../functions/lib/auth.js';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORKER_BUNDLE = join(repoRoot, '.test-build', 'worker', 'index.js');
const PUBLIC_DIR = join(repoRoot, 'public');

// Test-only values. None of these is a production secret, and the production PIN
// is never involved -- the harness seeds its own.
export const TEST_JWT_SECRET = 'test-jwt-secret-not-the-production-one';
export const TEST_SITE_SECRET = 'test-site-secret-not-the-production-one';
export const TEST_TURNSTILE_SECRET = 'test-turnstile-secret';
export const TEST_PIN = 'test-pin-12345';
export const TEST_ORIGIN = 'https://drsumyapervin.com';
export const TEST_HOSTNAMES = 'test.local,drsumyapervin.com';
export const BASE_URL = 'https://test.local';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Token protocol understood by the siteverify stub. Tests pass these as the
// cf-turnstile-response value; the stub turns them into the siteverify responses
// Cloudflare would really send.
export const tokens = {
  // Solves cleanly for the given action, from an allowlisted hostname.
  good: (action) => `good:${action}`,
  // Solves, but siteverify reports a hostname the deployment does not allow --
  // this is the localhost-token-replayed-at-production case.
  fromHostname: (action, hostname) => `host:${hostname}:${action}`,
  // Single-use: succeeds once, then reports timeout-or-duplicate like a real replay.
  singleUse: (action) => `once:${action}`,
  // siteverify says no (invalid-input-response).
  rejected: () => 'rejected',
  // Infrastructure failures. verifyTurnstile must fail CLOSED on every one.
  siteverify500: () => 'siteverify-500',
  siteverifyGarbage: () => 'siteverify-garbage',
  networkError: () => 'siteverify-network-error'
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Smallest valid PNG (1x1, transparent). Used for the R2 upload path.
export const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Stands in for the Pages ASSETS binding: serves public/ and falls back to the
// custom public/404.html. Having it real rather than stubbed is what lets
// exposure.test.mjs prove that repo internals are not published.
async function serveAsset(request) {
  const url = new URL(request.url);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';

  // Resolve inside public/ or not at all -- ../ must never escape.
  const candidate = normalize(join(PUBLIC_DIR, pathname));
  const inside = candidate === PUBLIC_DIR || candidate.startsWith(PUBLIC_DIR + sep);

  if (inside) {
    try {
      if ((await stat(candidate)).isFile()) {
        const ext = candidate.slice(candidate.lastIndexOf('.'));
        return new Response(await readFile(candidate), {
          headers: { 'Content-Type': MIME[ext] || 'application/octet-stream' }
        });
      }
    } catch {
      // fall through to 404
    }
  }

  return new Response(await readFile(join(PUBLIC_DIR, '404.html')), {
    status: 404,
    headers: { 'Content-Type': MIME['.html'] }
  });
}

function makeSiteverify(state) {
  const spent = new Set();

  return async (request) => {
    // Any other outbound call is a bug or an unmocked dependency, and silently
    // letting it reach the internet is how a suite becomes flaky. Record and fail.
    if (!request.url.startsWith(SITEVERIFY_URL)) {
      state.unexpectedOutbound.push(request.url);
      return new Response('unexpected outbound request', { status: 500 });
    }

    const form = new URLSearchParams(await request.text());
    const token = form.get('response') || '';
    const secret = form.get('secret') || '';
    state.calls.push({ token, secret, remoteip: form.get('remoteip') || '' });

    const fail = (...codes) =>
      Response.json({ success: false, 'error-codes': codes });

    // A wrong or missing secret is rejected before anything else, exactly as the
    // real endpoint does. This is what makes the "TURNSTILE_SECRET unset" case
    // meaningful rather than a local shape check.
    if (secret !== TEST_TURNSTILE_SECRET) return fail('invalid-input-secret');

    if (token === tokens.networkError()) throw new Error('simulated network failure');
    if (token === tokens.siteverify500()) return new Response('upstream error', { status: 500 });
    if (token === tokens.siteverifyGarbage()) {
      return new Response('<html>not json</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    if (token === tokens.rejected()) return fail('invalid-input-response');

    const ok = (action, hostname) =>
      Response.json({
        success: true,
        'error-codes': [],
        challenge_ts: new Date().toISOString(),
        hostname,
        action,
        cdata: ''
      });

    if (token.startsWith('good:')) return ok(token.slice(5), 'test.local');

    if (token.startsWith('host:')) {
      const [, hostname, action] = token.split(':');
      return ok(action, hostname);
    }

    if (token.startsWith('once:')) {
      if (spent.has(token)) return fail('timeout-or-duplicate');
      spent.add(token);
      return ok(token.slice(5), 'test.local');
    }

    return fail('invalid-input-response');
  };
}

const SCHEMA_PROMISE = readFile(join(repoRoot, 'migrations', '001_schema.sql'), 'utf8');

// Applies the real migration. Local D1 starts with zero tables, and a booking
// against an unmigrated database 500s at the INSERT -- which reads as "Turnstile
// broke". Every harness therefore migrates before the first request.
async function migrate(db) {
  const sql = (await SCHEMA_PROMISE)
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');

  for (const statement of sql.split(';')) {
    if (statement.trim()) await db.prepare(statement).run();
  }
}

// The seed hash is derived by importing hashPin from the same module login.js
// verifies against, so a change to the hashing scheme cannot leave the tests
// passing against a stale seed.
async function seedAdminPin(db, pin) {
  const salt = newSalt();
  const hash = await hashPin(pin, salt);
  await db
    .prepare('UPDATE admin_settings SET pin_hash = ?, pin_salt = ? WHERE id = 1')
    .bind(hash, salt)
    .run();
}

let instanceCounter = 0;

/**
 * Starts an isolated Worker with its own in-memory D1 and R2.
 *
 * @param {object} [options]
 * @param {object} [options.bindings] env overrides, e.g. { TURNSTILE_HOSTNAMES: '' }
 * @param {string} [options.pin] admin PIN to seed (defaults to TEST_PIN)
 */
export async function createHarness(options = {}) {
  const siteverify = { calls: [], unexpectedOutbound: [] };
  const id = `t${process.pid}_${instanceCounter++}`;

  const mf = new Miniflare({
    modules: true,
    scriptPath: WORKER_BUNDLE,
    compatibilityDate: '2026-07-29',
    d1Databases: { DB: `db_${id}` },
    r2Buckets: { GALLERY_BUCKET: `bucket_${id}` },
    serviceBindings: { ASSETS: serveAsset },
    outboundService: makeSiteverify(siteverify),
    bindings: {
      JWT_SECRET: TEST_JWT_SECRET,
      SITE_SECRET: TEST_SITE_SECRET,
      TURNSTILE_SECRET: TEST_TURNSTILE_SECRET,
      TURNSTILE_HOSTNAMES: TEST_HOSTNAMES,
      ALLOWED_ORIGIN: TEST_ORIGIN,
      ...options.bindings
    }
  });

  const db = await mf.getD1Database('DB');
  const bucket = await mf.getR2Bucket('GALLERY_BUCKET');
  await migrate(db);
  await seedAdminPin(db, options.pin ?? TEST_PIN);

  const adminToken = await signToken({ JWT_SECRET: TEST_JWT_SECRET });

  // Returns [url, init] because Miniflare's dispatchFetch builds its own Request;
  // handing it a Node global Request throws "Failed to parse URL".
  async function buildRequest(method, path, { body, headers = {}, origin } = {}) {
    const init = { method, headers: { ...headers } };
    if (origin) init.headers['Origin'] = origin;

    if (body instanceof FormData) {
      // dispatchFetch stringifies a FormData body to "[object FormData]" and
      // sends it as text/plain, so the Worker never sees multipart at all and
      // every upload test 400s for the wrong reason. Encode it here instead and
      // carry undici's boundary across.
      const encoded = new Request('https://encode.invalid/', { method: 'POST', body });
      init.headers['Content-Type'] = encoded.headers.get('content-type');
      init.body = await encoded.arrayBuffer();
    } else if (body instanceof Blob || body === undefined) {
      if (body !== undefined) init.body = body;
    } else {
      init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json';
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return [new URL(path, BASE_URL).toString(), init];
  }

  return {
    mf,
    db,
    bucket,
    siteverify,
    adminToken,

    /**
     * An UNAUTHENTICATED request. This is the default on purpose: the G09
     * regression survived a full audit because every check was run while logged
     * in. Passing an Authorization header here throws -- use asAdmin() instead,
     * so authenticated coverage is always deliberate and visible in the test.
     */
    anon(method, path, opts = {}) {
      const headerNames = Object.keys(opts.headers || {}).map((h) => h.toLowerCase());
      if (headerNames.includes('authorization')) {
        throw new Error('anon() must never send Authorization. Use asAdmin().');
      }
      return buildRequest(method, path, opts).then((r) => mf.dispatchFetch(...r));
    },

    asAdmin(method, path, opts = {}) {
      return buildRequest(method, path, {
        ...opts,
        headers: { ...opts.headers, Authorization: `Bearer ${adminToken}` }
      }).then((r) => mf.dispatchFetch(...r));
    },

    /** Arbitrary token, for forged/expired-credential cases. */
    withToken(token, method, path, opts = {}) {
      return buildRequest(method, path, {
        ...opts,
        headers: { ...opts.headers, Authorization: `Bearer ${token}` }
      }).then((r) => mf.dispatchFetch(...r));
    },

    dispose: () => mf.dispose()
  };
}
