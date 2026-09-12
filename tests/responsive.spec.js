// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Responsive tests for the Coming Soon page (GGG-7).
 * mobile (390px) and desktop (1440px) match the validated mockup (GGG-8).
 * tablet (768px) has no dedicated mockup: it's a robustness check (no
 * breakage/overflow/overlap), not a pixel-perfect match — per project
 * policy (agents/guidelines.md, Tests section: correct display at any
 * screen width between mobile and desktop).
 */

test.describe('Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('no horizontal overflow', async ({ page }) => {
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    // 1px tolerance for sub-pixel rounding.
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('key elements stay within the viewport', async ({ page }) => {
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

  test('the wordmark and tagline do not overlap', async ({ page }) => {
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

  test('corner sparkles: 4 on desktop, 2 on mobile and tablet', async ({ page }, testInfo) => {
    const expected = testInfo.project.name === 'desktop' ? 4 : 2;
    await expect(page.getByTestId('corner-sparkle')).toHaveCount(expected);
  });

  test('the central content stays horizontally centered', async ({ page }) => {
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
