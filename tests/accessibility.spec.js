// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

/**
 * Accessibility tests for the Coming Soon page (GGG-7): automated WCAG 2.1
 * AA audit via axe-core (contrast included), plus a few targeted checks
 * (lang, title, heading hierarchy, decorative elements hidden from screen
 * readers). None of these depend on viewport size, so this file runs once
 * (project `structure-a11y-chromium`, see playwright.config.js — GGG-12).
 * See tests/structure.spec.js for the data-testid contract.
 */

/** @param {import('@playwright/test').Locator} locator */
async function isHiddenFromScreenReaders(locator) {
  return locator.evaluate((node) => {
    const target = node.matches('[aria-hidden], [role]')
      ? node
      : node.querySelector('[aria-hidden], [role="presentation"]');
    if (!target) return false;
    return target.getAttribute('aria-hidden') === 'true' || target.getAttribute('role') === 'presentation';
  });
}

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('axe-core audit: no WCAG 2.1 AA violations (contrast included)', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('<html lang="fr">', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  });

  test('<title> is present and non-empty', async ({ page }) => {
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('single <h1>, no heading level skipped', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
    const levels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((el) => Number(el.tagName[1]))
    );
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  test('decorations (standalone sparkle, lace divider) are hidden from screen readers', async ({ page }) => {
    for (const testId of ['sparkle-accent', 'lace-divider']) {
      const hidden = await isHiddenFromScreenReaders(page.getByTestId(testId));
      expect(hidden, `${testId} should be hidden from screen readers (aria-hidden or role="presentation")`).toBeTruthy();
    }
  });

  test('corner sparkles are hidden from screen readers', async ({ page }) => {
    const corners = page.getByTestId('corner-sparkle');
    const count = await corners.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const hidden = await isHiddenFromScreenReaders(corners.nth(i));
      expect(hidden, `corner-sparkle #${i} should be hidden from screen readers`).toBeTruthy();
    }
  });

  test('any <img> present has an alt attribute', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      await expect(images.nth(i)).toHaveAttribute('alt', /.*/);
    }
  });
});
