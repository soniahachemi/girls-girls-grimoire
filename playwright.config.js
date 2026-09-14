// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const SIZES = require('./tests/viewport-sizes');

// Projects are split along two independent, orthogonal axes so that
// growing either one later (V2 is expected to add real logic, likely
// needing multi-engine coverage) never requires touching a test file:
//
// 1. Which spec file(s) a project runs, via `testMatch` -- structure.spec.js
//    and accessibility.spec.js don't depend on viewport size (see GGG-12),
//    so they run once per engine covered. responsive.spec.js assertions
//    are, by construction, viewport-size specific.
// 2. Which browser engine a project uses, via `use.browserName` / a device
//    preset (e.g. `devices['iPhone 12']`, which also implies WebKit).
//
// A third axis -- which viewport sizes a project covers -- is declared
// explicitly per project via `metadata.sizes` (names from
// tests/viewport-sizes.js), which tests/responsive.spec.js reads and loops
// over internally (one test.step per size). This keeps the reported test
// count small: a behavior is one test that checks several sizes, not one
// test per (behavior, size) pair. See that file for the loop itself, and
// its own comment for why desktop-short is not a duplicate of desktop
// despite sharing a width.
//
// To add engine coverage for V2 (e.g. WebKit for the currently
// Chromium-only projects below), add a project entry with the same
// testMatch/metadata.sizes and a different use.browserName -- no test file
// needs to change.
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  // Sert le contenu statique de public/ pendant l'exécution des tests.
  webServer: {
    command: 'npx serve public -l 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
  projects: [
    {
      // Chromium (default engine, no override): structure + a11y checks
      // don't depend on viewport size, so this runs once.
      name: 'structure-a11y-chromium',
      testMatch: /(structure|accessibility)\.spec\.js/,
    },
    {
      // WebKit (via the iPhone 12 device preset: touch + mobile UA too) at
      // the mobile mockup breakpoint. Kept as its own project: it's a
      // genuinely different engine, not just a different size, from the
      // Chromium project below.
      name: 'responsive-mobile-webkit',
      testMatch: /responsive\.spec\.js/,
      use: { ...devices['iPhone 12'], viewport: SIZES.mobile },
      metadata: { sizes: ['mobile'] },
    },
    {
      // Chromium (default engine, no override): tablet/desktop/desktop-short
      // all run the same engine, only the size changes between them, so
      // they're one project -- tests/responsive.spec.js loops over the
      // three sizes below internally instead of Playwright fanning this
      // project's tests out three times.
      name: 'responsive-chromium',
      testMatch: /responsive\.spec\.js/,
      metadata: { sizes: ['tablet', 'desktop', 'desktop-short'] },
    },
  ],
});
