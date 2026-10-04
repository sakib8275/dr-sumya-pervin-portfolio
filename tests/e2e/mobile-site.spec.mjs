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
//   6. the hero journey panel is compact, its dots are 44px, and both CTAs fit
//      the first screen — in the JS-enhanced panel, in the no-motion list at
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

  test('hero journey panel is compact and both CTAs fit the first screen', async ({ page, site }) => {
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    const strip = await page.evaluate(() => document.querySelector('.nameplate').getBoundingClientRect().height);
    expect(strip, 'the phone journey panel shows one step + credentials (~410px), not the 5-item list').toBeLessThan(430);
    await expect(page.locator('.h-ctas .btn-ink')).toBeInViewport();
    await expect(page.locator('.h-ctas .btn-ghost')).toBeInViewport();
  });

  test('journey step dots are 44px tap targets and the Play/Pause no-op is hidden on phones', async ({ page, site }) => {
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    const boxes = await page.$$eval('.jn-dot', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }));
    expect(boxes.length, 'one dot per consultation step').toBe(5);
    for (const [w, h] of boxes) { expect(w).toBeGreaterThanOrEqual(44); expect(h).toBeGreaterThanOrEqual(44); }
    await expect(page.locator('.jn-pause')).toBeHidden();
  });
});

// The no-motion fallback lists all five steps, so the panel is tall; it must
// sit BELOW the CTAs and never push them off the first screen or sideways.
test.describe('mobile 360×640, reduced motion', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('the plain five-step list keeps the primary CTA in view and does not overflow', async ({ page, site }) => {
    // emulateMedia, not a context option: it is applied before site.js runs.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    expect(await page.locator('.jn-live').count(), 'reduced motion leaves the static list').toBe(0);
    await expect(page.locator('.jn-step')).toHaveCount(5);
    await expect(page.locator('.h-ctas .btn-ink')).toBeInViewport();
    const { overflow, ctaBottom, panelTop } = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ctaBottom: document.querySelector('.h-ctas').getBoundingClientRect().bottom,
      panelTop: document.querySelector('.nameplate').getBoundingClientRect().top,
    }));
    expect(overflow).toBeLessThanOrEqual(0);
    expect(panelTop, 'the panel starts below the CTAs').toBeGreaterThanOrEqual(ctaBottom);
  });

  // site.js reads the preference once at init AND listens for the change, so a
  // visitor who turns reduced motion on mid-visit is not left in the slides.
  test('turning reduced motion on mid-visit falls back to the plain list', async ({ page, site }) => {
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    expect(await page.locator('.jn-live').count(), 'enhanced before the toggle').toBe(1);
    expect(await page.locator('.jn-dot').count()).toBe(5);
    expect(await page.locator('.jn-steps').getAttribute('aria-live'), 'phones rest on polite, not the silent auto-pass').toBe('polite');

    await page.emulateMedia({ reducedMotion: 'reduce' });

    // The change event is async, so every assertion here must retry: a bare
    // count() reads the panel before site.js has reacted.
    await expect(page.locator('.jn-live'), 'the slide layout is dropped').toHaveCount(0);
    await expect(page.locator('.jn-nav'), 'the dots and Play/Pause go with it').toHaveCount(0);
    await expect(page.locator('.jn-step')).toHaveCount(5);
    await expect.poll(() => page.locator('.jn-steps').getAttribute('aria-live'),
      { message: 'no live region: all five steps appear at once, and the unenhanced markup has none' })
      .toBeNull();
  });
});

// A visitor whose browser runs no scripts gets the same five-item list, and the
// panel is taller than the 430px bound that pins the JS-enhanced phone layout.
// site.js is the page's only script; blocking it is the honest no-JS state.
// (javaScriptEnabled: false instead would leave the panel in the same shape but
// also disables the measurement this test needs.)
test.describe('mobile 375×667, no JavaScript', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('all five steps render as a plain list and both CTAs stay in view', async ({ page, site }) => {
    await page.route('**/js/site.js', (route) => route.abort());
    await page.goto(site.baseURL + '/', { waitUntil: 'domcontentloaded' });

    expect(await page.locator('.jn-live').count(), 'no enhancement without JS').toBe(0);
    expect(await page.locator('.jn-nav').count(), 'no dots or Play/Pause without JS').toBe(0);
    await expect(page.locator('.jn-step')).toHaveCount(5);
    for (let n = 1; n <= 5; n += 1) {
      await expect(page.locator(`.jn-step:nth-child(${n}) b`), `step ${n} is visible`).toBeVisible();
    }

    await expect(page.locator('.h-ctas .btn-ink')).toBeInViewport();
    await expect(page.locator('.h-ctas .btn-ghost')).toBeInViewport();
    const { overflow, panelRight } = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      panelRight: document.querySelector('.nameplate').getBoundingClientRect().right,
    }));
    expect(overflow).toBeLessThanOrEqual(0);
    expect(panelRight, 'the tall list stays inside the 375px viewport').toBeLessThanOrEqual(375);
  });
});
