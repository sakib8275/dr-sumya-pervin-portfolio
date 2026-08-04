import { defineConfig, devices } from '@playwright/test';

// F10, the DOM layer. Deliberately NOT wired into `npm test`: that suite is 191
// hermetic Node tests that run in ~3 s and gate every deploy, and folding a
// browser download and a browser launch into it would make the gate slow enough
// to start being skipped. Run it with `npm run test:e2e`.
//
// No webServer block: each test starts its own Miniflare-backed site through the
// `site` fixture (tests/e2e/helpers/site.mjs), so there is no shared port, no
// unmigrated local D1 to work around, and no cross-test state.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.mjs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
