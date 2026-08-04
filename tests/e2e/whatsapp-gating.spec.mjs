// F10 spec 4 — the WhatsApp CTA is gated on a real configured number.
//
// Both surfaces used to carry a hardcoded placeholder (+880 1700-000000), so a
// patient tapping "message the doctor" was messaging nobody, with no error and
// no way to tell. The fix makes both come from the CMS and stay hidden until a
// number exists -- so the gate is what has to be tested, in both directions.
//
// This matters more than it looks: the booking confirmation tells the patient to
// forward their request over WhatsApp. It is the last step of the booking flow,
// not a decoration, and a missing number breaks the handoff to the doctor.
import { test, expect, stubTurnstile, openBookingModal } from './helpers/site.mjs';

const NUMBER = '+880 1725-196101';
const DIGITS = '8801725196101';

function nextOpenDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 3);
  while (d.getUTCDay() === 5) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function book(page) {
  await openBookingModal(page);
  await page.locator('#patientName').fill('Gating Check');
  await page.locator('#patientPhone').fill('01711000000');
  await page.locator('#chamberSelect').selectOption('Alliance Hospital Limited (Shyamoli)');
  await page.locator('#appointmentDate').fill(nextOpenDate());
  await page.locator('#bookingForm button[type="submit"]').click();
  await expect(page.locator('#bookingStatus')).toContainText('Appointment Request Submitted');
}

test('with no number configured, the WhatsApp CTAs are hidden everywhere', async ({ page, site }) => {
  // The migration seeds admin_settings with an empty whatsapp -- the state a
  // fresh deployment is actually in, and the one that shipped the placeholder bug.
  const config = await site.harness.db
    .prepare('SELECT whatsapp FROM admin_settings WHERE id = 1')
    .first();
  expect(config.whatsapp || '').toBe('');

  await stubTurnstile(page);
  await page.goto(site.baseURL);

  await expect(page.locator('#fabWhatsapp')).toBeHidden();
  await expect(page.locator('#navTel')).toBeHidden();

  await book(page);
  await expect(
    page.locator('#bookingStatus a[href*="wa.me"]'),
    'the confirmation must not offer a WhatsApp forward that goes nowhere'
  ).toHaveCount(0);
});

test('with a number configured, both CTAs appear and link to wa.me/<digits>', async ({ page, site }) => {
  await site.harness.db
    .prepare('UPDATE admin_settings SET whatsapp = ? WHERE id = 1')
    .bind(NUMBER)
    .run();

  await stubTurnstile(page);
  await page.goto(site.baseURL);

  // Non-digits are stripped: the CMS field accepts human formatting, wa.me does not.
  await expect(page.locator('#fabWhatsapp')).toBeVisible();
  await expect(page.locator('#fabWhatsapp')).toHaveAttribute('href', `https://wa.me/${DIGITS}`);
  await expect(page.locator('#navTel')).toBeVisible();
  await expect(page.locator('#navTel')).toHaveText(`+${DIGITS}`);

  await book(page);

  const forward = page.locator('#bookingStatus a[href*="wa.me"]');
  await expect(forward).toHaveCount(1);
  const href = await forward.getAttribute('href');
  expect(href.startsWith(`https://wa.me/${DIGITS}?text=`)).toBe(true);
  // The prefilled message is the payload the doctor actually receives.
  expect(decodeURIComponent(href)).toContain('Gating Check');
  expect(decodeURIComponent(href)).toContain('Alliance Hospital Limited (Shyamoli)');
});
