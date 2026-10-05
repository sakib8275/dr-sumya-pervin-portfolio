// M1 mobile pass — docx §7.3 compliance and the phone-layout regressions that
// shipped with Phase 1, all measured at 375×667 (the iPhone SE class the docx
// calls "most Dhaka health searches"):
//
//   1. no horizontal overflow on the two real pages,
//   2. the drawer (the only nav ≤820px) carries Prices + About, its rows meet
//      the 44px tap-target minimum, the scrim shows, and Esc both closes it and
//      returns focus to the burger (the markup claims aria-modal),
//   3. the Prices section tabs stay pinned BELOW the sticky header (64px on
//      phones since the critique round slimmed it) — the Phase 1
//      CSS pinned them at top:0 where they slid underneath it and vanished,
//   4. the recommended tier card renders first (§7.3 "recommended card first"),
//   5. price tables collapse to stacked cards driven by the builder's data-th,
//   6. the hero reel sits below the CTAs (both on the first screen), never
//      auto-advances on a phone, swipes as a scroll-snap row and keeps its bars
//      in step, has 44px bars — in the JS-enhanced reel, under reduced motion at
//      360×640, and with site.js never loaded at all.
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

    // Rows inside a collapsed group have no box until it opens; measure every
    // visible row, then open a group and measure its rows too.
    const rowHeights = () => page.evaluate(() =>
      [...document.querySelectorAll('.drawer-links a, .drawer-grp summary')]
        .map((a) => a.getBoundingClientRect().height).filter((h) => h > 0)
    );
    await page.locator('.drawer-grp summary').first().click();
    const minRow = Math.min(...(await rowHeights()));
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
    expect(gap.tabsTop, 'tabs must sit at the header bottom, not slide under it').toBeGreaterThanOrEqual(gap.headerBottom - 1);
    expect(gap.tabsTop).toBeLessThanOrEqual(gap.headerBottom + 1);
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

  test('hero reel is compact, below both CTAs, and its bars are 44px tap targets', async ({ page, site }) => {
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    await expect(page.locator('.h-ctas .btn-ink')).toBeInViewport();
    await expect(page.locator('.h-ctas .btn-ghost')).toBeInViewport();
    const { h, top, ctaBottom } = await page.evaluate(() => ({
      h: document.querySelector('.reel').getBoundingClientRect().height,
      top: document.querySelector('.reel').getBoundingClientRect().top,
      ctaBottom: document.querySelector('.h-ctas').getBoundingClientRect().bottom,
    }));
    expect(h, 'one slide + bars + credentials (~390px)').toBeLessThan(430);
    expect(top, 'the reel starts below the CTAs').toBeGreaterThanOrEqual(ctaBottom);
    expect(await page.locator('.reel').getAttribute('aria-roledescription'), 'the enhanced reel announces as a carousel').toBe('carousel');
    const boxes = await page.$$eval('.reel-name', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }));
    expect(boxes.length, 'one bar per condition').toBe(6);
    for (const [w, hh] of boxes) { expect(w).toBeGreaterThanOrEqual(44); expect(hh).toBeGreaterThanOrEqual(44); }
    const links = await page.$$eval('.reel-link', (els) => els.map((e) => e.getBoundingClientRect().height));
    for (const lh of links) expect(lh, '"Read about …" is a 44px target').toBeGreaterThanOrEqual(44);
    await expect(page.locator('.reel-pause'), 'nothing auto-advances, so no Pause').toBeHidden();
    await expect(page.locator('.reel-arrow').first(), 'the row swipes; the arrows go').toBeHidden();
  });

  test('hero reel never auto-advances on a phone; a swipe and a bar tap both move it', async ({ page, site }) => {
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    // A 150ms dwell: if anything autoplayed, the whole pass would run inside the wait.
    await page.addStyleTag({ content: '.reel { --reel-dwell: 150ms !important; }' });
    await page.locator('.reel').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await expect(page.locator('.reel-cur')).toHaveText('01');
    // Swipe: the row is native scroll-snap; scrolling it syncs the counter and bars.
    await page.locator('.reel-slides').evaluate((el) => el.scrollTo({ left: el.clientWidth * 2 + 40 }));
    await expect(page.locator('.reel-cur')).toHaveText('03');
    await expect(page.locator('.reel-name').nth(2)).toHaveAttribute('aria-current', 'true');
    // A bar tap scrolls the row to its slide.
    await page.locator('.reel-name').nth(4).click();
    await expect(page.locator('.reel-cur')).toHaveText('05');
    await expect.poll(() => page.locator('.reel-slides').evaluate((el) => Math.round(el.scrollLeft / el.clientWidth))).toBe(4);
    await expect(page.locator('.reel-live')).toContainText('5 of 6: vitiligo');
  });
});

// Reduced motion on the smallest common phone: the reel keeps its phone shape
// (a swipe row is not motion), never autoplays, and never pushes the CTA away.
test.describe('mobile 360×640, reduced motion', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('the reel keeps the primary CTA in view, does not overflow, and does not autoplay', async ({ page, site }) => {
    // emulateMedia, not a context option: it is applied before site.js runs.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    await expect(page.locator('.h-ctas .btn-ink')).toBeInViewport();
    const { overflow, ctaBottom, panelTop } = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ctaBottom: document.querySelector('.h-ctas').getBoundingClientRect().bottom,
      panelTop: document.querySelector('.reel').getBoundingClientRect().top,
    }));
    expect(overflow, 'the six-slide row must not widen the page').toBeLessThanOrEqual(0);
    expect(panelTop, 'the reel starts below the CTAs').toBeGreaterThanOrEqual(ctaBottom);
    await expect(page.locator('.reel')).not.toHaveClass(/is-auto/);
  });
});

// A visitor whose browser runs no scripts gets the six slides as a swipeable
// row (scroll-snap is CSS), every word and link present, and no dead controls.
// site.js is the page's only script; blocking it is the honest no-JS state.
test.describe('mobile 375×667, no JavaScript', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('all six slides are a swipeable row and both CTAs stay in view', async ({ page, site }) => {
    await page.route('**/js/site.js', (route) => route.abort());
    await page.goto(site.baseURL + '/', { waitUntil: 'domcontentloaded' });

    expect(await page.locator('.reel.is-live').count(), 'no enhancement without JS').toBe(0);
    expect(await page.locator('.reel').getAttribute('aria-roledescription'), 'without JS the index is not announced as a carousel').toBeNull();
    await expect(page.locator('.reel-nav'), 'no bars without JS').toBeHidden();
    await expect(page.locator('.reel-pause')).toBeHidden();
    await expect(page.locator('.reel-slide')).toHaveCount(6);
    await expect(page.locator('.reel-link')).toHaveCount(6);
    await expect(page.locator('.h-ctas .btn-ink')).toBeInViewport();
    await expect(page.locator('.h-ctas .btn-ghost')).toBeInViewport();
    const { overflow, rowScrolls, panelRight } = await page.evaluate(() => {
      const row = document.querySelector('.reel-slides');
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        rowScrolls: row.scrollWidth > row.clientWidth * 5,
        panelRight: document.querySelector('.reel').getBoundingClientRect().right,
      };
    });
    expect(overflow).toBeLessThanOrEqual(0);
    expect(rowScrolls, 'the six slides sit in a horizontal row the visitor can swipe').toBe(true);
    expect(panelRight).toBeLessThanOrEqual(375);
  });
});
