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

// A11Y-AUDIT-2026-10-28 #3 (WCAG 2.1.1). Both file pickers were display:none
// inputs, one behind a click-only div and one inside a <label>, so neither
// could be reached or opened without a mouse. Each must be a Tab stop that
// opens the chooser on Space, with the focus ring drawn on the visible box.
for (const [tab, id, box] of [
  ['tabUpload', 'photoFileInput', '#uploadZone'],
  ['tabSettings', 'importCMSFileInput', 'label:has(> #importCMSFileInput)'],
]) {
  test(`#${id} is reachable by Tab and opens its file chooser from the keyboard`, async ({ page, site }) => {
    await stubTurnstile(page);
    await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });
    await page.fill('#cmsPinInput', site.pin);
    await page.click('#submitPin');
    await page.click(`[data-tab="${tab}"]`);

    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate((id) => document.activeElement && document.activeElement.id === id, id);
    }
    expect(reached, `#${id} is not in the tab order`).toBe(true);

    const outline = await page.locator(box).evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline, `${box} shows no focus ring while #${id} has focus`).not.toBe('none');

    const chooser = page.waitForEvent('filechooser', { timeout: 5000 });
    await page.keyboard.press('Space');
    await chooser;
  });
}
