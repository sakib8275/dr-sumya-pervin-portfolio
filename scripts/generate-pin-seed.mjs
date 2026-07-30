#!/usr/bin/env node
// Generates the admin PIN seed values for migrations/001_schema.sql.
//
// WHY THIS EXISTS: the original PIN was generated inside an agent session
// transcript and written to no file, on the theory that it would be relayed to
// the practice out of band. It never was, and it was lost — which made the
// seeded hash in the migration unlock nothing. This script exists so the
// plaintext PIN is typed by a human, into their own terminal, and never passes
// through a transcript, a log, or a tracked file.
//
// It deliberately prints the salt and hash ONLY. Those are not secret — they
// already live in the migration by design. The PIN itself is never echoed,
// never printed back, and never written anywhere.
//
// Run it yourself:   npm run seed-pin
// Then paste the two values it prints into migrations/001_schema.sql.
//
// Hashing is imported from functions/lib/auth.js rather than reimplemented, so
// this can never drift from what the login endpoint actually verifies.

import { newSalt, hashPin } from '../functions/lib/auth.js';

// Matches MIN_PIN_LENGTH in functions/api/config/index.js. A seed the CMS would
// reject on rotation would be an inconsistent starting state.
const MIN_PIN_LENGTH = 8;

// Reads a line with the terminal's echo off, so the PIN never appears on screen
// or in scrollback. Falls back to a plain read when stdin is not a TTY, and says
// so, because a piped PIN can land in shell history.
function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    const { stdin } = process;
    const isTTY = stdin.isTTY;

    if (!isTTY) {
      process.stdout.write('\n  (stdin is not a terminal — input will not be hidden)\n');
    } else {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding('utf8');

    let buf = '';
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\n' || ch === '\r' || ch === '\u0004') {
          if (isTTY) stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          stdin.pause();
          process.stdout.write('\n');
          return resolve(buf);
        }
        if (ch === '\u0003') {                       // Ctrl-C
          if (isTTY) stdin.setRawMode(false);
          process.stdout.write('\n');
          return reject(new Error('cancelled'));
        }
        if (ch === '\u007f' || ch === '\b') {        // backspace
          buf = buf.slice(0, -1);
          continue;
        }
        buf += ch;
      }
    };
    stdin.on('data', onData);
  });
}

// Verifies that this script and the server agree, using a throwaway value. If
// hashPin ever changes shape, this fails loudly rather than silently seeding a
// hash that login cannot reproduce.
async function selfTest() {
  const salt = newSalt();
  const a = await hashPin('self-test-value', salt);
  const b = await hashPin('self-test-value', salt);
  const c = await hashPin('self-test-value', newSalt());

  const ok =
    /^[0-9a-f]{32}$/.test(salt) &&   // 16 bytes hex
    /^[0-9a-f]{64}$/.test(a) &&      // 32 bytes hex
    a === b &&                        // deterministic for a given salt
    a !== c;                          // salt actually participates

  if (!ok) throw new Error('self-test failed — hashPin/newSalt do not behave as expected');
  return { saltLen: salt.length, hashLen: a.length };
}

async function main() {
  const shape = await selfTest();

  if (process.argv.includes('--self-test')) {
    console.log(`self-test OK — salt ${shape.saltLen} hex chars, hash ${shape.hashLen} hex chars`);
    return;
  }

  console.log('\nAdmin PIN seed generator');
  console.log('════════════════════════');
  console.log('The PIN you type is not shown, not stored, and not printed back.');
  console.log('Only its salt and hash are output. Keep the PIN somewhere durable');
  console.log('BEFORE you continue — it cannot be recovered from the hash.\n');

  const pin = await readHidden('  New admin PIN: ');
  if (pin.length < MIN_PIN_LENGTH) {
    console.error(`\n  ✗ PIN must be at least ${MIN_PIN_LENGTH} characters (got ${pin.length}).`);
    process.exit(1);
  }

  const again = await readHidden('  Confirm PIN:   ');
  if (pin !== again) {
    console.error('\n  ✗ PINs did not match. Nothing was generated.');
    process.exit(1);
  }

  const salt = newSalt();
  const hash = await hashPin(pin, salt);

  console.log('\n  Paste these into the INSERT at the bottom of migrations/001_schema.sql:\n');
  console.log(`    pin_hash  '${hash}'`);
  console.log(`    pin_salt  '${salt}'`);
  console.log('\n  Full statement:\n');
  console.log("INSERT OR IGNORE INTO admin_settings (id, pin_hash, pin_salt) VALUES (");
  console.log('  1,');
  console.log(`  '${hash}',`);
  console.log(`  '${salt}'`);
  console.log(');');
  console.log('\n  Note: the seed is INSERT OR IGNORE. If the migration has already run');
  console.log('  against this database, it will do nothing — use UPDATE instead:\n');
  console.log(`UPDATE admin_settings SET pin_hash = '${hash}', pin_salt = '${salt}',`);
  console.log("  updated_at = datetime('now') WHERE id = 1;");
  console.log('');
}

main().catch((err) => {
  console.error(err.message === 'cancelled' ? '\n  Cancelled.' : `\n  ✗ ${err.message}`);
  process.exit(1);
});
