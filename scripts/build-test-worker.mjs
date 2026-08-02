// Compiles functions/ into the single Worker bundle the test harness runs under
// Miniflare. This is the same compilation `wrangler pages dev` and `pages deploy`
// perform, so the tests exercise the real file-based routing table and the real
// _middleware.js chain rather than a hand-rolled router that can drift from them.
//
// Run automatically by `npm test` via the pretest hook.
import { spawnSync } from 'node:child_process';
import { statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outdir = join(repoRoot, '.test-build', 'worker');
const bundle = join(outdir, 'index.js');

// Rebuild only when a source file is newer than the bundle. `node --test` starts a
// process per test file; without this the wrangler build would run nine times.
function newestMtime(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    newest = Math.max(newest, entry.isDirectory() ? newestMtime(path) : statSync(path).mtimeMs);
  }
  return newest;
}

function bundleIsFresh() {
  try {
    return statSync(bundle).mtimeMs > newestMtime(join(repoRoot, 'functions'));
  } catch {
    return false;
  }
}

if (bundleIsFresh() && !process.argv.includes('--force')) {
  process.exit(0);
}

// compatibility_date must match wrangler.toml — the bundle is compiled against it,
// and a mismatch silently shifts runtime semantics between tests and production.
const result = spawnSync(
  'npx',
  [
    'wrangler', 'pages', 'functions', 'build',
    '--outdir', outdir,
    '--build-output-directory', join(repoRoot, 'public'),
    '--compatibility-date', '2026-07-29'
  ],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    // Blanked deliberately. A CLOUDFLARE_API_TOKEN inherited from the launching
    // shell shadows the wrangler OAuth login and fails with "Failed to
    // automatically retrieve account IDs", which reads exactly like being logged
    // out. The build itself is local and needs no credentials at all.
    env: { ...process.env, CLOUDFLARE_API_TOKEN: '' }
  }
);

process.exit(result.status ?? 1);
