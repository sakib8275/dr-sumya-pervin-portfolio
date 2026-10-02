// A10 — the site-copy rich text actually renders.
//
// richtext.js uses ES exports (tests/richtext.test.mjs imports them) but was
// loaded from index.html as a CLASSIC script. It therefore threw "Unexpected
// token 'export'" on every page load and never reached the window.RichText
// assignment at the bottom of the file. loadSiteContent()'s guard —
//
//   if (window.RichText && typeof window.RichText.renderLightRich === 'function')
//
// — is a silent fallback to textContent, so nothing surfaced: the unit tests
// passed (they import the module directly), the page looked fine, and the doctor's
// **bold** in the hero tagline rendered as literal asterisks. The feature had
// never worked in production.
import { test, expect, stubTurnstile } from './helpers/site.mjs';

test('the module loads and exposes window.RichText to the page', async ({ page, site }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await stubTurnstile(page);
  await page.goto(site.baseURL);

  expect(errors, 'a script on the page failed to parse').toEqual([]);
  expect(await page.evaluate(() => typeof window.RichText?.renderLightRich)).toBe('function');
});

test('bold markup in the site copy renders as <strong>, not asterisks', async ({ page, site }) => {
  await site.harness.db
    .prepare("INSERT INTO site_content (key, content) VALUES ('hero.tagline', ?) " +
             'ON CONFLICT(key) DO UPDATE SET content = excluded.content')
    .bind('Consultant dermatologist with **fifteen years** of practice')
    .run();

  await stubTurnstile(page);
  await page.goto(site.baseURL);

  const tagline = page.locator('[data-content="hero.tagline"]');
  await expect(tagline.locator('strong')).toHaveText('fifteen years');
  await expect(tagline).not.toContainText('**');
});

test('the parser still escapes HTML in the doctor-supplied copy', async ({ page, site }) => {
  // renderLightRich() sets innerHTML, so this path is the one place CMS-authored
  // text becomes live markup. It escapes before formatting; that must stay true.
  await site.harness.db
    .prepare("INSERT INTO site_content (key, content) VALUES ('hero.tagline', ?) " +
             'ON CONFLICT(key) DO UPDATE SET content = excluded.content')
    .bind('<img src=x onerror="window.__pwned = 1"> **safe**')
    .run();

  await stubTurnstile(page);
  await page.goto(site.baseURL);

  const tagline = page.locator('[data-content="hero.tagline"]');
  await expect(tagline.locator('strong')).toHaveText('safe');
  expect(await tagline.locator('img').count(), 'the copy became a live element').toBe(0);
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
});
