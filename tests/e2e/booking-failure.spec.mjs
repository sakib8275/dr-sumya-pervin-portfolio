// F10 spec 3 — the booking FAILURE state is real and specific.
//
// A booking form that silently does nothing on failure is worse than one that
// errors: the patient believes they have an appointment. Two things are proven
// here: the failure is visible at all, and it carries the SERVER's message
// rather than a generic one, because the server's messages are actionable
// ("that chamber is closed on Friday, next open day is ...").
//
// The confirmation view must NOT appear -- the 2026-08-04 UX batch hides the
// form on success, and a bug that hid it on failure too would leave the patient
// staring at an empty modal.
import { test, expect, stubTurnstile, openBookingModal } from './helpers/site.mjs';

async function fill(page, { date, chamber = 'Alliance Hospital Limited (Shyamoli)' }) {
  await page.locator('#patientName').fill('Failure Path');
  await page.locator('#patientPhone').fill('01711000000');
  await page.locator('#chamberSelect').selectOption(chamber);
  await page.locator('#appointmentDate').fill(date);
}

// The SERVER-rejected date must still pass the CLIENT's checks, or the browser
// stops the submit and the request under test is never sent. main.js sets
// dateInput.min to today (main.js:653), so a past date fails native constraint
// validation and no submit event ever fires -- a real behaviour, but not this
// one. A future Friday clears every client check and is refused by
// functions/lib/schedule.js, which closes both chambers that day.
function nextClosedDay() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

test('a server rejection shows the failure state with the server message', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);
  await openBookingModal(page);

  await fill(page, { date: nextClosedDay() });
  await page.locator('#bookingForm button[type="submit"]').click();

  const status = page.locator('#bookingStatus');
  await expect(status).toBeVisible();
  await expect(status).not.toContainText('Appointment Request Submitted');

  // The form stays on screen so the patient can correct the date -- this is the
  // asymmetry with the success path, and it is deliberate.
  await expect(page.locator('#bookingForm')).toBeVisible();

  // Nothing was written.
  const count = await site.harness.db
    .prepare('SELECT COUNT(*) AS n FROM appointments')
    .first();
  expect(count.n).toBe(0);
});

test('a Turnstile rejection fails closed and writes nothing', async ({ page, site }) => {
  // The token siteverify will refuse. This is the fail-closed path: a booking
  // that cannot be verified must never reach D1.
  await stubTurnstile(page, { token: 'rejected' });
  await page.goto(site.baseURL);
  await openBookingModal(page);

  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 3);
  while (d.getUTCDay() === 5) d.setUTCDate(d.getUTCDate() + 1);
  await fill(page, { date: d.toISOString().slice(0, 10) });
  await page.locator('#bookingForm button[type="submit"]').click();

  await expect(page.locator('#bookingStatus')).toBeVisible();
  await expect(page.locator('#bookingStatus')).not.toContainText('Appointment Request Submitted');
  await expect(page.locator('#bookingForm')).toBeVisible();

  const count = await site.harness.db.prepare('SELECT COUNT(*) AS n FROM appointments').first();
  expect(count.n, 'an unverified booking must never be stored').toBe(0);
});

test('the submit button is re-enabled after a failure so the patient can retry', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);
  await openBookingModal(page);

  await fill(page, { date: nextClosedDay() });
  const submit = page.locator('#bookingForm button[type="submit"]');
  await submit.click();
  await expect(page.locator('#bookingStatus')).toBeVisible();

  // A double-submit guard that never releases turns one bad date into a dead
  // form: the patient fixes the date and the button no longer responds.
  await expect(submit).toBeEnabled();

  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 3);
  while (d.getUTCDay() === 5) d.setUTCDate(d.getUTCDate() + 1);
  await page.locator('#appointmentDate').fill(d.toISOString().slice(0, 10));
  await submit.click();
  await expect(page.locator('#bookingStatus')).toContainText('Appointment Request Submitted');
});
