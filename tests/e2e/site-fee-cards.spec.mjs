// Fee cards open a package detail view in place (owner, 2026-10-03: "clicking
// on the cards should show what the package offers, not in a new page, in a
// view"). A tap anywhere on a card — not only its button — opens a native
// <dialog> filled from the card's build-time <template>. Esc, the ✕, the
// Close button and the backdrop all close it and hand focus back to the card.
// Consultations book from inside the view with the visit pre-selected; Care
// Plans point to a consultation first (no package is sold at a first visit).
import { test, expect } from './helpers/site.mjs';

// Click a card at its price figure: the card's stretched button covers it,
// which is the behaviour under test, so the click goes to the card itself.
async function clickCardBody(page, card, priceSel) {
  await card.scrollIntoViewIfNeeded();
  const c = await card.boundingBox();
  const p = await card.locator(priceSel).boundingBox();
  await card.click({ position: { x: p.x - c.x + 10, y: p.y - c.y + p.height / 2 } });
}

for (const [path, cardSel, priceSel] of [['/', '.h-tier', '.h-tier-p'], ['/prices/', '.pr-card', '.pr-price']]) {
  test(`${path}: tapping a fee card opens its detail view, not a new page`, async ({ page, site }) => {
    await page.goto(site.baseURL + path, { waitUntil: 'networkidle' });
    const card = page.locator(cardSel).filter({ hasText: 'Comprehensive Assessment' }).first();
    await clickCardBody(page, card, priceSel);

    const view = page.locator('#pkgView');
    await expect(view).toBeVisible();
    await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/') + '$'));
    await expect(view.locator('#pkgTitle')).toHaveText('Comprehensive Assessment');
    await expect(view).toContainText('Standardised baseline photographs');
    await expect(view).toContainText('৳4,025 with 15% VAT');
    await expect(view).toContainText('Follow-up within 30 days');

    await page.keyboard.press('Escape');
    await expect(view).toBeHidden();
    await expect(card.locator('[data-pkg-open]')).toBeFocused();
  });
}

test('booking from inside the view pre-selects that visit', async ({ page, site }) => {
  await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });
  await clickCardBody(page, page.locator('.pr-card').filter({ hasText: 'Signature' }).first(), '.pr-price');
  await page.locator('#pkgView a', { hasText: 'Book this visit' }).click();
  await expect(page).toHaveURL(/\/book\/\?tier=Signature%20Skin%20%26%20Hair%20Review$/);
  await expect(page.locator('#sbTier')).toHaveValue('Signature Skin & Hair Review');
});

test('the backdrop and the Close button both dismiss the view', async ({ page, site }) => {
  await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
  const view = page.locator('#pkgView');
  await page.locator('.h-tier [data-pkg-open="specialist"]').click();
  await expect(view).toBeVisible();
  await page.mouse.click(10, 300); // the backdrop, left of the side sheet
  await expect(view).toBeHidden();
  await page.locator('.h-tier [data-pkg-open="specialist"]').click();
  await view.locator('.pkg-actions button', { hasText: 'Close' }).click();
  await expect(view).toBeHidden();
});

test('a care plan view shows its value breakdown and books a consultation first', async ({ page, site }) => {
  await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });
  await clickCardBody(page, page.locator('.pr-plan').filter({ hasText: 'Core Care Plan' }).first(), '.pr-price');
  const view = page.locator('#pkgView');
  await expect(view.locator('#pkgTitle')).toHaveText('Core Care Plan');
  await expect(view).toContainText('You keep ৳1,900');
  await expect(view).toContainText('Offered only after a diagnosis');
  const book = view.locator('.pkg-actions a');
  await expect(book).toHaveText('Book a consultation first');
  await expect(book).toHaveAttribute('href', '/book/');
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  test('the view is a bottom sheet with its actions in reach', async ({ page, site }) => {
    await page.goto(site.baseURL + '/', { waitUntil: 'networkidle' });
    await page.locator('.h-tier [data-pkg-open="comprehensive"]').click();
    // Measure the settled sheet, not mid-slide.
    await page.locator('#pkgView').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const box = await page.locator('#pkgView').boundingBox();
    expect(Math.round(box.y + box.height), 'the sheet sits on the bottom edge').toBe(667);
    await expect(page.locator('#pkgView .pkg-actions a')).toBeInViewport();
  });
});
