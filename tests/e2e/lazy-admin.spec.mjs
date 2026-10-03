// The admin code stays off the patient's pages.
//
// cms.js (~34 KB) and qrcode.min.js (24 KB) exist for one person: the doctor.
// They used to be part of every patient's page load. After the cutover the admin
// panel lives on its own /admin/ page, loaded only there; nothing may quietly
// re-add it to a patient page, and a stray <script> tag would be invisible to
// every other test in this suite.
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

  // A full patient journey across the multi-page site: home, book, a tool.
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  await page.goto(site.baseURL + '/book/', { waitUntil: 'networkidle' });
  await page.goto(site.baseURL + '/tools/mole-check/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  expect(requested, 'cms.js was shipped to a patient').not.toContain('/js/cms.js');
  expect(requested, 'admin.js was shipped to a patient').not.toContain('/js/admin.js');
  expect(requested, 'qrcode.min.js was shipped to a patient').not.toContain('/js/vendor/qrcode.min.js');
});

test('opening the admin console fetches the panel and it works', async ({ page, site }) => {
  const requested = trackScripts(page);
  await stubTurnstile(page);

  // Armed before the navigation, not after: cms.js is served from memory here
  // and frequently lands before a waiter registered afterwards can see it.
  const cmsScript = page.waitForResponse((r) => r.url().endsWith('/js/cms.js') && r.status() === 200);
  await page.goto(site.baseURL + '/admin/');

  await cmsScript;
  expect(requested).toContain('/js/cms.js');

  // And the panel it brought is wired to the bridge, not merely present: log in
  // and confirm the bridge's api()/setToken() are reachable from cms.js.
  await page.locator('#cmsPinInput').fill(site.pin);
  await page.locator('#submitPin').click();
  await expect(page.locator('#cmsMainSection')).toBeVisible();
});
