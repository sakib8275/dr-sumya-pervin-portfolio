// Interactive tools (docx §5.40): mole check, skin-type guide, prepare-for-visit.
// Client-side only, nothing stored. These pin the two outcomes of each tool and
// the incomplete-answer guard, so a JS regression cannot silently break them.
import { test, expect } from './helpers/site.mjs';

test('mole check: ticking a sign recommends a dermatologist’s look', async ({ page, site }) => {
  await page.goto(site.baseURL + '/new/tools/mole-check/', { waitUntil: 'networkidle' });
  await page.locator('input[data-sign="C"]').check();
  await page.locator('form[data-tool="mole-check"] button[type="submit"]').click();
  await expect(page.locator('#moleOut')).toContainText('Worth a dermatologist’s look');
});

test('mole check: no signs is reassuring but not a clean bill of health', async ({ page, site }) => {
  await page.goto(site.baseURL + '/new/tools/mole-check/', { waitUntil: 'networkidle' });
  await page.locator('form[data-tool="mole-check"] button[type="submit"]').click();
  await expect(page.locator('#moleOut')).toContainText('Nothing concerning today');
});

test('skin type guide: answers produce a type and routine, incomplete prompts to finish', async ({ page, site }) => {
  await page.goto(site.baseURL + '/new/tools/skin-type-guide/', { waitUntil: 'networkidle' });
  const form = page.locator('form[data-tool="skin-type"]');
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#skinOut')).toContainText('Almost there');

  for (const [name, value] of [['feel', 'oily'], ['react', 'breakout'], ['sun', 'burn'], ['breakouts', 'often'], ['marks', 'yes'], ['outdoor', 'some']]) {
    await form.locator(`input[name="${name}"][value="${value}"]`).check();
  }
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#skinOut')).toContainText('Your skin type: oily');
  await expect(page.locator('#skinOut')).toContainText('SPF 50');
});

test('prepare-for-visit: long-standing concerns suggest the Comprehensive depth', async ({ page, site }) => {
  await page.goto(site.baseURL + '/new/consultation-prep/', { waitUntil: 'networkidle' });
  const form = page.locator('form[data-tool="prep"]');
  for (const [name, value] of [['duration', 'chronic'], ['itch', 'yes'], ['products', 'many'], ['doctors', 'yes'], ['conditions', 'no'], ['photo', 'yes'], ['cosmetic', 'no']]) {
    await form.locator(`input[name="${name}"][value="${value}"]`).check();
  }
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#prepOut')).toContainText('Suggested depth:');
  await expect(page.locator('#prepOut')).toContainText('Comprehensive Assessment');
});
