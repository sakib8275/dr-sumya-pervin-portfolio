// F10 spec 5 — the pre-hydration submit guard.
//
// This is the highest-value spec in F10, and the least obvious.
//
// The booking form carried onsubmit="return false" to stop the browser's native
// submission. F9 shipped a CSP with no 'unsafe-inline' in script-src, which
// DROPS that attribute -- with no console error, no failed request and no
// failing test. The consequence is not a dead button: the form has no action and
// no method, so a native submit becomes a GET to "/?" that reloads the page and
// throws the patient's booking away. Silently.
//
// public/js/formguard.js replaces the attribute with a capturing document-level
// listener loaded blocking from <head>, so it is active before any form on the
// page has even been parsed. This spec proves that window survives: between
// first paint and main.js executing, an Enter keypress must not navigate.
import { test, expect, stubTurnstile, openBookingModal } from './helpers/site.mjs';

test('formguard.js is blocking in <head>, before the forms exist', async ({ page, site }) => {
  await page.goto(site.baseURL);

  // Position is the whole mechanism: deferred or moved to the end of <body>, the
  // guard would attach after the window it exists to cover.
  const placement = await page.evaluate(() => {
    const tag = document.querySelector('script[src*="formguard"]');
    if (!tag) return null;
    return {
      inHead: tag.closest('head') !== null,
      deferred: tag.defer || tag.async,
      formsAfter: document.querySelectorAll('form').length
    };
  });

  expect(placement, 'formguard.js must be on the page').not.toBeNull();
  expect(placement.inHead, 'formguard.js must load from <head>').toBe(true);
  expect(placement.deferred, 'formguard.js must not be defer/async').toBe(false);
  expect(placement.formsAfter).toBeGreaterThan(0);
});

test('a native submit before hydration does not navigate away', async ({ page, site }) => {
  // main.js never arrives -- the flaky-connection case, and the same end state a
  // silently-dropped inline handler produces.
  await page.route('**/js/main.js', (route) => route.abort());
  await page.goto(site.baseURL);

  const urlBefore = page.url();

  // requestSubmit() is the right tool HERE, unlike spec 1: this test is about
  // the browser's NATIVE submission, which is exactly what it triggers. A
  // pointer click would additionally depend on main.js, which is aborted.
  const navigated = await page.evaluate(async () => {
    const form = document.getElementById('bookingForm');
    const before = location.href;
    form.requestSubmit();
    await new Promise((r) => setTimeout(r, 300));
    return { before, after: location.href };
  });

  expect(navigated.after, 'the guard must cancel the native submission').toBe(navigated.before);
  expect(page.url()).toBe(urlBefore);
  // A GET submit would have appended "?" and dropped every field.
  expect(page.url()).not.toContain('?');
});

test('the guard cancels the default without stopping main.js own handler', async ({ page, site }) => {
  // preventDefault does not stop propagation. If formguard had used
  // stopPropagation instead, this booking would never be sent -- the form would
  // look identical and do nothing.
  await stubTurnstile(page);
  await page.goto(site.baseURL);
  await openBookingModal(page);

  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 3);
  while (d.getUTCDay() === 5) d.setUTCDate(d.getUTCDate() + 1);

  await page.locator('#patientName').fill('Guard Coexistence');
  await page.locator('#patientPhone').fill('01711000000');
  await page.locator('#chamberSelect').selectOption('Alliance Hospital Limited (Shyamoli)');
  await page.locator('#appointmentDate').fill(d.toISOString().slice(0, 10));

  // Enter inside a text field triggers implicit submission -- the exact gesture
  // the original onsubmit attribute existed to intercept.
  await page.locator('#patientName').press('Enter');

  await expect(page.locator('#bookingStatus')).toContainText('Appointment Request Submitted');
  expect(page.url()).not.toContain('?');

  const row = await site.harness.db
    .prepare('SELECT patient_name FROM appointments ORDER BY rowid DESC LIMIT 1')
    .first();
  expect(row.patient_name).toBe('Guard Coexistence');
});
