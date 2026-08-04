// F10 spec 1 — a REAL pointer click drives a booking end to end.
//
// The 191-test API suite proves the endpoint. tests/headers.test.mjs proves no
// on*= attribute is in public/. Neither proves the button is WIRED: under a CSP
// with no 'unsafe-inline' in script-src, a handler that regressed to an inline
// attribute is dropped silently -- no console error, no failed request, no
// failing test, the button just does nothing. Only a real click through a real
// browser to a real D1 row catches that.
//
// Also carries the 2026-08-04 UX batch's booking-success assertions
// (docs/audits/UX-AUDIT-2026-08-04.md) so they cannot silently regress.
import { test, expect, stubTurnstile, openBookingModal } from './helpers/site.mjs';

// Chosen against functions/lib/schedule.js: Alliance opens Sat-Thu, so a date
// far enough ahead on an open weekday is valid regardless of when the suite runs.
function nextOpenDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 3);
  // 5 = Friday in UTC terms; both chambers are closed Friday in Dhaka.
  while (d.getUTCDay() === 5) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function fillBooking(page, { date }) {
  await page.locator('#patientName').fill('E2E Pointer Click');
  await page.locator('#patientPhone').fill('01711000000');
  await page.locator('#chamberSelect').selectOption('Alliance Hospital Limited (Shyamoli)');
  await page.locator('#appointmentDate').fill(date);
  await page.locator('#patientMessage').fill('spec 1');
}

test('a real pointer click on the submit button books an appointment', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  await openBookingModal(page);
  await expect(page.locator('#bookingModal')).toHaveClass(/active/);

  await fillBooking(page, { date: nextOpenDate() });

  // The point of the spec: a genuine pointer event, not form.requestSubmit() and
  // not dispatchEvent(new Event('submit')). Those synthesise the handler this
  // spec exists to prove is attached.
  await page.locator('#bookingForm button[type="submit"]').click();

  await expect(page.locator('#bookingStatus')).toContainText('Appointment Request Submitted');

  const reference = (await page.locator('#bookingStatus').textContent()).match(/book-[a-f0-9]+/);
  expect(reference, 'the confirmation must carry a booking reference').not.toBeNull();

  // The row really exists, written by the real Worker through the real binding.
  const row = await site.harness.db
    .prepare('SELECT id, patient_name, chamber, service, status FROM appointments WHERE id = ?')
    .bind(reference[0])
    .first();
  expect(row).toBeTruthy();
  expect(row.patient_name).toBe('E2E Pointer Click');
  expect(row.status).toBe('Pending');
});

test('on success the modal shows only the confirmation, and reopening restores the form', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  await openBookingModal(page);
  await fillBooking(page, { date: nextOpenDate() });
  await page.locator('#bookingForm button[type="submit"]').click();
  await expect(page.locator('#bookingStatus')).toContainText('Appointment Request Submitted');

  // UX batch: the operator asked for the confirmation ALONE -- a patient who has
  // just booked should not be looking at a form that invites a second booking.
  await expect(page.locator('#bookingForm')).toBeHidden();
  await expect(page.locator('#bookingModal .modal-header')).toBeHidden();
  await expect(page.locator('#bookingStatus')).toBeVisible();

  // ...and the confirmation must still carry the WhatsApp forward, which is how
  // the request actually reaches the doctor.
  await expect(page.locator('#bookingStatus a[href*="wa.me"]')).toHaveCount(
    (await site.harness.db.prepare('SELECT whatsapp FROM admin_settings WHERE id = 1').first()).whatsapp ? 1 : 0
  );

  await page.locator('#bookingModal .modal-close').click();
  await openBookingModal(page);

  // Reopening gives a FRESH form, not the stale confirmation.
  await expect(page.locator('#bookingForm')).toBeVisible();
  await expect(page.locator('#bookingModal .modal-header')).toBeVisible();
  await expect(page.locator('#bookingStatus')).toBeHidden();
  await expect(page.locator('#patientName')).toHaveValue('');
});

