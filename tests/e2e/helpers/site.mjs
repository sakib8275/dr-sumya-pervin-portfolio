// F10 fixture: a real browser pointed at the real compiled Worker.
//
// Why this and not `wrangler pages dev`:
//
// The positive booking path needs siteverify to return BOTH the expected action
// and an allowlisted hostname (functions/lib/turnstile.js). Cloudflare's
// always-pass testing keys mint a token carrying no action, so they can never
// satisfy that check, and a browser-solved token is single-use and unrepeatable.
// `wrangler pages dev` has no way to intercept the outbound siteverify call, so
// under it every DOM-level booking test would 403 for a reason that has nothing
// to do with the DOM.
//
// tests/helpers/harness.mjs already solves exactly this for the API suite, using
// Miniflare's outboundService. Miniflare also listens on a real HTTP port, so the
// same harness serves the same public/ assets and the same compiled Functions to
// a real Chromium. F10 therefore reuses it rather than standing up a second,
// weaker runner: one siteverify stub, one migration path, one route table.
//
// What this does NOT cover: the zone-injected scripts on the apex (JavaScript
// Detections, the Analytics beacon) do not exist here, and neither does a real
// Turnstile widget. Both are covered by live-apex verification at deploy time.
import { test as base, expect } from '@playwright/test';
import { createHarness, tokens, TEST_PIN } from '../../helpers/harness.mjs';

// The token protocol the harness siteverify stub understands. The page-side stub
// hands this string back from turnstile.getResponse(), so it travels the real
// request path and is verified by the real verifyTurnstile().
export const BOOKING_TOKEN = tokens.good('booking');
export const LOGIN_TOKEN = tokens.good('login');

/**
 * Replaces the real Turnstile widget.
 *
 * Headless Chromium is never issued a token by the real widget (2026-07-31
 * evidence), so without this every booking submit stops at main.js's own
 * "complete the verification" guard and the request under test is never sent.
 *
 * Installed via addInitScript so it exists before main.js's renderTurnstile()
 * poll runs. render() must return a non-null id: main.js guards remounting on
 * `turnstileIds[key] !== null`.
 */
export async function stubTurnstile(page, { token = null } = {}) {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );

  await page.addInitScript((fixed) => {
    const responses = new Map();
    window.turnstile = {
      render(el, opts) {
        const action = (opts && opts.action) || 'widget';
        const id = 'stub-' + action;
        // Derived from the action, not hardcoded: verifyTurnstile() rejects a
        // token whose action does not match the endpoint, so a single fixed
        // token would let the booking widget pass and silently 403 the login
        // one. `fixed` overrides this for tests that want a bad token.
        const tok = fixed || 'good:' + action;
        responses.set(id, tok);
        // The real widget injects this input; main.js does not read it, but the
        // live-apex checks do, so keep the DOM shape honest.
        if (el && !el.querySelector('input[name="cf-turnstile-response"]')) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'cf-turnstile-response';
          input.value = tok;
          el.appendChild(input);
        }
        return id;
      },
      getResponse: (id) => responses.get(id) || '',
      // Real tokens are single-use and main.js resets the widget after a failed
      // attempt. Re-arm with the same action-derived token so a retry can succeed.
      reset(id) {
        responses.set(id, fixed || 'good:' + String(id).replace(/^stub-/, ''));
      }
    };
  }, token);
}

/**
 * Opens the booking modal from whichever trigger is actually visible.
 *
 * There are seven .open-booking elements. Which are visible depends on the
 * viewport: the nav one is hidden below the desktop breakpoint and the drawer
 * one is hidden above it, so `.first()` silently picks a hidden element at
 * 375px and the click times out. Always go through a :visible match.
 */
export async function openBookingModal(page) {
  await page.locator('.open-booking:visible').first().click();
  await page.locator('#bookingModal.active').waitFor();
}

export const test = base.extend({
  // One isolated Worker + D1 + R2 per test. Isolation matters here: spec 4
  // mutates admin_settings, and a shared database would make the WhatsApp
  // gating assertions order-dependent.
  site: async ({}, use) => {
    const harness = await createHarness();
    const url = await harness.mf.ready;
    await use({ harness, baseURL: url.toString().replace(/\/$/, ''), pin: TEST_PIN });
    await harness.dispose();
  }
});

export { expect };
