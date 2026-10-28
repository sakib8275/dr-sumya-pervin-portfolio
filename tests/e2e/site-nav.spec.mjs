// The desktop nav dropdowns, by keyboard (A11Y-AUDIT-2026-10-28 #1).
//
// The menus opened on :focus-within as well as on the button. A menu could
// therefore be on screen while its button said aria-expanded="false". Escape
// handed focus back to the button, which kept the menu open, so it could not
// be dismissed. Keyboard users also tabbed through every submenu link on every
// page to get past the header. Once site.js runs, the button alone opens a
// menu. Without site.js the button does nothing, so focus still opens it.
import { test, expect } from './helpers/site.mjs';

test.use({ viewport: { width: 1440, height: 900 } });

const drop = (page) => page.locator('.nav-drop').first();

test('focusing a dropdown button leaves its menu closed', async ({ page, site }) => {
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  const btn = drop(page).locator('.nav-drop-btn');
  await btn.focus();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(drop(page).locator('.mega')).toBeHidden();
});

test('Tab past a closed menu skips its links', async ({ page, site }) => {
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  await drop(page).locator('.nav-drop-btn').focus();
  await page.keyboard.press('Tab');
  const inMenu = await page.evaluate(() => Boolean(document.activeElement.closest('.mega')));
  expect(inMenu, 'Tab from a closed dropdown landed inside its menu').toBe(false);
});

test('Enter opens a menu and Escape closes it, returning focus to the button', async ({ page, site }) => {
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  const btn = drop(page).locator('.nav-drop-btn');
  const mega = drop(page).locator('.mega');
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(mega).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(mega.locator('a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(btn).toBeFocused();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(mega).toBeHidden();
});

test('tabbing out of an open menu closes it', async ({ page, site }) => {
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  const btn = drop(page).locator('.nav-drop-btn');
  const mega = drop(page).locator('.mega');
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(mega).toBeVisible();

  const links = await mega.locator('a').count();
  for (let i = 0; i <= links; i++) await page.keyboard.press('Tab');
  // The next stop is the next dropdown's button, so test this dropdown only.
  const inDrop = await drop(page).evaluate((el) => el.contains(document.activeElement));
  expect(inDrop, 'focus should have left the first dropdown').toBe(false);
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(mega).toBeHidden();
});

test('a click inside an open menu does not close it; a click outside does', async ({ page, site }) => {
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  const btn = drop(page).locator('.nav-drop-btn');
  const mega = drop(page).locator('.mega');
  await btn.click();
  await expect(mega).toBeVisible();
  // A column heading is not focusable: focus leaves the button for nothing.
  await mega.locator('.mega-head').first().click();
  await expect(mega).toBeVisible();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await page.locator('main').click({ position: { x: 5, y: 400 } });
  await expect(mega).toBeHidden();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
});

test('without site.js, focus still opens a menu so its links stay reachable', async ({ page, site }) => {
  await page.route('**/js/site.js', (route) => route.abort());
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  await drop(page).locator('.nav-drop-btn').focus();
  await expect(drop(page).locator('.mega')).toBeVisible();
});
