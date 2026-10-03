// "Consulting today" on the home chamber columns. site.js compares the Dhaka
// weekday (UTC+6, no DST) with each column's data-days, which the build stamps
// from functions/lib/schedule.js: Alliance Saturday–Thursday, DCIMCH
// Saturday–Wednesday. The clock is pinned so these do not depend on the day
// the suite runs.
import { test, expect } from './helpers/site.mjs';

const alliance = (page) => page.locator('.h-ch', { hasText: 'Alliance Hospital Limited' });
const dcimch = (page) => page.locator('.h-ch', { hasText: 'Dhaka Central International' });

for (const [label, iso, a, d] of [
  ['Saturday: both chambers consult', '2026-10-10T06:00:00Z', true, true],
  ['Thursday: only Alliance (DCIMCH is Saturday–Wednesday)', '2026-10-08T06:00:00Z', true, false],
  ['Friday: neither chamber consults', '2026-10-09T06:00:00Z', false, false],
  // 20:00 UTC Thursday is 02:00 Friday in Dhaka: the flag follows Dhaka.
  ['late Thursday UTC is already Friday in Dhaka', '2026-10-08T20:00:00Z', false, false],
]) {
  test(`${label}`, async ({ page, site }) => {
    await page.clock.setFixedTime(new Date(iso));
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    for (const [col, on] of [[alliance(page), a], [dcimch(page), d]]) {
      const flag = col.locator('.h-ch-today');
      if (on) {
        await expect(flag).toBeVisible();
        await expect(flag).toHaveText('Consulting today');
        await expect(col).toHaveClass(/is-today/);
      } else {
        await expect(flag).toBeHidden();
        await expect(col).not.toHaveClass(/is-today/);
      }
    }
  });
}
