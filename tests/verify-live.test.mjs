// scripts/verify-live.mjs, the post-deploy apex check, run against the harness
// and against hostile stand-ins.
//
// The script is only useful on deploy day, which is exactly when nobody wants
// to discover that it rotted: a renamed canonical, a moved asset or a changed
// header would turn every live run into a false FAIL and teach the operator to
// ignore it. The stand-ins pin the other direction: a catch-all that leaks
// must FAIL, and an edge challenge must never launder a real leak into
// "inconclusive".
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { createHarness, repoRoot } from './helpers/harness.mjs';

let h;
let base;
before(async () => {
  h = await createHarness();
  base = (await h.mf.ready).toString().replace(/\/$/, '');
});
after(async () => { await h.dispose(); });

// Spawned asynchronously, never spawnSync: the harness serves public/ from a
// service binding in this process, so blocking the event loop deadlocks it.
function run(...args) {
  return new Promise((resolve) => {
    const child = spawn('node', [join(repoRoot, 'scripts', 'verify-live.mjs'), ...args], { cwd: repoRoot });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('exit', (code) => resolve({ code, out }));
  });
}

// A stand-in site: handler(path) -> { status, headers, body }.
async function standIn(handler) {
  const server = createServer((req, res) => {
    const { status = 200, headers = {}, body = '' } = handler(new URL(req.url, 'http://x').pathname);
    res.writeHead(status, headers);
    res.end(body);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}

test('verify-live passes every check against a correct deployment', async () => {
  const { code, out } = await run(base);
  assert.equal(code, 0, out);
  assert.doesNotMatch(out, /^(FAIL|SKIP)/m, out);
  assert.match(out, /PASS {2}not published: \/wrangler\.toml/);
  assert.match(out, /PASS {2}CSP nonce is fresh per request/);
});

test('verify-live FAILS a catch-all that serves repo internals with a 200', async () => {
  const site = await standIn(() => ({ body: 'database_id = "x"\nJWT_SECRET=leak' }));
  try {
    const { code, out } = await run(site.url);
    assert.equal(code, 1, out);
    assert.match(out, /FAIL {2}not published: \/wrangler\.toml .*SECRET MARKERS/);
    assert.match(out, /FAIL {2}homepage is the real home page/);
  } finally { await site.close(); }
});

test('an edge challenge never downgrades a real leak to inconclusive', async () => {
  const site = await standIn((path) => (path === '/agent.md'
    ? { body: 'pin_hash leaked' }
    : { status: 403, headers: { 'cf-mitigated': 'challenge' }, body: 'challenge' }));
  try {
    const { code, out } = await run(site.url);
    assert.equal(code, 1, out);
    assert.match(out, /FAIL {2}not published: \/agent\.md/);
    assert.match(out, /SKIP {2}homepage answers 200/);
  } finally { await site.close(); }
});

test('a fully challenged vantage point is inconclusive, not a pass', async () => {
  const site = await standIn(() => ({ status: 403, headers: { 'cf-mitigated': 'challenge' }, body: 'challenge' }));
  try {
    const { code, out } = await run(site.url);
    assert.equal(code, 2, out);
    assert.match(out, /INCONCLUSIVE/);
    assert.doesNotMatch(out, /^PASS/m, out);
  } finally { await site.close(); }
});

test('verify-live reports an unreachable host as inconclusive, not as a pass', async () => {
  const { code, out } = await run('http://127.0.0.1:9');
  assert.equal(code, 2, out);
  assert.match(out, /UNREACHABLE/);
});
