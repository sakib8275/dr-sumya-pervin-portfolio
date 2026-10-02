// P2 regression — the nav highlight after the scrollspy rewrite.
//
// The old implementation ran on every scroll event and read offsetTop and
// offsetHeight for all fourteen sections, forcing a synchronous layout per
// section per event. It was replaced by an IntersectionObserver whose rootMargin
// defines the "current" band as the strip just below the sticky nav. That is a
// different mechanism producing behaviour that has to stay identical, and the
// rootMargin is a magic number that nothing else would catch if it drifted.
import { test, expect, stubTurnstile } from './helpers/site.mjs';

test('the nav highlight follows the scroll position', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(site.baseURL);

  const hrefs = await page.locator('.nav-links a').evaluateAll((links) =>
    links.map((a) => a.getAttribute('href'))
  );
  expect(hrefs.length).toBeGreaterThanOrEqual(5);

  for (const href of hrefs) {
    await page.evaluate((h) => {
      const el = document.querySelector(h);
      // -60 lands inside the band the rootMargin carves out, which is what a
      // real anchor click does after the sticky nav offset.
      if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: 'instant' });
    }, href);

    await expect(page.locator(`.nav-links a.on[href="${href}"]`)).toHaveCount(1);
    // Exactly one, or the highlight is ambiguous rather than wrong.
    await expect(page.locator('.nav-links a.on')).toHaveCount(1);
  }
});

test('the sticky nav and scroll-to-top toggles still fire under rAF coalescing', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  const nav = page.locator('.nav-sticky-wrapper');
  const fab = page.locator('#fabTop');
  await expect(nav).not.toHaveClass(/\bscrolled\b/);
  await expect(fab).not.toHaveClass(/\bvisible\b/);

  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await expect(nav).toHaveClass(/\bscrolled\b/);
  await expect(fab).toHaveClass(/\bvisible\b/);

  // Back to the top: the coalesced handler has to run on the trailing edge too,
  // or the nav stays dark over the hero.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(nav).not.toHaveClass(/\bscrolled\b/);
  await expect(fab).not.toHaveClass(/\bvisible\b/);
});