test('every quiz outcome lands on a real, selectable service option', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  // The 2026-08-04 critical bug: the quiz recommended SERVICES_DATA names that
  // were never <option> values of #serviceType, so the select silently went
  // blank and the server rejected EVERY quiz-driven booking as a missing
  // required field. A patient saw a generic failure with nothing to fix.
  const expected = {
    acne: 'Microneedling with Serums',
    pigmentation: 'Chemical Peels',
    hair: 'Hair Loss & Scalp Treatments',
    aging: 'Facial & Neck Mesotherapy'
  };

  for (const [goal, service] of Object.entries(expected)) {
    await page.locator(`[data-goal="${goal}"]`).click();
    await page.locator('[data-type="oily"]').click();
    await page.locator('#bookQuizRecBtn').click();

    const select = page.locator('#serviceType');
    await expect(select).toHaveValue(service);
    // selectedIndex >= 0 is the assertion that actually encodes the bug: a value
    // with no matching option leaves the select at -1 with an empty value.
    expect(await select.evaluate((el) => el.selectedIndex)).toBeGreaterThanOrEqual(0);

    await page.locator('#bookingModal .modal-close').click();
  }

  // And the recommendation is bookable, not merely displayed.
  await page.locator('[data-goal="hair"]').click();
  await page.locator('[data-type="oily"]').click();
  await page.locator('#bookQuizRecBtn').click();
  await fillBooking(page, { date: nextOpenDate() });
  await page.locator('#serviceType').selectOption('Hair Loss & Scalp Treatments');
  await page.locator('#bookingForm button[type="submit"]').click();

  await expect(page.locator('#bookingStatus')).toContainText('Appointment Request Submitted');
  const row = await site.harness.db
    .prepare('SELECT service FROM appointments ORDER BY rowid DESC LIMIT 1')
    .first();
  expect(row.service).toBe('Hair Loss & Scalp Treatments');
});

test('content is visible when main.js never runs', async ({ page, site }) => {
  // The reveal animation's hidden start state is gated on html.reveal, which
  // main.js adds only once it is actually running. Before that gate existed, any
  // JS failure -- a 404 on main.js, an early throw, a blocked script -- left
  // every [data-r] element invisible forever: a blank page for exactly the
  // patients on the flakiest connections.
  await page.route('**/js/main.js', (route) => route.abort());
  await page.goto(site.baseURL);

  await expect(page.locator('html')).not.toHaveClass(/reveal/);

  const invisible = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-r]')).filter(
      (el) => getComputedStyle(el).opacity === '0'
    ).length
  );
  expect(invisible, 'no [data-r] element may be invisible without main.js').toBe(0);
  await expect(page.locator('#serviceType')).toHaveCount(1);
});

test('critical tap targets stay thumb-sized at 375px', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(site.baseURL);
  await openBookingModal(page);

  // 24px is the WCAG 2.2 target-size minimum. The step dots are the trap here:
  // box-sizing is global border-box, so their 24px is the OUTER box and a naive
  // width:8px + border edit collapses them (see public/css/style.css:1045).
  const measured = await page.evaluate(() => {
    const out = {};
    for (const sel of ['.step-dots button', '.tst-nav button', '.faq-send', '.modal-close']) {
      out[sel] = Array.from(document.querySelectorAll(sel)).map((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });
    }
    out.overflow = document.documentElement.scrollWidth > window.innerWidth;
    return out;
  });

  expect(measured.overflow, 'the page must not scroll sideways at 375px').toBe(false);
  for (const [sel, boxes] of Object.entries(measured)) {
    if (sel === 'overflow') continue;
    expect(boxes.length, `${sel} should exist to be measured`).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box.w, `${sel} width`).toBeGreaterThanOrEqual(24);
      expect(box.h, `${sel} height`).toBeGreaterThanOrEqual(24);
    }
  }
});
