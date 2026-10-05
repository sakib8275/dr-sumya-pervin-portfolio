// The hero reel on desktop (1440×900): the one authored motion sequence.
// The phone, reduced-motion-at-360 and no-JS phone states are pinned in
// mobile-site.spec.mjs; this file pins what only desktop does:
//
//   1. one autoplay pass, 01 → 06, then it wipes back to 01 and rests,
//      with the button saying "Play again" (not "Pause" while nothing moves),
//   2. Pause, hover, an off-screen panel and a hidden tab each hold it,
//   3. Pause is first in tab order, the ring is turmeric, inactive slides are
//      inert, and a visitor's own step is announced while autoplay is silent,
//   4. the outgoing slide has cleared before the wipe finishes, so old and new
//      words are never spliced together mid-transition,
//   5. reduced motion never autoplays, and switching it on mid-visit stops it,
//   6. without JS, all six conditions are a readable, linked index.
//
// The reel advances on its progress bar's animationend, so the tests shorten
// --reel-dwell instead of waiting 3.2s a slide.
import { test, expect } from './helpers/site.mjs';

test.use({ viewport: { width: 1440, height: 900 } });

const FAST = '.reel { --reel-dwell: 200ms !important; }';

test('one pass through all six, then it rests on the first with "Play again"', async ({ page, site }) => {
  await page.addInitScript(() => {
    window.__seen = [];
    new MutationObserver(() => {
      const t = document.querySelector('.reel-cur')?.textContent;
      if (t && window.__seen[window.__seen.length - 1] !== t) window.__seen.push(t);
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await page.goto(site.baseURL + '/');
  await page.addStyleTag({ content: FAST });
  await expect(page.locator('.reel-pause')).toHaveText('Play again', { timeout: 10_000 });
  expect(await page.evaluate(() => window.__seen)).toEqual(['01', '02', '03', '04', '05', '06', '01']);
  await expect(page.locator('.reel-name').first()).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.reel')).not.toHaveClass(/is-auto/);
  // Nothing moves after the pass.
  await page.waitForTimeout(800);
  await expect(page.locator('.reel-cur')).toHaveText('01');
});

test('Pause and hover each hold the reel; Play resumes it', async ({ page, site }) => {
  await page.goto(site.baseURL + '/');
  await page.addStyleTag({ content: FAST });
  await expect(page.locator('.reel')).toHaveClass(/is-auto/);
  await page.locator('.reel-pause').click();
  await expect(page.locator('.reel-pause')).toHaveText('Play');
  const held = await page.locator('.reel-cur').textContent();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(800);
  await expect(page.locator('.reel-cur'), 'Pause holds it').toHaveText(held);

  await page.locator('.reel-pause').click();
  await expect(page.locator('.reel-pause')).toHaveText('Pause');
  await page.locator('.reel-word').first().hover({ force: true });
  const hovered = await page.locator('.reel-cur').textContent();
  await page.waitForTimeout(800);
  await expect(page.locator('.reel-cur'), 'hover holds it').toHaveText(hovered);
  await page.mouse.move(5, 5);
  await expect(page.locator('.reel-cur'), 'leaving resumes it').not.toHaveText(hovered);
});

test('it never plays to an empty room: scrolled away, the reel holds', async ({ page, site }) => {
  await page.goto(site.baseURL + '/');
  await page.addStyleTag({ content: FAST });
  await page.evaluate(() => window.scrollTo(0, 2400));
  await expect(page.locator('.reel')).toHaveClass(/is-off/);
  const left = await page.locator('.reel-cur').textContent();
  await page.waitForTimeout(2500); // a full pass at 200ms a slide is ~1.2s
  await expect(page.locator('.reel-cur'), 'nothing advances off-screen').toHaveText(left);
  await expect(page.locator('.reel-pause'), 'the pass has not run off-screen').toHaveText('Pause');
  // Back on screen, it carries on from where it was.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.reel')).not.toHaveClass(/is-off/);
  await expect(page.locator('.reel-cur')).not.toHaveText(left);
});

test('a hidden tab holds the reel, and it carries on when the tab returns', async ({ page, site }) => {
  await page.goto(site.baseURL + '/');
  await page.addStyleTag({ content: FAST });
  await expect(page.locator('.reel')).toHaveClass(/is-auto/);
  const setHidden = (hidden) => page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  await setHidden(true);
  await expect(page.locator('.reel')).toHaveClass(/is-off/);
  const left = await page.locator('.reel-cur').textContent();
  await page.waitForTimeout(1500); // a full pass at 200ms a slide is ~1.2s
  await expect(page.locator('.reel-cur'), 'nothing advances in a hidden tab').toHaveText(left);
  await expect(page.locator('.reel-pause')).toHaveText('Pause');
  await setHidden(false);
  await expect(page.locator('.reel')).not.toHaveClass(/is-off/);
  await expect(page.locator('.reel-cur')).not.toHaveText(left);
});

test('keyboard: Pause comes first, the ring is turmeric, and a visitor\'s step is announced', async ({ page, site }) => {
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  await page.locator('.h-alt .tlink').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.reel-pause')).toBeFocused();
  const ring = await page.locator('.reel-pause').evaluate((el) => getComputedStyle(el).outlineColor);
  expect(ring, 'turmeric ring on the indigo ground').toBe('rgb(224, 165, 38)');
  // Focus inside holds autoplay; the silent pass writes nothing to the live region.
  await expect(page.locator('.reel')).toHaveClass(/is-held/);
  await expect(page.locator('.reel-live')).toHaveText('');

  // Inactive slides are inert: Tab reaches only the active slide's link.
  await page.keyboard.press('Tab');
  await expect(page.locator('.reel-slide.is-active .reel-link')).toBeFocused();
  expect(await page.locator('.reel-slide:not(.is-active)').evaluateAll((els) => els.every((e) => e.inert))).toBe(true);

  await page.keyboard.press('Tab'); // previous arrow
  await page.keyboard.press('Tab'); // first name
  await expect(page.locator('.reel-name').first()).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.reel-name').nth(1)).toBeFocused();
  await expect(page.locator('.reel-cur')).toHaveText('02');
  await expect(page.locator('.reel-live')).toHaveText('2 of 6: melasma. Melasma is manageable, not curable.');
  await expect(page.locator('.reel-pause'), 'a manual step stops autoplay').toHaveText('Play');
  expect(await page.locator('.reel-slide').nth(1).getAttribute('aria-label')).toBe('2 of 6: melasma');
});

test('the outgoing slide has cleared before the wipe ends, so words never splice', async ({ page, site }) => {
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600); // past the entrance
  const r = await page.evaluate(async () => {
    const leaving = document.querySelector('.reel-slide.is-active');
    document.querySelector('.reel-arrow[data-step="1"]').click();
    const active = document.querySelector('.reel-slide.is-active');
    await Promise.all(leaving.getAnimations().map((a) => a.finished));
    return {
      opacity: Number(getComputedStyle(leaving).opacity),
      wipeStillRunning: active.getAnimations().some((a) => a.playState === 'running'),
    };
  });
  expect(r.opacity, 'the old slide is gone…').toBeLessThan(0.05);
  expect(r.wipeStillRunning, '…while the new one is still wiping in').toBe(true);
});

test('reduced motion never autoplays, and turning it on mid-visit stops the pass', async ({ page, site }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(site.baseURL + '/');
  await page.addStyleTag({ content: FAST });
  await page.waitForTimeout(1500);
  await expect(page.locator('.reel-cur')).toHaveText('01');
  await expect(page.locator('.reel-pause')).toHaveText('Play');
  await page.locator('.reel-arrow[data-step="1"]').click();
  await expect(page.locator('.reel-cur')).toHaveText('02');
  expect(await page.locator('.reel-slide').evaluateAll((els) => els.flatMap((e) => e.getAnimations()).length), 'the swap does not move').toBe(0);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(site.baseURL + '/');
  await expect(page.locator('.reel')).toHaveClass(/is-auto/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.reel')).not.toHaveClass(/is-auto/);
  await expect(page.locator('.reel-pause')).toHaveText('Play');
});

test('without JS, all six conditions are a linked index and no dead controls show', async ({ page, site }) => {
  await page.route('**/js/site.js', (route) => route.abort());
  await page.goto(site.baseURL + '/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.reel-slide')).toHaveCount(6);
  for (let n = 0; n < 6; n += 1) {
    await expect(page.locator('.reel-word').nth(n)).toBeVisible();
    await expect(page.locator('.reel-link').nth(n)).toBeVisible();
  }
  await expect(page.locator('.reel-nav')).toBeHidden();
  await expect(page.locator('.reel-pause')).toBeHidden();
  await expect(page.locator('.reel-count')).toBeHidden();
  expect(await page.locator('.reel').getAttribute('aria-roledescription')).toBeNull();
});
