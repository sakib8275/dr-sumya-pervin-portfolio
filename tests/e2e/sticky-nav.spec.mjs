// A11 regression — the stuck nav was pinned to the first screen.
//
// .nav-sticky-wrapper lived inside <header class="hero">, and position:sticky
// only works within the parent's box. The hero is exactly one viewport tall, so
// past roughly 628px the "stuck" bar scrolled off with it and never came back:
// every anchor deeper than the hero (About, Chambers, Services, Results, FAQ)
// landed with no navigation at all. scrollspy.spec stayed green throughout,
// because the scrolled class was always applied correctly — only the geometry
// was wrong. These tests pin the geometry.
import { test, expect, stubTurnstile } from './helpers/site.mjs';

const navRect = (page) =>
  page.locator('.nav-sticky-wrapper').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { y: Math.round(r.y), height: Math.round(r.height) };
  });

test('the nav is still stuck to the viewport top after a deep anchor jump', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(site.baseURL);

  // Scoped to .nav-links (the header nav), never to an ancestor of the wrapper:
  // the whole point of A11 is that the wrapper's containment changes.
  await page.locator('.nav-links a[href="#faq"]').click();

  // The jump is smooth-scrolled. Wait for the target offset, then for the
  // scroll position to stop changing between frames (bounded, so a broken
  // smooth scroll cannot hang the test — the geometry read below still fails).
  await page.waitForFunction(() => window.scrollY > 6000, null, { timeout: 10000 });
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let last = -1;
        const bail = setTimeout(resolve, 3000);
        const tick = () => {
          if (window.scrollY === last) {
            clearTimeout(bail);
            resolve();
            return;
          }
          last = window.scrollY;
          requestAnimationFrame(tick);
        };
        tick();
      })
  );

  await expect(page.locator('.nav-sticky-wrapper')).toHaveClass(/\bscrolled\b/);
  const stuck = await navRect(page);
  expect(stuck.y).toBe(0);
  expect(stuck.height).toBeGreaterThan(0);
});

test('the nav stays stuck at arbitrary deep scroll offsets', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  // Instant scrolls bypass the anchor path entirely: any position below the
  // hero must keep the bar at the viewport top, not only after a nav click.
  for (const top of [700, 2500, 7000]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);

    // The class toggle is rAF-coalesced; wait for it before reading geometry,
    // because the sticky positioning itself is applied by the class.
    await expect(page.locator('.nav-sticky-wrapper')).toHaveClass(/\bscrolled\b/);
    const stuck = await navRect(page);
    expect(stuck.y).toBe(0);
  }
});
