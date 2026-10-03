// Chamber schedule rules, unit-tested at the boundaries that matter.
//
// Reference calendar: 2026-08-02 is a Sunday. Both chambers consult on Sundays.
// Alliance: Sat–Thu, consultation 17:00, same-day cutoff 16:30 Dhaka.
// DCIMCH:   Sat–Wed, consultation 15:00, same-day cutoff 14:30 Dhaka.
// Dhaka is UTC+6 with no DST, so fixed-offset arithmetic is exact.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAMBERS, dhakaParts, dhakaTodayStr, weekdayOf, addDays, nextOpenDate,
  closedDayRefusal, validateSlot
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
  const html = await readFile(new URL('../public/book/index.html', import.meta.url), 'utf8');
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
  assert.match(err, /next open day is 2026-08-03/); // Monday, open
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
  assert.match(err, /next open day is 2026-08-08/); // Friday is closed too
});

test('Friday is refused for Alliance with Saturday offered next', () => {
  const err = validateSlot(ALLIANCE, '2026-08-07', dhaka('09:00'));
  assert.match(err, /does not consult at Alliance Hospital on Fridays/);
  assert.match(err, /next open day is 2026-08-08/);
});

test('the closed-day refusal is one message, shared by server and booking form', () => {
  // validateSlot delegates to closedDayRefusal, and the form calls it with a
  // nicer date formatter — same facts, same words, so the field error and a
  // server 400 can no longer disagree (they once did, down to the name).
  const direct = closedDayRefusal(DCIMCH, '2026-08-06');
  assert.equal(validateSlot(DCIMCH, '2026-08-06', dhaka('09:00')), direct);
  assert.match(direct, /Dr\. Sumya Pervin does not consult at DCIMCH on Thursdays/);
  assert.match(direct, /\(Saturday – Wednesday, 3:00 PM – 5:00 PM\)/);
  assert.ok(direct.endsWith('The next open day is 2026-08-08.'));
  assert.ok(closedDayRefusal(DCIMCH, '2026-08-06', () => 'SATURDAY').endsWith('The next open day is SATURDAY.'));
});

test('chamber display facts are derived from the minute facts', () => {
  const a = CHAMBERS[ALLIANCE];
  assert.equal(a.hours, '5:00 – 8:00 PM');
  assert.equal(a.scheduleLabel, 'Saturday – Thursday, 5:00 PM – 8:00 PM');
  assert.equal(a.session, 'Evening');
  assert.equal(a.daysShort, 'Sat–Thu');
  const d = CHAMBERS[DCIMCH];
  assert.equal(d.hours, '3:00 – 5:00 PM');
  assert.equal(d.scheduleLabel, 'Saturday – Wednesday, 3:00 PM – 5:00 PM');
  assert.equal(d.session, 'Afternoon');
});

test('dhakaTodayStr is the calendar date a patient in Dhaka means by "today"', () => {
  // 23:30 UTC on 08-02 is already 05:30 on 08-03 in Dhaka.
  assert.equal(dhakaTodayStr(new Date('2026-08-02T23:30:00Z')), '2026-08-03');
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
