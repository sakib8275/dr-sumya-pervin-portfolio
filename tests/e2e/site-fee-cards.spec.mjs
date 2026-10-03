// Fee cards are whole-card targets (owner report, 2026-10-03: "can't select
// any prices card"). A tap anywhere on a consultation card — not only on its
// button — opens /book/ with that visit already chosen. Care Plans stay
// non-bookable on purpose: no package is sold at a first visit.
import { test, expect } from './helpers/site.mjs';

for (const [path, card] of [['/', '.h-tier'], ['/prices/', '.pr-card']]) {
  test(`${path}: tapping a fee card body books that visit`, async ({ page, site }) => {
    await page.goto(site.baseURL + path, { waitUntil: 'networkidle' });
    const target = page.locator(card).filter({ hasText: 'Comprehensive Assessment' }).first();
    // Click where the price figure sits, well away from the card's button. The
    // card's stretched link covers it — that is the point — so click the card.
    const card_ = await target.boundingBox();
    const price = await target.locator(path === '/' ? '.h-tier-p' : '.pr-price').boundingBox();
    await target.click({ position: { x: price.x - card_.x + 10, y: price.y - card_.y + price.height / 2 } });
    await expect(page).toHaveURL(/\/book\/\?tier=Comprehensive%20Assessment$/);
    await expect(page.locator('#sbTier')).toHaveValue('Comprehensive Assessment');
  });
}

test('the Signature card survives the ampersand round trip', async ({ page, site }) => {
  await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });
  const card = page.locator('.pr-card').filter({ hasText: 'Signature' }).first();
  await card.scrollIntoViewIfNeeded();
  const c = await card.boundingBox();
  const price = await card.locator('.pr-price').boundingBox();
  await card.click({ position: { x: price.x - c.x + 10, y: price.y - c.y + price.height / 2 } });
  await expect(page.locator('#sbTier')).toHaveValue('Signature Skin & Hair Review');
});

test('care plans carry no booking action', async ({ page, site }) => {
  await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });
  await expect(page.locator('.pr-plan a')).toHaveCount(0);
});
