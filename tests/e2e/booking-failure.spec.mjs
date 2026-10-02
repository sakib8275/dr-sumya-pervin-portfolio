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
// stops the submit and the request under test is never sent.
//
// This used to be a future Friday: it cleared every client check and was refused
// by functions/lib/schedule.js, which closes both chambers that day. Since the
// R-8 fix on 2026-08-27, main.js mirrors the chamber weekdays and refuses a
// closed day itself -- so a Friday never reaches the server any more, which is
// the whole point of that change and is covered by its own spec below.
//
// These two tests are about how a server rejection RENDERS, so the rejection is
// now injected at the route. The real closed-day refusal by the real Worker is
// covered end-to-end in tests/booking.test.mjs ('a Friday booking is refused').
const SERVER_MESSAGE =
  'Dr. Pervin does not consult at Alliance Hospital on Fridays. The next available date is 2026-08-29.';

async function stubRejection(page, message = SERVER_MESSAGE) {
  await page.route('**/api/appointments', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: message })
        })
      : route.continue()
  );
}

// A date both chambers are open on, so nothing but the stub decides the outcome.
function nextOpenDay() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 5 || d.getUTCDay() === 4) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

test('a server rejection shows the failure state with the server message', async ({ page, site }) => {
  await stubTurnstile(page);
  await stubRejection(page);
  await page.goto(site.baseURL);
  await openBookingModal(page);

  await fill(page, { date: nextOpenDay() });
  await page.locator('#bookingForm button[type="submit"]').click();

  const status = page.locator('#bookingStatus');
  await expect(status).toBeVisible();
  await expect(status).not.toContainText('Appointment Request Submitted');
  // The server's message, not a generic one: it tells the patient what to do next.
  await expect(status).toContainText('does not consult at Alliance Hospital on Fridays');

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

  // Fail once, then let the retry through, so this also proves the progress
  // state added on 2026-08-27 restores the button's label and not just its
  // enabled flag -- a button stuck on "Sending your request..." is as dead to a
  // patient as a disabled one.
  await stubRejection(page);
  await fill(page, { date: nextOpenDay() });
  const submit = page.locator('#bookingForm button[type="submit"]');
  const label = (await submit.textContent()).trim();
  await submit.click();
  await expect(page.locator('#bookingStatus')).toBeVisible();

  // A double-submit guard that never releases turns one bad date into a dead
  // form: the patient fixes the date and the button no longer responds.
  await expect(submit).toBeEnabled();
  await expect(submit).toHaveText(label);
  await expect(submit).not.toHaveAttribute('aria-busy', 'true');

  await page.unroute('**/api/appointments');
  await submit.click();
  await expect(page.locator('#bookingStatus')).toContainText('Appointment Request Submitted');
});

test('a chamber closed on the chosen day is refused before anything is sent', async ({ page, site }) => {
  // R-8. A patient could pick a Friday for either chamber, or a Thursday for
  // DCIMCH, and only find out from a 400 after submitting -- the most likely
  // booking failure in ordinary use. main.js now mirrors the chamber weekdays
  // and catches it at the point of choosing.
  await stubTurnstile(page);
  await page.goto(site.baseURL);
  await openBookingModal(page);

  let posted = 0;
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/api/appointments')) posted++;
  });

  const friday = new Date();
  friday.setUTCDate(friday.getUTCDate() + 1);
  while (friday.getUTCDay() !== 5) friday.setUTCDate(friday.getUTCDate() + 1);
  await fill(page, { date: friday.toISOString().slice(0, 10) });

  // Shown on choosing, before any submit.
  const error = page.locator('#appointmentDateError');
  await expect(error).toContainText('does not consult on Fridays');
  await expect(error).toContainText('The next day it consults is');

  await page.locator('#bookingForm button[type="submit"]').click();
  await page.waitForTimeout(400);
  expect(posted, 'a closed day must never reach the server').toBe(0);

  const count = await site.harness.db.prepare('SELECT COUNT(*) AS n FROM appointments').first();
  expect(count.n).toBe(0);

  // DCIMCH also closes on Thursday, which Alliance does not -- the gate is
  // per-chamber, not one shared weekday list.
  const thursday = new Date();
  thursday.setUTCDate(thursday.getUTCDate() + 1);
  while (thursday.getUTCDay() !== 4) thursday.setUTCDate(thursday.getUTCDate() + 1);
  await page.locator('#appointmentDate').fill(thursday.toISOString().slice(0, 10));
  await page.locator('#chamberSelect').selectOption('Alliance Hospital Limited (Shyamoli)');
  await expect(error).toBeHidden();

  await page.locator('#chamberSelect').selectOption('Dhaka Central International Medical College (DCIMCH)');
  await expect(error).toContainText('does not consult on Thursdays');
});
