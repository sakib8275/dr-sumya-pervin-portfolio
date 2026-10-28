// scripts/verify-live.mjs, the post-deploy apex check, run against the harness.
//
// The script is only useful on deploy day, which is exactly when nobody wants
// to discover that it rotted: a renamed canonical, a moved asset or a changed
// header would turn every live run into a false FAIL and teach the operator to
// ignore it. Running it here against the real compiled Worker keeps it honest.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
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

test('verify-live passes every check against a correct deployment', async () => {
  const { code, out } = await run(base);
  assert.equal(code, 0, out);
  assert.doesNotMatch(out, /^FAIL/m, out);
  assert.match(out, /PASS {2}not published: \/wrangler\.toml/);
  assert.match(out, /PASS {2}CSP nonce is fresh per request/);
});

test('verify-live reports an unreachable host as inconclusive, not as a pass', async () => {
  const { code, out } = await run('http://127.0.0.1:9');
  assert.equal(code, 2, out);
  assert.match(out, /UNREACHABLE/);
});
