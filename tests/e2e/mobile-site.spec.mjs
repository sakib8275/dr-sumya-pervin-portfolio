// M1 mobile pass — docx §7.3 compliance and the phone-layout regressions that
// shipped with Phase 1, all measured at 375×667 (the iPhone SE class the docx
// calls "most Dhaka health searches"):
//
//   1. no horizontal overflow on the two real pages,
//   2. the drawer (the only nav ≤820px) carries Prices + About, its rows meet
//      the 44px tap-target minimum, the scrim shows, and Esc both closes it and
//      returns focus to the burger (the markup claims aria-modal),
//   3. the Prices section tabs stay pinned BELOW the sticky header — the Phase 1
//      CSS pinned them at top:0 where they slid underneath it and vanished,
//   4. the recommended tier card renders first (§7.3 "recommended card first"),
//   5. price tables collapse to stacked cards driven by the builder's data-th,
//   6. the hero credential plate is a compact strip and both CTAs fit the
//      first screen.
import { test, expect } from './helpers/site.mjs';

test.describe('mobile 375×667', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('home and prices render without horizontal overflow', async ({ page, site }) => {
    for (const path of ['/', '/prices/']) {
      await page.goto(site.baseURL + path, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `${path} must not scroll sideways`).toBeLessThanOrEqual(0);
    }
  });

  test('drawer: Prices + About present, 44px rows, scrim, Esc returns focus', async ({ page, site }) => {
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    await page.locator('#burger').click();
    await expect(page.locator('#drawer')).toHaveClass(/\bactive\b/);
    await expect(page.locator('#scrim')).toHaveClass(/\bactive\b/);

    // The Phase 1 drawer had neither of the pathway map's two main destinations.
    await expect(page.locator('#drawer a', { hasText: 'Prices' }).first()).toBeVisible();
    await expect(page.locator('#drawer a', { hasText: 'About Dr. Sumya' })).toBeVisible();

    const minRow = await page.evaluate(() =>
      Math.min(...[...document.querySelectorAll('.drawer-links a')].map((a) => a.getBoundingClientRect().height))
    );
    expect(minRow, 'every drawer row must be a ≥44px tap target (§7.3)').toBeGreaterThanOrEqual(44);

    await page.keyboard.press('Escape');
    await expect(page.locator('#drawer')).not.toHaveClass(/\bactive\b/);
    expect(await page.evaluate(() => document.activeElement.id), 'focus must return to the burger').toBe('burger');
  });

  test('price tabs stay pinned below the sticky header, not under it', async ({ page, site }) => {
    await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 1500));
    const gap = await page.evaluate(() => {
      const header = document.querySelector('.s-nav').getBoundingClientRect();
      const tabs = document.querySelector('.pr-tabs').getBoundingClientRect();
      return { headerBottom: header.bottom, tabsTop: tabs.top };
    });
    expect(gap.tabsTop, 'tabs must sit at the header bottom (78px), not slide under it').toBeGreaterThanOrEqual(77);
    expect(gap.tabsTop).toBeLessThanOrEqual(79);
  });

  test('recommended tier card renders first on phones (§7.3)', async ({ page, site }) => {
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    const ys = await page.evaluate(() => ({
      rec: document.querySelector('.h-tier.rec').getBoundingClientRect().top,
      others: [...document.querySelectorAll('.h-tier:not(.rec)')].map((t) => t.getBoundingClientRect().top),
    }));
    for (const y of ys.others) expect(ys.rec, 'the recommended card comes first').toBeLessThan(y);
  });

  test('price tables become stacked cards with data-th labels (§7.3)', async ({ page, site }) => {
    await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });
    const table = page.locator('.pr-table').first();
    await expect(table).toBeVisible();
    expect(await table.evaluate((el) => getComputedStyle(el).display), 'rows must collapse to cards ≤820px').toBe('block');
    const labelled = await page.evaluate(() => document.querySelectorAll('.pr-table td[data-th]').length);
    expect(labelled, 'every cell carries its column label for the card layout').toBeGreaterThan(20);
  });

  test('hero plate is a compact strip and both CTAs fit the first screen', async ({ page, site }) => {
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    const strip = await page.evaluate(() => document.querySelector('.nameplate').getBoundingClientRect().height);
    expect(strip, 'the phone hero collapses the credential plate (~100px, not ~400px)').toBeLessThan(180);
    await expect(page.locator('.h-ctas .btn-ink')).toBeInViewport();
    await expect(page.locator('.h-ctas .btn-ghost')).toBeInViewport();
  });
});
