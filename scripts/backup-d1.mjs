#!/usr/bin/env node
// F11 — take a timestamped export of production D1. See docs/RUNBOOK-BACKUP.md.
//
// This is a thin wrapper on `wrangler d1 export`, and the thinness is the point:
// the value it adds is the checks AROUND the export, not the export itself.
// A backup nobody verified is not a backup, and the specific way this one fails
// is quiet — wrangler exits 0 and writes a file whether or not the file is
// usable.
//
// OPERATOR-RUN. It reads remote D1 and writes patient names, phone numbers,
// medical notes and the admin PIN hash to disk. That file must never be
// committed (backups/ is gitignored) and should be moved somewhere encrypted.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const backupDir = join(repoRoot, 'backups');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const outFile = join(backupDir, `d1-${stamp}.sql`);

// The four tables migrations/001_schema.sql creates. A restore that is missing
// one of these is missing a table, not merely missing rows.
const EXPECTED_TABLES = ['appointments', 'gallery', 'admin_settings', 'contact_messages'];

mkdirSync(backupDir, { recursive: true });

console.log(`Exporting dr-sumya-pervin-db (remote) -> ${outFile}`);
execFileSync(
  'npx',
  ['wrangler', 'd1', 'export', 'dr-sumya-pervin-db', '--remote', '--output', outFile],
  { stdio: 'inherit', cwd: repoRoot }
);

const sql = readFileSync(outFile, 'utf8');
const bytes = statSync(outFile).size;
const inserts = (sql.match(/^INSERT INTO/gm) || []).length;
const missing = EXPECTED_TABLES.filter((t) => !new RegExp(`CREATE TABLE[^;]*\\b${t}\\b`, 'i').test(sql));

console.log(`\n  bytes:   ${bytes}`);
console.log(`  tables:  ${EXPECTED_TABLES.length - missing.length}/${EXPECTED_TABLES.length}`);
console.log(`  inserts: ${inserts}`);

// A missing table is the failure that matters. Zero INSERTs is NOT a failure --
// production D1 is frequently empty, and a schema-only export of an empty
// database is a correct backup. Conflating the two would train the operator to
// ignore this script's warnings.
if (missing.length) {
  console.error(`\n✗ FAILED: no CREATE TABLE for: ${missing.join(', ')}`);
  console.error('  Do not treat this file as a backup. Re-run, and check wrangler auth.');
  process.exit(1);
}

console.log('\n✓ Export looks structurally sound.');
if (inserts === 0) {
  console.log('  Note: 0 rows. Expected if production D1 is empty — not a failure.');
}
console.log('\n⚠ This file contains patient data and the admin PIN hash.');
console.log('  Move it somewhere private and encrypted, then delete the local copy.');
console.log('  Restore drill: docs/RUNBOOK-BACKUP.md');
