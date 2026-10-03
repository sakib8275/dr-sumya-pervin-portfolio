// Skin check (/tools/skin-check/), owner request 2026-10-03: "let a patient
// know their general condition easily". A symptom guide: the conditions a
// description often turns out to be (her own condition pages), how soon to be
// seen, and which visit fits. Never a diagnosis, never a procedure, nothing
// stored. These pin the safety-critical paths: emergencies short-circuit
// everything, and no answer ever leaves the page in a URL.
import { test, expect } from './helpers/site.mjs';

async function answer(page, { where, look, dur, acts = [], warn = [] }) {
  const form = page.locator('form[data-tool="skin-check"]');
  if (where) await form.locator(`input[name="where"][value="${where}"]`).check();
  if (look) await form.locator(`input[name="look"][value="${look}"]`).check();
  if (dur) await form.locator(`input[name="dur"][value="${dur}"]`).check();
  for (const a of acts) await form.locator(`input[name="act"][value="${a}"]`).check();
  for (const w of warn) await form.locator(`input[name="warn"][value="${w}"]`).check();
  await form.locator('button[type="submit"]').click();
  return page.locator('#scOut');
}

test('a ring-shaped rash points to the fungal infection guide, routine urgency', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/skin-check/', { waitUntil: 'networkidle' });
  const out = await answer(page, { where: 'body', look: 'ring', dur: 'weeks', acts: ['itch'] });
  await expect(out).toBeVisible();
  await expect(out.locator('.sc-urgency')).toHaveClass(/sc-routine/);
  const card = out.locator('.sc-cond');
  await expect(card).toHaveCount(1);
  await expect(card).toHaveAttribute('href', '/conditions/fungal-infection/');
  await expect(card).toContainText('Fungal Infection (Ringworm, Tinea)');
  await expect(out).toContainText('Only an examination can tell');
  await expect(out.locator('a.btn')).toHaveAttribute('href', '/book/');
  await expect(out.locator('a.btn')).toHaveAttribute('data-prefill-tier', 'Specialist Consultation');
});

test('trouble breathing short-circuits to the emergency message, with no booking', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/skin-check/', { waitUntil: 'networkidle' });
  // Only the warning is ticked: an emergency must not wait for the other answers.
  const out = await answer(page, { warn: ['airway'] });
  await expect(out.locator('.sc-emergency')).toContainText('Go to the nearest emergency department now');
  await expect(out.locator('a[href^="/book/"]')).toHaveCount(0);
  await expect(out.locator('.sc-cond')).toHaveCount(0);
});

test('a long-standing, busy problem suggests the Comprehensive Assessment and pre-selects it', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/skin-check/', { waitUntil: 'networkidle' });
  const out = await answer(page, { where: 'body', look: 'scaly', dur: 'long', acts: ['itch', 'spread'] });
  await expect(out).toContainText('Comprehensive Assessment.');
  await expect(out.locator('.sc-cond')).toHaveAttribute('href', '/conditions/psoriasis/');
  await out.locator('a.btn').click();
  // The visit is pre-selected, but nothing about it is in the address bar.
  await expect(page).toHaveURL(/\/book\/$/);
  await expect(page.locator('#sbTier')).toHaveValue('Comprehensive Assessment');
  // Read once: a later plain visit to /book/ starts clean.
  await page.reload();
  await expect(page.locator('#sbTier')).not.toHaveValue('Comprehensive Assessment');
});

test('a changing mole is "soon" and books a mole check with a priority slot', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/skin-check/', { waitUntil: 'networkidle' });
  const out = await answer(page, { where: 'face', look: 'mole', dur: 'months' });
  await expect(out.locator('.sc-urgency')).toHaveClass(/sc-soon/);
  await expect(out.locator('.sc-cond')).toHaveAttribute('href', '/conditions/skin-cancer/');
  await out.locator('a.btn', { hasText: 'Book a mole check' }).click();
  await expect(page).toHaveURL(/\/book\/$/);
  await expect(page.locator('#sbNotes')).toHaveValue(/priority slot/);
});

test('answers never leave the page in a URL', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/skin-check/', { waitUntil: 'networkidle' });
  for (const answers of [
    { where: 'private', look: 'private', dur: 'days', acts: ['pain'] },
    { where: 'face', look: 'mole', dur: 'weeks', warn: ['mole-fast'] },
  ]) {
    await page.reload();
    const out = await answer(page, answers);
    await expect(page).toHaveURL(/\/tools\/skin-check\/$/);
    for (const href of await out.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
      // Result links are fixed paths: no query string at all, so neither the
      // visit type (a private consultation, a mole check) nor a symptom can
      // reach history, logs or a referrer.
      expect(href, `result link ${href}`).not.toContain('?');
      expect(href, `result link ${href}`).not.toMatch(/mole|private|sore|bump|discharge|pain|genital/i);
    }
  }
});

test('the mole check result books without the answer in the URL', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/mole-check/', { waitUntil: 'networkidle' });
  await page.locator('input[data-sign="A"]').check();
  await page.locator('form[data-tool="mole-check"] button[type="submit"]').click();
  const book = page.locator('#moleOut a.btn');
  await expect(book).toHaveAttribute('href', '/book/');
  await book.click();
  await expect(page).toHaveURL(/\/book\/$/);
  await expect(page.locator('#sbNotes')).toHaveValue(/priority slot/);
});

test('missing answers ask for them instead of guessing', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/skin-check/', { waitUntil: 'networkidle' });
  const out = await answer(page, { where: 'face' });
  await expect(out).toContainText('Almost there');
  await expect(out.locator('.sc-cond')).toHaveCount(0);
});
