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

// Regression (2026-10-03): a press effect that transformed the card's own
// button made it the containing block of its stretched ::after, so the target
// shrank to the button on mousedown and a slow press on the card body was lost.
// A real hand holds the press longer than Playwright's click, so hold it.
test('a slow press anywhere on the card, corners included, still opens it', async ({ page, site }) => {
  await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });
  const view = page.locator('#pkgView');
  for (const sel of ['.pr-card', '.pr-plan']) {
    const card = page.locator(sel).first();
    await card.scrollIntoViewIfNeeded();
    const c = await card.boundingBox();
    for (const [x, y] of [[c.x + c.width / 2, c.y + c.height * 0.45], [c.x + 10, c.y + 10]]) {
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.up();
      await expect(view, `${sel} at (${Math.round(x - c.x)}, ${Math.round(y - c.y)})`).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(view).toBeHidden();
    }
  }
});

// Regression (2026-10-05): closing the sheet plays a ~440ms view transition,
// during which the browser hit-tests its overlay, so a press that starts then
// goes down on <html>. If it is released after the transition ends, it comes
// up on the card, and the click goes to the two targets' common ancestor,
// <html>, with no transition left running, so the press was dropped. The
// slow-press test above lost ~1 run in 5 to this. Here the transition is
// slowed so the press straddles its end every time.
test('a press that starts while the sheet is closing still opens the card it ends on', async ({ page, site }) => {
  await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e));
  const view = page.locator('#pkgView');
  const card = page.locator('.pr-card').first();
  await card.scrollIntoViewIfNeeded();
  const c = await card.boundingBox();
  const [x, y] = [c.x + c.width / 2, c.y + c.height * 0.45];
  await page.mouse.click(x, y);
  await expect(view).toBeVisible();
  await expect(view, 'the opening transition has finished').not.toHaveClass(/\bvt\b/);

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.2 });
  await page.keyboard.press('Escape');
  await expect(view, 'the closing transition is still playing').toHaveClass(/\bvt\b/);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect(view, 'the transition has finished').not.toHaveClass(/\bvt\b/, { timeout: 10_000 });
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await page.mouse.up();
  await expect(view, 'the press that straddled the transition opens the card').toBeVisible();
  // The replay's skipTransition rejects the skipped transition's `finished`;
  // site.js swallows that AbortError, so no unhandled rejection reaches the page.
  expect(pageErrors, 'no unhandled rejection from the skipped transition').toEqual([]);
});

// Regression (2026-10-05, review of this PR): starting a transition over a
// live one aborts the live one. The aborted cleanup must not strip .vt or the
// "pkg" name under the survivor, and the survivor must not be left with a
// second element named "pkg" — a duplicate name makes the browser skip every
// later transition on the page. A keyboard Enter reaches the trigger directly
// (the overlay replay is pointer-only), so two transitions really overlap.
test('a transition that supersedes a live one keeps the overlay and retires the old name', async ({ page, site }) => {
  await page.goto(site.baseURL + '/prices/', { waitUntil: 'networkidle' });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e));
  const view = page.locator('#pkgView');
  const card = page.locator('.pr-card').first();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(view).toBeVisible();
  await expect(view, 'the opening transition has finished').not.toHaveClass(/\bvt\b/);
  const firstTitle = await view.locator('#pkgTitle').textContent();

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.2 });
  await page.keyboard.press('Escape');
  await expect(view, 'the closing transition is still playing').toHaveClass(/\bvt\b/);

  await page.locator('.pr-card [data-pkg-open]').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(view, 'the superseding open transition is playing, not stripped by the abort').toHaveClass(/\bvt\b/);

  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await expect(view, 'the superseding open ran to its end').not.toHaveClass(/\bvt\b/, { timeout: 10_000 });
  expect(await card.evaluate((el) => el.style.viewTransitionName),
    'the superseded close left no stray "pkg" name on its card').toBe('');
  await expect(view.locator('#pkgTitle')).not.toHaveText(firstTitle);
  await page.keyboard.press('Escape');
  await expect(view).toBeHidden();
  expect(pageErrors, 'a superseded transition rejects finished with AbortError, which is swallowed').toEqual([]);
});

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
