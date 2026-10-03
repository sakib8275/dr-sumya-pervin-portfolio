// Dialog accessibility, at the layer where it was actually broken.
//
// The one-pager kept its modal behaviour (focus trap, Escape, focus-in/restore,
// scroll lock) in main.js. The multi-page site does not ship main.js, so the
// /admin/ console reproduces it in admin.js; these specs pin that it is present
// and that closed dialogs are genuinely out of the tab order.
//
// A8 · the forgot/reset dialogs carried an inline display:none that .active never
//      cleared, so the self-service PIN-recovery path shipped unreachable.
// A9 · with every modal closed, controls inside them were still reachable by Tab.
import { test, expect, stubTurnstile } from './helpers/site.mjs';

const CLOSED_DIALOG_IDS = ['forgotModal', 'resetModal'];

test('no control inside a closed dialog is reachable by Tab', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });

  // Ask the browser, rather than reasoning about CSS. checkVisibility with
  // visibilityProperty is the only predicate that gets this right.
  const reachable = await page.evaluate((ids) => {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const out = [];
    for (const id of ids) {
      const dialog = document.getElementById(id);
      if (!dialog) { out.push(id + ': MISSING'); continue; }
      if (dialog.classList.contains('active')) { out.push(id + ': open at load'); continue; }
      for (const el of dialog.querySelectorAll(sel)) {
        if (el.checkVisibility({ visibilityProperty: true })) {
          out.push(id + ' > ' + (el.id || el.className || el.tagName));
        }
      }
    }
    return out;
  }, CLOSED_DIALOG_IDS);

  expect(reachable, 'controls inside closed dialogs are still in the tab order').toEqual([]);
});

test('the forgot-PIN and reset dialogs actually become visible', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });

  await expect(page.locator('#cmsModal')).toHaveClass(/\bactive\b/);
  await page.locator('#openForgotBtn').click();
  // toBeVisible() is the whole point: the failure mode was a box with .active
  // and opacity:1 but display:none, which class assertions call a pass.
  await expect(page.locator('#forgotModal')).toBeVisible();
  await expect(page.locator('#forgotEmailInput')).toBeVisible();

  await page.locator('#closeForgot').click();
  await expect(page.locator('#forgotModal')).toBeHidden();

  // The reset dialog is opened by the token deep link mailed to the doctor.
  await page.goto(site.baseURL + '/admin/#reset?token=deadbeef', { waitUntil: 'networkidle' });
  await expect(page.locator('#resetModal')).toBeVisible();
  await expect(page.locator('#resetNewPin')).toBeVisible();
});

test('opening a dialog moves focus into it', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });

  // The console opens the CMS dialog on load; focus must land on the first real
  // control, not the close button sitting behind the overlay.
  await expect(page.locator('#cmsPinInput')).toBeFocused();

  await page.locator('#openForgotBtn').click();
  await expect(page.locator('#forgotEmailInput')).toBeFocused();
});

test('body scroll is locked while a dialog is open and released after', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });

  const overflow = () => page.evaluate(() => getComputedStyle(document.body).overflow);
  expect(await overflow(), 'the page scrolls behind the open CMS dialog').toBe('hidden');

  await page.keyboard.press('Escape');
  await expect(page.locator('#cmsModal')).toBeHidden();
  expect(await overflow()).not.toBe('hidden');
});

test('Tab is trapped inside the open dialog', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/admin/', { waitUntil: 'networkidle' });

  // Well past the number of controls, so a leak out of the modal shows up
  // regardless of where the trap gives way.
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() =>
      document.getElementById('cmsModal').contains(document.activeElement)
    );
    expect(inside, `focus escaped the CMS modal after ${i + 1} Tab presses`).toBe(true);
  }
});

test('the skip link is the first tab stop and jumps to main', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });

  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await skip.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
