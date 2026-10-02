// A1 regression — the hero must render before the API answers.
//
// main.js adds `html.reveal` to the document element, and style.css then applies
// `opacity: 0` to every [data-r] element. That covers the hero h1, its tagline
// and both CTA buttons -- nearly the entire above-the-fold page. The class is
// only cleared by the IntersectionObserver that adds `.in`.
//
// The observer used to be constructed AFTER three serial, D1-backed fetches
// (/api/gallery, /api/config/public, /api/content), so the hero was blank for as
// long as those took. That is the F-UX-7 blank page -- content invisible because
// the reveal never ran -- returning for the SLOW case rather than the dead case,
// and it delayed the LCP text element for exactly the patients on the worst
// connections. The dead case was already tested; nothing tested the slow one.
//
// Note for anyone maintaining this: toBeVisible() is NOT sufficient here.
// Playwright treats an opacity:0 element as visible (it has a box and is not
// display:none), which is precisely the failure state. Assert the `.in` class,
// which is the actual reveal mechanism.
import { test, expect, stubTurnstile } from './helpers/site.mjs';

test('the hero reveals and the page is interactive while the API is still hanging', async ({ page, site }) => {
  let release;
  const stalled = new Promise((resolve) => { release = resolve; });
  let apiCalls = 0;

  // Every API call hangs until this test says otherwise. No timeout, no error:
  // the slow path, not the failure path, which already has its own coverage.
  await page.route('**/api/**', async (route) => {
    apiCalls++;
    await stalled;
    await route.continue();
  });

  await stubTurnstile(page);
  await page.goto(site.baseURL, { waitUntil: 'domcontentloaded' });

  const headline = page.locator('.hero h1');
  const tagline = page.locator('.hero p').first();
  const heroCta = page.locator('.hero-cta');

  await expect(headline, 'the hero headline must not wait on the API').toHaveClass(/\bin\b/);
  await expect(tagline).toHaveClass(/\bin\b/);
  await expect(heroCta).toHaveClass(/\bin\b/);
  await expect(headline).toHaveCSS('opacity', '1');

  // The other half of the fix: listeners are attached before the awaits too, so
  // a patient can act on the page while it is still loading its content.
  await page.locator('.hero-cta .open-booking').click();
  await expect(page.locator('#bookingModal')).toHaveClass(/\bactive\b/);

  // Prove the stall was real -- otherwise this test passes for the wrong reason
  // the day someone removes the fetches.
  expect(apiCalls, 'the API should have been called and left hanging').toBeGreaterThan(0);

  release();
});
