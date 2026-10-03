// The prices estimator applies the owner's 15% VAT at checkout. Displayed prices
// (and the estimator headline) exclude VAT; the output adds the VAT line and the
// checkout total. Default selection is deterministic: Unwanted hair, XS band,
// full course, nurse-performed — ৳15,000 + 15% (৳2,250) = ৳17,250.
import { test, expect } from './helpers/site.mjs';

test('the estimator adds 15% VAT and shows the checkout total', async ({ page, site }) => {
  await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });

  await expect(page.locator('#estTotal')).toHaveText('৳15,000');
  const lines = page.locator('#estLines');
  await expect(lines).toContainText('VAT (15%, added at checkout)');
  await expect(lines).toContainText('৳2,250');
  await expect(lines.locator('.ln-total')).toContainText('৳17,250');
});
