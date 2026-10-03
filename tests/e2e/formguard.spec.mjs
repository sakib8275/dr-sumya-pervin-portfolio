// The pre-hydration submit guard, at its new home.
//
// The one-pager guarded its booking modal with formguard.js (a capturing
// listener in <head>) because it shipped an onsubmit attribute that the CSP
// dropped. The multi-page /book/ form uses a different, stronger guard: the
// submit button starts disabled in the markup and site.js enables it only once
// the page is wired. Before hydration a native submit must therefore do nothing
// -- not reload and throw the patient's booking away.
import { test, expect } from './helpers/site.mjs';

test('the submit button is disabled until site.js hydrates', async ({ page, site }) => {
  await page.route('**/js/site.js', (route) => route.abort());
  await page.goto(site.baseURL + '/book/');

  await expect(page.locator('#sbSubmit')).toBeDisabled();
  await expect(page.locator('#sbSubmit')).toHaveAttribute('aria-busy', 'true');
});

test('an implicit submit before hydration does not navigate away', async ({ page, site }) => {
  // site.js never arrives -- the flaky-connection case. Enter in a text field is
  // the implicit-submission gesture the disabled button exists to neutralise.
  await page.route('**/js/site.js', (route) => route.abort());
  await page.goto(site.baseURL + '/book/');

  const urlBefore = page.url();
  await page.locator('#sbName').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  expect(page.url(), 'the disabled button must stop implicit submission').toBe(urlBefore);
  // A GET submit would have appended "?" and dropped every field.
  expect(page.url()).not.toContain('?');
});
