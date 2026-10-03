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
  await expect(out.locator('a.btn')).toHaveAttribute('href', '/book/?tier=Specialist%20Consultation');
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
  await expect(page).toHaveURL(/\/book\/\?tier=Comprehensive%20Assessment$/);
  await expect(page.locator('#sbTier')).toHaveValue('Comprehensive Assessment');
});

test('a changing mole is "soon" and books a mole check with a priority slot', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/skin-check/', { waitUntil: 'networkidle' });
  const out = await answer(page, { where: 'face', look: 'mole', dur: 'months' });
  await expect(out.locator('.sc-urgency')).toHaveClass(/sc-soon/);
  await expect(out.locator('.sc-cond')).toHaveAttribute('href', '/conditions/skin-cancer/');
  await out.locator('a.btn', { hasText: 'Book a mole check' }).click();
  await expect(page.locator('#sbNotes')).toHaveValue(/priority slot/);
});

test('answers never leave the page in a URL', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/skin-check/', { waitUntil: 'networkidle' });
  const out = await answer(page, { where: 'private', look: 'private', dur: 'days', acts: ['pain'] });
  await expect(page).toHaveURL(/\/tools\/skin-check\/$/);
  await expect(out.locator('a.btn')).toHaveAttribute('href', '/book/?tier=Private%20Consultation');
  for (const href of await out.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
    // The visit type (Private Consultation) may travel; the symptoms may not.
    expect(href, 'no symptom words in any result link').not.toMatch(/sore|bump|discharge|pain|genital|look=|where=|act=/i);
  }
});

test('missing answers ask for them instead of guessing', async ({ page, site }) => {
  await page.goto(site.baseURL + '/tools/skin-check/', { waitUntil: 'networkidle' });
  const out = await answer(page, { where: 'face' });
  await expect(out).toContainText('Almost there');
  await expect(out.locator('.sc-cond')).toHaveCount(0);
});
