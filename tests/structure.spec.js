// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Structural tests for the Coming Soon page (GGG-7), based on the validated
 * mockup (design/mockups/GGG-8_coming-soon/desktop.html + mobile.html).
 *
 * data-testid contract expected from the Developer (GGG-4) for purely
 * decorative elements with no otherwise-identifiable text:
 *   - [data-testid="monogram"]        double-circle "GGG" medallion
 *   - [data-testid="wax-seal"]        "GGG" wax seal
 *   - [data-testid="lace-divider"]    lace divider (SVG)
 *   - [data-testid="sparkle-accent"]  the standalone sparkle under the medallion
 *   - [data-testid="corner-sparkle"]  each decorative corner sparkle
 * Elements carrying identifiable text (wordmark, tagline, body copy, badge,
 * footer) are targeted by their role/text, no data-testid needed. Note: the
 * page content itself is in French (site francophone, V1 language policy —
 * see agents/guidelines.md), so the strings asserted below are in French on
 * purpose.
 */

test.describe('Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('single <h1> containing the wordmark', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("Girls Girl's Grimoire");
  });

  test('the "GGG" monogram is present', async ({ page }) => {
    const monogram = page.getByTestId('monogram');
    await expect(monogram).toBeVisible();
    await expect(monogram).toContainText('GGG');
  });

  test('the wax seal is present', async ({ page }) => {
    const seal = page.getByTestId('wax-seal');
    await expect(seal).toBeVisible();
    await expect(seal).toContainText('GGG');
  });

  test('the "Bientôt disponible" badge is present', async ({ page }) => {
    await expect(page.getByText('Bientôt disponible', { exact: false })).toBeVisible();
  });

  test('the tagline matches the validated copy', async ({ page }) => {
    await expect(
      page.getByText('Le grimoire moderne des filles pour un quotidien plus doux')
    ).toBeVisible();
  });

  test('the body copy matches the validated copy', async ({ page }) => {
    await expect(page.getByText(/moins de\s*50\s*€/)).toBeVisible();
  });

  test('the footer contains the copyright notice', async ({ page }) => {
    await expect(page.getByText("© 2026 Girls Girl's Grimoire")).toBeVisible();
  });

  test('the lace divider is present', async ({ page }) => {
    await expect(page.getByTestId('lace-divider')).toBeVisible();
  });

  test('the standalone sparkle under the medallion is present', async ({ page }) => {
    await expect(page.getByTestId('sparkle-accent')).toBeVisible();
  });

  test('decorative corner sparkles are present (4 desktop / 2 mobile / 2 tablet)', async ({ page }, testInfo) => {
    const sparkles = page.getByTestId('corner-sparkle');
    const expected = testInfo.project.name === 'desktop' ? 4 : 2;
    await expect(sparkles).toHaveCount(expected);
  });

  test('Google Fonts are loaded, with a serif fallback', async ({ page }) => {
    const fontLink = page.locator('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
    await expect(fontLink).toHaveCount(1);
    const href = await fontLink.getAttribute('href');
    expect(href).toContain('Playfair+Display');
    expect(href).toContain('Cormorant+Garamond');

    const h1FontFamily = await page
      .locator('h1')
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(h1FontFamily.toLowerCase()).toContain('serif');
  });
});
