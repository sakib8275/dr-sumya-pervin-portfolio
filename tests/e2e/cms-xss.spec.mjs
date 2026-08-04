// F10 spec 2 — patient-supplied text renders INERT in the CMS.
//
// Every field on this page is attacker-controlled: the booking form is public
// and unauthenticated, and the doctor reads what it produces inside an
// authenticated admin panel. The CMS builds its rows as HTML strings
// (main.js:renderCMSAppointmentsList), so escapeHTML() is the only thing between
// a patient's name and script execution in a session holding an admin JWT.
//
// The API suite proves what the server stores. This proves what the browser DOES
// with it, which is the half that actually matters for XSS: a payload can be
// stored verbatim and still be perfectly safe, or be partially escaped and still
// execute.
//
// Logging in here is fine and is not the "never log into the production CMS"
// rule: this is a throwaway Miniflare database whose PIN the harness seeded.
import { test, expect, stubTurnstile, openBookingModal } from './helpers/site.mjs';

function nextOpenDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 3);
  while (d.getUTCDay() === 5) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const PAYLOAD_NAME = `<img src=x onerror="window.__xss=1">`;
const PAYLOAD_NOTES = `</em><script>window.__xss2=1<\/script><b onclick="window.__xss3=1">click`;

test('a stored XSS payload renders as text, not as live nodes', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  // 1. A patient books, using the public form, with a payload for a name.
  await openBookingModal(page);
  await page.locator('#patientName').fill(PAYLOAD_NAME);
  await page.locator('#patientPhone').fill('01711000000');
  await page.locator('#chamberSelect').selectOption('Alliance Hospital Limited (Shyamoli)');
  await page.locator('#appointmentDate').fill(nextOpenDate());
  await page.locator('#patientMessage').fill(PAYLOAD_NOTES);
  await page.locator('#bookingForm button[type="submit"]').click();
  await expect(page.locator('#bookingStatus')).toContainText('Appointment Request Submitted');

  // Stored verbatim -- escaping is a rendering concern, not a storage one, and a
  // server that mangled the input would make this test pass for the wrong reason.
  const stored = await site.harness.db
    .prepare('SELECT patient_name, notes FROM appointments ORDER BY rowid DESC LIMIT 1')
    .first();
  expect(stored.patient_name).toBe(PAYLOAD_NAME);

  // 2. The doctor opens the CMS and looks at it.
  await page.locator('#bookingModal .modal-close').click();
  await page.locator('.open-cms:visible').first().click();
  await page.locator('#cmsPinInput').fill(site.pin);
  await page.locator('#submitPin').click();
  await page.locator('#cmsMainSection').waitFor({ state: 'visible' });

  const list = page.locator('#cmsAppointmentsList');
  await expect(list).toContainText(PAYLOAD_NAME);

  // 3. The payload is inert: it produced no elements and ran no code.
  const result = await page.evaluate(() => {
    const container = document.getElementById('cmsAppointmentsList');
    return {
      injectedImg: container.querySelectorAll('img[src="x"]').length,
      injectedScript: container.querySelectorAll('script').length,
      onerrorAttrs: container.querySelectorAll('[onerror]').length,
      onclickAttrs: container.querySelectorAll('[onclick]').length,
      fired: [window.__xss, window.__xss2, window.__xss3]
    };
  });

  expect(result.injectedImg, 'the <img> payload must not become an element').toBe(0);
  expect(result.injectedScript, 'no <script> may be injected into the CMS').toBe(0);
  expect(result.onerrorAttrs, 'no onerror attribute may survive escaping').toBe(0);
  expect(result.onclickAttrs, 'no onclick attribute may survive escaping').toBe(0);
  expect(result.fired, 'no payload may execute').toEqual([undefined, undefined, undefined]);
});
