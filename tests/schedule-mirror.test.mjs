// public/js/main.js mirrors the chamber weekdays so the booking form can refuse a
// closed day before the patient submits (R-8). A mirror is a second copy, and a
// second copy drifts -- silently, and in the direction that hurts most: the form
// would cheerfully accept a Friday the server then rejects with a 400, which is
// exactly the failure the mirror exists to prevent.
//
// functions/lib/schedule.js stays the single source of truth. This asserts the
// copy still matches it, key for key and day for day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { repoRoot } from './helpers/harness.mjs';
import { CHAMBERS } from '../functions/lib/schedule.js';

const source = await readFile(join(repoRoot, 'public', 'js', 'main.js'), 'utf8');

function mirroredDays() {
  const block = source.match(/const CHAMBER_DAYS = \{([\s\S]*?)\n  \};/);
  assert.ok(block, 'main.js no longer declares CHAMBER_DAYS: the client-side weekday gate is gone');
  const out = {};
  for (const [, key, days] of block[1].matchAll(/'([^']+)':\s*\[([^\]]*)\]/g)) {
    out[key] = days.split(',').map((d) => Number(d.trim()));
  }
  return out;
}

test('the client mirror covers exactly the chambers the server knows', () => {
  assert.deepEqual(
    Object.keys(mirroredDays()).sort(),
    Object.keys(CHAMBERS).sort(),
    'the chamber keys in main.js and functions/lib/schedule.js disagree'
  );
});

test('every mirrored chamber has the same consulting days as the server', () => {
  const mirror = mirroredDays();
  for (const [name, chamber] of Object.entries(CHAMBERS)) {
    assert.deepEqual(
      [...mirror[name]].sort(),
      [...chamber.days].sort(),
      `${name}: the client would accept different days than the server does`
    );
  }
});

test('the chamber keys are the exact option values the form posts', async () => {
  // The mirror is keyed by <option value>, so a reworded option silently turns
  // the lookup into undefined and the gate into a no-op that passes everything.
  const html = await readFile(join(repoRoot, 'public', 'index.html'), 'utf8');
  const select = html.slice(html.indexOf('id="chamberSelect"'));
  const values = [...select.slice(0, select.indexOf('</select>')).matchAll(/value="([^"]+)"/g)]
    .map((m) => m[1].replace(/&amp;/g, '&'));

  for (const key of Object.keys(CHAMBERS)) {
    assert.ok(values.includes(key), `no <option value> matches the chamber key ${key}`);
  }
});

test('Friday is closed at both chambers, so the gate has something to catch', () => {
  // A sanity anchor: if this ever passes vacuously the tests above prove only
  // that two empty things match each other.
  for (const [name, chamber] of Object.entries(CHAMBERS)) {
    assert.ok(!chamber.days.includes(5), `${name} now consults on Friday -- the copy in main.js needs updating`);
  }
});
