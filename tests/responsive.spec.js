// @ts-check
const { test, expect } = require('@playwright/test');
const SIZES = require('./viewport-sizes');

/**
 * Responsive tests for the Coming Soon page (GGG-7; restructured on GGG-12
 * to cut redundant test executions across viewport sizes/engines).
 *
 * Each test below checks exactly one behavior, run once per viewport size
 * the current Playwright project covers -- not once per (behavior,
 * project) pair as before. Which sizes a project covers comes from that
 * project's `metadata.sizes` in playwright.config.js (actual dimensions in
 * tests/viewport-sizes.js); this file never branches on a project's
 * *name* -- adding a size or a browser engine there never requires
 * touching this file. See playwright.config.js's own comment for the full
 * rationale (this split is meant to carry future multi-engine coverage for
 * V2 without rework).
 *
 * See tests/viewport-sizes.js for why desktop-short is checked as its own
 * size rather than skipped as a "duplicate" of desktop (it isn't one: this
 * page's CSS scales with vmin, so a shorter height at the same width
 * genuinely changes rendered sizes/positions).
 */

/**
 * Runs `check` once per viewport size the current project covers,
 * navigating fresh at each size first. One test.step per size keeps a
 * failure traceable to a specific size without a separate top-level test
 * per size.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {() => Promise<void>} check
 */
async function forEachCoveredSize(page, testInfo, check) {
  const sizeNames = testInfo.project.metadata?.sizes;
  if (!Array.isArray(sizeNames) || sizeNames.length === 0) {
    throw new Error(
      `Project "${testInfo.project.name}" runs responsive.spec.js but declares no metadata.sizes in playwright.config.js.`
    );
  }
  for (const sizeName of sizeNames) {
    const size = SIZES[sizeName];
    if (!size) {
      throw new Error(
        `Unknown viewport size "${sizeName}" in project "${testInfo.project.name}"'s metadata.sizes -- check tests/viewport-sizes.js.`
      );
    }
    await test.step(`${sizeName} (${size.width}x${size.height})`, async () => {
      await page.setViewportSize(size);
      await page.goto('/');
      await check();
    });
  }
}

test.describe('Responsive', () => {
  test('no horizontal overflow', async ({ page }, testInfo) => {
    await forEachCoveredSize(page, testInfo, async () => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      // 1px tolerance for sub-pixel rounding.
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  });

  test('no vertical overflow', async ({ page }, testInfo) => {
    await forEachCoveredSize(page, testInfo, async () => {
      const { scrollHeight, clientHeight } = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      // 1px tolerance for sub-pixel rounding.
      expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
    });
  });

  test('key elements stay within the viewport', async ({ page }, testInfo) => {
    await forEachCoveredSize(page, testInfo, async () => {
      const viewport = page.viewportSize();
      expect(viewport).not.toBeNull();
      if (!viewport) return;
      for (const testId of ['monogram', 'wax-seal', 'lace-divider']) {
        const box = await page.getByTestId(testId).boundingBox();
        expect(box, `${testId} should be present and measurable`).not.toBeNull();
        if (box) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        }
      }
    });
  });

  test('the wordmark and tagline do not overlap', async ({ page }, testInfo) => {
    await forEachCoveredSize(page, testInfo, async () => {
      const h1Box = await page.locator('h1').boundingBox();
      const taglineBox = await page
        .getByText('Le grimoire moderne des filles pour un quotidien plus doux')
        .boundingBox();
      expect(h1Box).not.toBeNull();
      expect(taglineBox).not.toBeNull();
      if (h1Box && taglineBox) {
        // In the validated composition, the tagline always sits below the wordmark.
        expect(taglineBox.y).toBeGreaterThanOrEqual(h1Box.y + h1Box.height - 1);
      }
    });
  });

  test('corner sparkles: 4 on desktop widths, 2 on mobile and tablet', async ({ page }, testInfo) => {
    await forEachCoveredSize(page, testInfo, async () => {
      const viewport = page.viewportSize();
      expect(viewport).not.toBeNull();
      if (!viewport) return;
      // Keyed on viewport width (the actual design breakpoint): desktop
      // and desktop-short share it and must share this count, even though
      // they differ on other, height-sensitive checks.
      const expected = viewport.width >= 1440 ? 4 : 2;
      await expect(page.getByTestId('corner-sparkle')).toHaveCount(expected);
    });
  });

  test('the central content stays horizontally centered', async ({ page }, testInfo) => {
    await forEachCoveredSize(page, testInfo, async () => {
      const viewport = page.viewportSize();
      const box = await page.locator('h1').boundingBox();
      expect(viewport).not.toBeNull();
      expect(box).not.toBeNull();
      if (viewport && box) {
        const centerX = box.x + box.width / 2;
        const viewportCenterX = viewport.width / 2;
        // Generous tolerance: approximate centering, not a pixel-perfect
        // value (especially relevant for tablet, which has no mockup).
        expect(Math.abs(centerX - viewportCenterX)).toBeLessThanOrEqual(viewport.width * 0.1);
      }
    });
  });
});
