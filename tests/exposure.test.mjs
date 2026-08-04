// What the site publishes.
//
// pages_build_output_dir was once "." -- the repo root -- which served the admin
// PIN hash, SITE_SECRET and every internal doc as public assets. That is how the
// original credential leak happened. This file automates the manual sweep that
// has been re-run by hand after every deploy since.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from './helpers/harness.mjs';

let h;
before(async () => { h = await createHarness(); });
after(async () => { await h.dispose(); });

// Anything outside public/. If pages_build_output_dir regresses, these start
// returning 200 with real contents.
const mustNotBePublished = [
  '/wrangler.toml',
  '/.dev.vars',
  '/.env',
  '/package.json',
  '/migrations/001_schema.sql',
  '/functions/lib/auth.js',
  '/functions/lib/turnstile.js',
  '/functions/api/auth/login.js',
  '/functions/_middleware.js',
  '/agent.md',
  '/AGENTS.md',
  '/context.md',
  '/STATUS.md',
  '/HUMAN-TASKS.md',
  '/FIXPLAN-2026-08-02.md',
  // The docs archive (moved 2026-08-02) and the root paths it moved FROM -- a
  // regression that republishes repo internals could resurrect either.
  '/docs/README.md',
  '/docs/SUBAGENT-PLAYBOOK.md',
  '/docs/audits/AUDIT-ROUND-3.md',
  '/docs/handoffs/HANDOFF-2026-07-31-v5.md',
  '/docs/prompts/STATUS-AUDIT-PROMPT.md',
  '/AUDIT-ROUND-3.md',
  '/SUBAGENT-PLAYBOOK.md',
  '/HANDOFF-2026-07-31-v5.md',
  '/scripts/generate-pin-seed.mjs',
  '/tests/helpers/harness.mjs',
  '/tests/headers.test.mjs',
  // A full DNS export of the zone, regenerated during F9. No secrets in it, but
  // it maps the whole infrastructure and has no business being served.
  '/drsumyapervin.com.txt',
  '/docs/handoffs/HANDOFF-2026-08-03-v4.md',
  // The digest Worker (F8) lives beside the Pages project but is deployed
  // separately; its config carries the D1 database id and the sender address.
  '/workers/digest/index.js',
  '/workers/digest/wrangler.toml',
  '/netlify.toml',
  // F10's DOM layer (2026-08-04). The config names the test directory and the
  // helper carries the siteverify token protocol, which tells an attacker
  // exactly what shape of stubbing this deployment's harness accepts.
  '/playwright.config.mjs',
  '/tests/e2e/helpers/site.mjs',
  '/tests/e2e/booking-submit.spec.mjs',
  // F11 (2026-08-04). The workflows name the probed endpoints and the runner
  // setup; the runbook and its script describe exactly where a plaintext export
  // of every patient row is written.
  '/.github/workflows/ci.yml',
  '/.github/workflows/uptime.yml',
  '/scripts/backup-d1.mjs',
  '/docs/RUNBOOK-BACKUP.md',
  // Backups themselves never reach the working tree of a deploy (backups/ is
  // gitignored), but a regression that published the repo root would serve one.
  '/backups/',
  '/.git/config'
];

// Strings that must never appear in any response body, whatever the status.
const secretMarkers = [
  'JWT_SECRET',
  'SITE_SECRET',
  'TURNSTILE_SECRET',
  'pin_hash',
  'pin_salt',
  'CLOUDFLARE_API_TOKEN',
  'd7de1bebbdb2170b0d242f6dd3c12e21e4d8334159ef808ac8290302b4c0a7b9', // seeded hash
  'dc3bc6a6f8b33a40ff6c78702a46b720' // seeded salt
];

for (const path of mustNotBePublished) {
  test(`${path} is not published`, async () => {
    const res = await h.anon('GET', path);
    const body = await res.text();

    assert.equal(res.status, 404, `${path} is being served`);
    // A 404 is not enough on its own -- assert it is the custom page, not an
    // index fallback that happens to carry a 404 status.
    assert.ok(body.includes('<!DOCTYPE html>'), `${path} did not return the 404 page`);

    for (const marker of secretMarkers) {
      assert.ok(!body.includes(marker), `${path} response contains "${marker}"`);
    }
  });
}

test('path traversal cannot escape public/', async () => {
  for (const path of ['/../wrangler.toml', '/assets/../../wrangler.toml', '/%2e%2e/wrangler.toml']) {
    const res = await h.anon('GET', path);
    const body = await res.text();
    assert.ok(!body.includes('TURNSTILE_HOSTNAMES'), `${path} escaped public/`);
  }
});

test('the site itself is served, so a green sweep is not just a dead site', async () => {
  // A 404 on everything would pass every assertion above while the site was down.
  const res = await h.anon('GET', '/');
  const body = await res.text();

  assert.equal(res.status, 200);
  assert.ok(body.includes('<!DOCTYPE html>'));
  assert.ok(body.length > 10000, 'the index page looks truncated');

  for (const marker of secretMarkers) {
    assert.ok(!body.includes(marker), `the index page contains "${marker}"`);
  }
});

test('the published assets carry no secrets either', async () => {
  for (const path of ['/js/main.js', '/404.html']) {
    const res = await h.anon('GET', path);
    assert.equal(res.status, 200, path);

    const body = await res.text();
    for (const marker of secretMarkers) {
      assert.ok(!body.includes(marker), `${path} contains "${marker}"`);
    }
  }
});
