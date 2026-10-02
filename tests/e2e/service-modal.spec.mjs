// A2 regression at the DOM layer — each service modal shows its own copy.
//
// tests/services.test.mjs proves the two key lists match. This proves the thing
// the patient actually experiences: that opening eight different services does
// not produce eight identical modals. Before 2026-08-27 it did, because every
// SERVICES_DATA lookup missed and every modal fell through to the same invented
// '30-45 mins / Minimal / General skin phototypes'.
import { test, expect, stubTurnstile } from './helpers/site.mjs';

test('all eight services open distinct modals, and unsupplied facts are not invented', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  // Four cards ship behind the "Show more" toggle.
  await page.locator('#svcToggle').click();
  const cards = page.locator('#svcGrid .svc');
  await expect(cards).toHaveCount(8);

  const seen = new Map();

  for (let i = 0; i < 8; i++) {
    const card = cards.nth(i);
    const heading = (await card.locator('h4').textContent()).trim();

    await card.click();
    await expect(page.locator('#serviceModal')).toHaveClass(/\bactive\b/);
    await expect(page.locator('#serviceModalTitle')).toHaveText(heading);

    const desc = (await page.locator('#serviceModalDesc').textContent()).trim();
    expect(desc.length, `${heading}: modal description is empty`).toBeGreaterThan(40);

    // The heart of A2: no two services may share a description.
    if (seen.has(desc)) {
      throw new Error(`"${heading}" shows the same description as "${seen.get(desc)}" — the SERVICES_DATA lookup is missing again`);
    }
    seen.set(desc, heading);

    // The metadata block is all-or-nothing per service, and when it renders it
    // must not be showing the inert markup placeholder.
    const metaVisible = await page.locator('#serviceModalMeta').isVisible();
    if (metaVisible) {
      for (const id of ['#serviceModalDuration', '#serviceModalRecovery', '#serviceModalSuitability']) {
        const cellShown = await page.locator(id).isVisible();
        if (cellShown) {
          const text = (await page.locator(id).textContent()).trim();
          expect(text, `${heading}: ${id} still shows the placeholder`).not.toBe('—');
          expect(text.length).toBeGreaterThan(0);
        }
      }
    }

    await page.locator('#closeService').click();
    await expect(page.locator('#serviceModal')).not.toHaveClass(/\bactive\b/);
  }

  expect(seen.size, 'all eight services must have distinct copy').toBe(8);
});

test('a service with no supplied timings hides the metadata block rather than inventing one', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  // 'Skin Health Coaching' is a consultation, not a procedure: the practice has
  // supplied no duration/recovery/suitability, so the block must not render.
  await page.locator('#svcGrid .svc', { hasText: 'Skin Health Coaching' }).first().click();
  await expect(page.locator('#serviceModalTitle')).toHaveText('Skin Health Coaching');
  await expect(page.locator('#serviceModalMeta')).toBeHidden();

  await page.locator('#closeService').click();

  // 'Chemical Peels' has all three, so the block must render with real values.
  await page.locator('#svcGrid .svc', { hasText: 'Chemical Peels' }).first().click();
  await expect(page.locator('#serviceModalMeta')).toBeVisible();
  await expect(page.locator('#serviceModalDuration')).toHaveText('30 mins');
  await expect(page.locator('#serviceModalRecovery')).toContainText('flaking');
});
