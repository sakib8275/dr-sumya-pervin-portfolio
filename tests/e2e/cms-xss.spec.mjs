// F10 spec 2 — patient-supplied text renders INERT in the CMS.
//
// Every field here is attacker-controlled: the /book/ form is public and
// unauthenticated, and the doctor reads what it produces inside the
// authenticated /admin/ panel. cms.js builds its rows as HTML strings, so
// escapeHTML() is the only thing between a patient's name and script execution
// in a session holding an admin JWT.
//
// The API suite proves what the server stores. This proves what the browser DOES
// with it, which is the half that actually matters for XSS: a payload can be
// stored verbatim and still be perfectly safe, or be partially escaped and still
// execute.
//
// Logging in here is fine and is not the "never log into the production CMS"
// rule: this is a throwaway Miniflare database whose PIN the harness seeded.
import { test, expect, stubTurnstile } from './helpers/site.mjs';
import { nextOpenDate, addDays, dhakaParts } from '../../functions/lib/schedule.js';

const CHAMBER = 'Alliance Hospital Limited (Shyamoli)';
const OPEN_DATE = nextOpenDate(CHAMBER, addDays(dhakaParts().dateStr, 1));

const PAYLOAD_NAME = `<img src=x onerror="window.__xss=1">`;
const PAYLOAD_NOTES = `</em><script>window.__xss2=1<\/script><b onclick="window.__xss3=1">click`;

test('a stored XSS payload renders as text, not as live nodes', async ({ page, site }) => {
  await stubTurnstile(page);

  // 1. A patient books, using the public /book/ form, with a payload for a name.
  await page.goto(site.baseURL + '/book/', { waitUntil: 'networkidle' });
  await page.fill('#sbName', PAYLOAD_NAME);
  await page.fill('#sbPhone', '01711000000');
  await page.selectOption('#sbTier', 'Specialist Consultation');
  await page.selectOption('#sbChamber', CHAMBER);
  await page.fill('#sbDate', OPEN_DATE);
  await page.fill('#sbNotes', PAYLOAD_NOTES);
  await page.click('#sbSubmit');
  await expect(page.locator('#sbConfirm')).toContainText('Request received');

  // Stored verbatim -- escaping is a rendering concern, not a storage one, and a
  // server that mangled the input would make this test pass for the wrong reason.
  const stored = await site.harness.db
    .prepare('SELECT patient_name, notes FROM appointments ORDER BY rowid DESC LIMIT 1')
    .first();
  expect(stored.patient_name).toBe(PAYLOAD_NAME);

  // 2. The doctor opens the admin console and looks at it.
  await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });
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
