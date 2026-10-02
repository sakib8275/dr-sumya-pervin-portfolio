// Phase 2 — the multi-page /book/ form posts to the real /api/appointments via
// the real request path, with the Turnstile widget stubbed (headless Chromium is
// never issued a real token). Confirms the tier + session survive the round trip.
import { test, expect, stubTurnstile } from './helpers/site.mjs';
import { nextOpenDate, addDays, dhakaParts } from '../../functions/lib/schedule.js';

const CHAMBER = 'Alliance Hospital Limited (Shyamoli)';
const OPEN_DATE = nextOpenDate(CHAMBER, addDays(dhakaParts().dateStr, 1));

test('the /book/ form books a tiered appointment end to end', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/new/book/', { waitUntil: 'networkidle' });

  await page.fill('#sbName', 'E2E Patient');
  await page.fill('#sbPhone', '01700000099');
  await page.selectOption('#sbTier', 'Comprehensive Assessment');
  await page.selectOption('#sbChamber', CHAMBER);
  await page.fill('#sbDate', OPEN_DATE);
  await page.selectOption('#sbSession', 'Evening');
  await page.click('#sbSubmit');

  await expect(page.locator('#sbConfirm')).toContainText('Request received');
  await expect(page.locator('#sbConfirm')).toContainText('book-');

  // The row reached D1 with the tier and session intact.
  const row = await site.harness.db
    .prepare('SELECT consultation_type, preferred_session, service FROM appointments WHERE patient_phone = ?')
    .bind('01700000099').first();
  expect(row.consultation_type).toBe('Comprehensive Assessment');
  expect(row.preferred_session).toBe('Evening');
  expect(row.service).toBe('Comprehensive Assessment');
});

test('a missing date is refused client-side, before any request', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL + '/new/book/', { waitUntil: 'networkidle' });
  await page.fill('#sbName', 'No Date');
  await page.fill('#sbPhone', '01700000098');
  await page.click('#sbSubmit');
  await expect(page.locator('#sbStatus')).toContainText('preferred date');
  await expect(page.locator('#sbConfirm')).toBeHidden();
});
