// Focus Not Obscured (A11Y-AUDIT-2026-10-28 #2, WCAG 2.4.11).
//
// The header is sticky (78px, 64px on phones), the /prices/ section tabs stick
// under it, and on phones the Call/WhatsApp/Book bar sticks to the bottom.
// Nothing reserved their space, so the browser counted a focused link sitting
// under a bar as already in view and did not scroll. Tabbing forward hid links
// under the bottom bar; tabbing back hid them under the header.
//
// The check asks the browser, not the CSS: after every Tab, whatever sits at
// the centre of the focused element must be that element, not a sticky bar.
import { test, expect } from './helpers/site.mjs';

const BARS = '.s-nav, .m-sticky, .pr-tabs';

async function coveredStops(page, key) {
  const covered = [];
  for (let i = 0; i < 250; i++) {
    await page.keyboard.press(key);
    const r = await page.evaluate((bars) => {
      const el = document.activeElement;
      if (!el || el === document.body) return { done: true };
      // The bars' own controls, and the closed drawer's, are not what is tested.
      if (el.closest(`${bars}, .u-bar, .drawer`)) return {};
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) return {};
      const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      const name = `${el.tagName.toLowerCase()} "${(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`;
      if (!hit) return { covered: `${name} is off-screen` };
      if (el.contains(hit) || hit.contains(el)) return {};
      const bar = hit.closest(bars);
      return bar ? { covered: `${name} is under .${bar.classList[0]}` } : {};
    }, BARS);
    if (r.done) break;
    if (r.covered) covered.push(r.covered);
  }
  return covered;
}

for (const [label, viewport] of [['phone', { width: 375, height: 667 }], ['desktop', { width: 1440, height: 900 }]]) {
  test.describe(`${label} ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    for (const path of ['/', '/prices/']) {
      test(`${path}: no focused control is hidden under a sticky bar, tabbing either way`, async ({ page, site }) => {
        // Instant scrolling (the reduced-motion block turns smooth scrolling
        // off); a smooth scroll would make every position racy.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(site.baseURL + path, { waitUntil: 'networkidle' });
        const forward = await coveredStops(page, 'Tab');
        const back = await coveredStops(page, 'Shift+Tab');
        expect({ forward, back }).toEqual({ forward: [], back: [] });
      });
    }

    // The same padding places in-page jumps: a price tab, and the hero's #now.
    for (const [path, link, bar] of [['/prices/', '.pr-tabs a[href="#tests"]', '.pr-tabs'], ['/', 'a[href="#now"]', '.s-nav']]) {
      test(`${path}: jumping to ${link.match(/#\w+/)[0]} lands below ${bar}`, async ({ page, site }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(site.baseURL + path, { waitUntil: 'networkidle' });
        await page.locator(link).first().click();
        const id = link.match(/#(\w+)/)[1];
        await expect.poll(() => page.evaluate(() => location.hash)).toBe('#' + id);
        const gap = await page.evaluate(([id, bar]) =>
          document.getElementById(id).getBoundingClientRect().top - document.querySelector(bar).getBoundingClientRect().bottom, [id, bar]);
        expect(gap, `#${id} starts ${gap}px below the bottom of ${bar}`).toBeGreaterThanOrEqual(0);
      });
    }
  });
}
