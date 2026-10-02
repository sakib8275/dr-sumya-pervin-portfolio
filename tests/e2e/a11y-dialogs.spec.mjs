// Step 6 regressions, at the layer where they were actually broken.
//
// Two of these defects (A8, A9) were found only because this pass poked the DOM
// with a throwaway script; the node suite and the API suite were both green over
// the whole time they shipped. That is the argument for the file: the contract is
// "what a keyboard user can reach and where their focus is", which no assertion
// against source text can check.
//
// A8 · #forgotModal and #resetModal carried an inline style="display:none" that
//      .active never cleared. Adding .active set opacity:1 on a display:none box,
//      so the entire self-service PIN-recovery path shipped in F13 was unreachable
//      from the UI while every one of its API tests passed.
// A9 · With every modal closed, 14 controls inside them were still reachable by
//      Tab -- the whole booking form, the CMS PIN field, both close buttons. A
//      keyboard user tabbing the page fell into invisible forms.
import { test, expect, stubTurnstile, openBookingModal } from './helpers/site.mjs';

const DIALOG_IDS = ['serviceModal', 'bookingModal', 'cmsModal', 'forgotModal', 'resetModal'];

test('no control inside a closed dialog is reachable by Tab', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  // Ask the browser, rather than reasoning about CSS. checkVisibility with
  // visibilityProperty is the only predicate that gets this right:
  // getClientRects() and offsetParent are both non-null for a visibility:hidden
  // subtree, so either would have called the closed dialogs a pass while every
  // control in them was still tabbable. opacityProperty is left OFF on purpose --
  // opacity:0 does not remove anything from the tab order, so turning it on would
  // hand a clean pass back to the exact bug being guarded against.
  const reachable = await page.evaluate((ids) => {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const out = [];
    for (const id of ids) {
      const dialog = document.getElementById(id);
      if (!dialog) { out.push(id + ': MISSING'); continue; }
      if (dialog.classList.contains('active')) { out.push(id + ': open at load'); continue; }
      for (const el of dialog.querySelectorAll(sel)) {
        if (el.checkVisibility({ visibilityProperty: true })) {
          out.push(id + ' > ' + (el.id || el.className || el.tagName));
        }
      }
    }
    return out;
  }, DIALOG_IDS);

  expect(reachable, 'controls inside closed dialogs are still in the tab order').toEqual([]);
});

test('the forgot-PIN and reset dialogs actually become visible', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  await page.locator('.open-cms:visible').first().click();
  await expect(page.locator('#cmsModal')).toHaveClass(/\bactive\b/);

  await page.locator('#openForgotBtn').click();
  // toBeVisible() is the whole point here: the failure mode was a box that had
  // .active and opacity:1 but display:none, which every class-based assertion
  // would have called a pass.
  await expect(page.locator('#forgotModal')).toBeVisible();
  await expect(page.locator('#forgotEmailInput')).toBeVisible();

  await page.locator('#closeForgot').click();
  await expect(page.locator('#forgotModal')).toBeHidden();

  // The reset dialog has no in-page trigger -- it is opened by the token deep
  // link mailed to the doctor.
  await page.goto(site.baseURL + '/#reset?token=deadbeef');
  await expect(page.locator('#resetModal')).toBeVisible();
  await expect(page.locator('#resetNewPin')).toBeVisible();
});

test('opening a dialog moves focus into it and closing returns it to the opener', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  const trigger = page.locator('.open-booking:visible').first();
  await openBookingModal(page);

  // Focus lands on the first real control, not the close button, and not on the
  // trigger sitting behind the overlay.
  await expect(page.locator('#patientName')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.locator('#bookingModal')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('focus-in never steals focus from someone already typing', async ({ page, site }) => {
  // The focus-in was first written deferred by a requestAnimationFrame. That
  // frame was long enough for a fast typist -- or the next line of a test -- to
  // land in the second field before the deferred focus() pulled them back to the
  // first, so the rest of what they typed went into the wrong input: the phone
  // number appended to the name, and an empty required field blocking the submit.
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  await page.locator('.open-booking:visible').first().click();
  await expect(page.locator('#bookingModal')).toBeVisible();

  // No wait between opening and typing -- that gap is the whole bug.
  await page.locator('#patientName').fill('Race Check');
  await page.locator('#patientPhone').fill('01711000000');
  await page.locator('#patientMessage').fill('notes');

  await expect(page.locator('#patientName')).toHaveValue('Race Check');
  await expect(page.locator('#patientPhone')).toHaveValue('01711000000');
  await expect(page.locator('#patientMessage')).toHaveValue('notes');
  // Focus stayed where the last interaction put it.
  await expect(page.locator('#patientMessage')).toBeFocused();
});

test('body scroll is locked while a dialog is open and released after', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  const overflow = () => page.evaluate(() => getComputedStyle(document.body).overflow);
  expect(await overflow()).not.toBe('hidden');

  await openBookingModal(page);
  expect(await overflow(), 'the page scrolls behind an open modal on mobile').toBe('hidden');

  await page.locator('#closeBooking').click();
  await expect(page.locator('#bookingModal')).toBeHidden();
  expect(await overflow()).not.toBe('hidden');
});

test('Tab is trapped inside the open dialog', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);
  await openBookingModal(page);

  // Well past the number of controls in the form, so a leak out of the modal
  // shows up regardless of where the trap gives way.
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() =>
      document.getElementById('bookingModal').contains(document.activeElement)
    );
    expect(inside, `focus escaped the booking modal after ${i + 1} Tab presses`).toBe(true);
  }
});

test('the skip link is the first tab stop and jumps to main', async ({ page, site }) => {
  await stubTurnstile(page);
  await page.goto(site.baseURL);

  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await skip.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
