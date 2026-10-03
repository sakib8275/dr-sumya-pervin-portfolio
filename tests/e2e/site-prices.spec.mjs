// The prices estimator applies the owner's 15% VAT at checkout. Displayed prices
// (and the estimator headline) exclude VAT; the output adds the VAT line and the
// checkout total. Default selection is deterministic: Unwanted hair, XS band,
// full course, nurse-performed — ৳15,000 + 15% (৳2,250) = ৳17,250.
//
// The estimator is laser-only data, so it publishes with the laser gate. When
// that gate is closed (e.g. the live 'opening' gate) the page shows the gate
// note instead; this spec follows whichever gate is configured.
import { test, expect } from './helpers/site.mjs';
import { gateVisible } from '../../content/site.mjs';

test('the prices estimator publishes with the laser gate', async ({ page, site }) => {
  await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });

  if (!gateVisible('laser')) {
    await expect(page.locator('#estimator')).toContainText(/publishes when the laser suite opens/i);
    await expect(page.locator('#estTotal')).toHaveCount(0);
    return;
  }

  await expect(page.locator('#estTotal')).toHaveText('৳15,000');
  const lines = page.locator('#estLines');
  await expect(lines).toContainText('VAT (15%, added at checkout)');
  await expect(lines).toContainText('৳2,250');
  await expect(lines.locator('.ln-total')).toContainText('৳17,250');
});
