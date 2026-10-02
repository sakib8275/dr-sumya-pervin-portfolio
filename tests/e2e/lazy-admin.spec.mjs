// The admin code stays off the patient's page.
//
// cms.js (~34 KB) and qrcode.min.js (24 KB) exist for one person: the doctor.
// Until 2026-08-27 both were part of every patient's page load -- qrcode.min.js
// as a <script defer> in <head>, and the admin panel as ~840 lines inside
// main.js. The split only holds if nothing quietly re-adds them, and a stray
// <script> tag would be invisible to every other test in this suite.
import { test, expect, stubTurnstile } from './helpers/site.mjs';

function trackScripts(page) {
  const requested = [];
  page.on('request', (req) => {
    if (req.resourceType() === 'script') requested.push(new URL(req.url()).pathname);
  });
  return requested;
}

test('a patient never downloads the admin panel', async ({ page, site }) => {
  const requested = trackScripts(page);
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  // A full patient journey: read, take the quiz, open a service, book.
  await page.locator('#svcToggle').click();
  await page.locator('#svcGrid .svc').first().click();
  await expect(page.locator('#serviceModal')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.open-booking:visible').first().click();
  await expect(page.locator('#bookingModal')).toBeVisible();
  await page.waitForTimeout(300);

  expect(requested, 'cms.js was shipped to a patient').not.toContain('/js/cms.js');
  expect(requested, 'qrcode.min.js was shipped to a patient').not.toContain('/js/vendor/qrcode.min.js');
});

test('opening the CMS fetches the admin panel and the panel works', async ({ page, site }) => {
  const requested = trackScripts(page);
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  // Armed before the click, not after: cms.js is served from memory here and
  // frequently lands before a waiter registered afterwards can see it.
  const cmsScript = page.waitForResponse((r) => r.url().endsWith('/js/cms.js') && r.status() === 200);
  await page.locator('.open-cms:visible').first().click();

  // The modal must be up before the fetch resolves -- the click is acknowledged
  // by main.js, not by cms.js, so a slow connection cannot make it feel dead.
  await expect(page.locator('#cmsModal')).toBeVisible();

  await cmsScript;
  expect(requested).toContain('/js/cms.js');

  // And the panel it brought is wired to the bridge, not merely present: log in
  // and confirm main.js's api()/setToken() are reachable from cms.js.
  await page.locator('#cmsPinInput').fill(site.pin);
  await page.locator('#submitPin').click();
  await expect(page.locator('#cmsMainSection')).toBeVisible();
});
