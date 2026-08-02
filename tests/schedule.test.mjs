// Chamber schedule rules, unit-tested at the boundaries that matter.
//
// Reference calendar: 2026-08-02 is a Sunday. Both chambers consult on Sundays.
// Alliance: Sat–Thu, consultation 17:00, same-day cutoff 16:30 Dhaka.
// DCIMCH:   Sat–Wed, consultation 15:00, same-day cutoff 14:30 Dhaka.
// Dhaka is UTC+6 with no DST, so fixed-offset arithmetic is exact.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAMBERS, dhakaParts, weekdayOf, addDays, nextOpenDate, validateSlot
} from '../functions/lib/schedule.js';

const ALLIANCE = 'Alliance Hospital Limited (Shyamoli)';
const DCIMCH = 'Dhaka Central International Medical College (DCIMCH)';
// Dhaka wall time -> UTC Date. Sunday 2026-08-02 unless noted.
const dhaka = (hm, date = '2026-08-02') => {
  const [h, m] = hm.split(':').map(Number);
  return new Date(Date.UTC(2026, 7, Number(date.slice(8)), h - 6, m));
};

test('the chamber keys match the exact option values the booking form posts', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const values = [...html.matchAll(/<option value="([^"]+)"[^>]*>(?:Alliance|DCIMCH)/g)].map((m) => m[1]);
  assert.deepEqual(Object.keys(CHAMBERS).sort(), values.sort());
});

test('dhakaParts crosses the UTC date boundary correctly', () => {
  // 2026-08-02 19:30 UTC is already 01:30 on 2026-08-03 in Dhaka.
  const p = dhakaParts(new Date('2026-08-02T19:30:00Z'));
  assert.equal(p.dateStr, '2026-08-03');
  assert.equal(p.minutes, 90);
});

test('weekdayOf pins the reference calendar', () => {
  assert.equal(weekdayOf('2026-08-02'), 0); // Sunday
  assert.equal(weekdayOf('2026-08-06'), 4); // Thursday
  assert.equal(weekdayOf('2026-08-07'), 5); // Friday
  assert.equal(weekdayOf('2026-08-08'), 6); // Saturday
});

test('one minute before the Alliance cutoff, same-day is still bookable', () => {
  assert.equal(validateSlot(ALLIANCE, '2026-08-02', dhaka('16:29')), null);
});

test('at the Alliance cutoff, same-day closes with the time and the next open date', () => {
  const err = validateSlot(ALLIANCE, '2026-08-02', dhaka('16:30'));
  assert.match(err, /close at 4:30 PM/);
  assert.match(err, /next available date is 2026-08-03/); // Monday, open
});

test('the DCIMCH cutoff is 14:30, not 16:30', () => {
  assert.equal(validateSlot(DCIMCH, '2026-08-02', dhaka('14:29')), null);
  const err = validateSlot(DCIMCH, '2026-08-02', dhaka('14:30'));
  assert.match(err, /close at 2:30 PM/);
});

test('a future date is unaffected by the cutoff', () => {
  assert.equal(validateSlot(ALLIANCE, '2026-08-03', dhaka('23:59')), null);
});

test('Thursday is refused for DCIMCH with Saturday offered next', () => {
  const err = validateSlot(DCIMCH, '2026-08-06', dhaka('09:00'));
  assert.match(err, /does not consult at DCIMCH on Thursdays/);
  assert.match(err, /next available date is 2026-08-08/); // Friday is closed too
});

test('Friday is refused for Alliance with Saturday offered next', () => {
  const err = validateSlot(ALLIANCE, '2026-08-07', dhaka('09:00'));
  assert.match(err, /does not consult at Alliance Hospital on Fridays/);
  assert.match(err, /next available date is 2026-08-08/);
});

test('a past date is refused regardless of the schedule', () => {
  assert.match(validateSlot(ALLIANCE, '2026-08-01', dhaka('09:00')), /already passed/);
});

test('an unknown chamber is refused', () => {
  assert.match(validateSlot('Some Other Clinic', '2026-08-03', dhaka('09:00')), /listed chambers/);
});

test('the cutoff check compares against Dhaka "today", not server-local or UTC "today"', () => {
  // 23:30 UTC on 08-02 is 05:30 Dhaka on 08-03 -- a booking for Dhaka "today"
  // (08-03) is hours before the cutoff and must pass.
  const now = new Date('2026-08-02T23:30:00Z');
  assert.equal(dhakaParts(now).dateStr, '2026-08-03');
  assert.equal(validateSlot(ALLIANCE, '2026-08-03', now), null);
});

test('nextOpenDate skips closed days and never walks past a week', () => {
  assert.equal(nextOpenDate(ALLIANCE, '2026-08-07'), '2026-08-08'); // Fri -> Sat
  assert.equal(nextOpenDate(DCIMCH, '2026-08-06'), '2026-08-08');   // Thu -> Sat
  assert.equal(nextOpenDate(ALLIANCE, '2026-08-02'), '2026-08-02'); // already open
});

test('addDays rolls over month boundaries', () => {
  assert.equal(addDays('2026-08-31', 1), '2026-09-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});
