// The standalone /admin/ console (ported off the one-pager). Boots cms.js through
// the new admin.js bridge, logs in with the seeded PIN, and exercises the tabs
// that read the same APIs the one-pager CMS used.
import { test, expect, stubTurnstile } from './helpers/site.mjs';

test('the admin console logs in and shows the panel', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });

  await expect(page.locator('#cmsModal')).toHaveClass(/\bactive\b/);
  await page.fill('#cmsPinInput', site.pin);
  await page.click('#submitPin');

  await expect(page.locator('#cmsMainSection')).toBeVisible();
  await expect(page.locator('#cmsAppointmentsList')).toBeVisible();
});

test('a wrong PIN is refused and the panel stays closed', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });
  await page.fill('#cmsPinInput', 'not-the-pin');
  await page.click('#submitPin');

  await expect(page.locator('#pinError')).toBeVisible();
  await expect(page.locator('#cmsMainSection')).toBeHidden();
});
