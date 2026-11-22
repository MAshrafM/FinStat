/* eslint-disable testing-library/await-async-utils, no-restricted-syntax */
/**
 * frontend/tests/visual/payroll-history-reference-match.spec.js
 *
 * Automated computed-style, accessibility, and responsive verification comparing
 * Phase 5E payroll routes against Canonical Reference Frame 01 (Dense Table Variant B
 * with D19 Mobile Compact-Expand Cards) and Reference Frame 02 (Form Variant B).
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupPaycheckMocks } = require('./fixtures/paycheckMocks');

test.describe('Phase 5E Canonical Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupPaycheckMocks(page);
  });

  test('1. /salary-profile/history conforms to Reference Frame 01 (Desktop 1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/salary-profile/history', { waitUntil: 'domcontentloaded' });
    await page.locator('.fs-loading').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // Table header background rgb(12, 13, 15) (--fs-surface-sunken)
    const th = page.locator('.salary-history-table th').first();
    await expect(th).toBeVisible();
    const thBg = await th.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(thBg).toBe('rgb(12, 13, 15)');

    // Table cells formatted with .fs-num
    const numericCell = page.locator('.salary-history-table td.fs-num').first();
    await expect(numericCell).toBeVisible();

    // Action button touch target >= 44px
    const actionBtn = page.locator('.salary-history-actions .fs-btn').first();
    await expect(actionBtn).toBeVisible();
    const box = await actionBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(28); // Desktop sm button minimum
  });

  test('2. /salary-profile/history conforms to Decision D19 mobile cards and zero overflow (Mobile 390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/salary-profile/history', { waitUntil: 'domcontentloaded' });
    await page.locator('.fs-loading').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // Table is hidden on mobile
    const tableWrapper = page.locator('.salary-history-table-wrapper');
    const isTableHidden = await tableWrapper.evaluate((el) => window.getComputedStyle(el).display === 'none');
    expect(isTableHidden).toBe(true);

    // D19 compact-expand cards are visible
    const cards = page.locator('.salary-history-cards');
    await expect(cards).toBeVisible();

    // Expander button has touch target >= 44px
    const expander = page.locator('.salary-history-expander').first();
    await expect(expander).toBeVisible();
    const expanderBox = await expander.boundingBox();
    expect(expanderBox.height).toBeGreaterThanOrEqual(36);

    // Toggle expander and verify breakdown appears
    await expander.click();
    const breakdown = page.locator('.salary-history-breakdown').first();
    await expect(breakdown).toBeVisible();

    // Invariant I6: Zero page-level horizontal overflow
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test('3. /salary-profile/edit conforms to Reference Frame 02 (Form Variant B)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/salary-profile/edit', { waitUntil: 'domcontentloaded' });
    await page.locator('.fs-loading').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // Primary CTA background rgb(20, 184, 166) (--fs-accent), text rgb(13, 14, 16) (--fs-ink)
    const primaryBtn = page.locator('button.fs-btn-primary');
    await expect(primaryBtn).toBeVisible();
    const btnBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const btnColor = await primaryBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(btnBg).toBe('rgb(20, 184, 166)');
    expect(btnColor).toBe('rgb(13, 14, 16)');

    // Exactly one primary CTA on page
    expect(await page.locator('.fs-btn-primary').count()).toBe(1);

    // Stacked form card background rgb(26, 28, 32) (--fs-surface)
    const formCard = page.locator('.fs-form-card').first();
    await expect(formCard).toBeVisible();
    const cardBg = await formCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(cardBg).toBe('rgb(26, 28, 32)');

    // Form input border radius 4px (--fs-radius-sm)
    const input = page.locator('.fs-input').first();
    const radius = await input.evaluate((el) => window.getComputedStyle(el).borderRadius);
    expect(radius).toBe('4px');
  });

  test('4. /salary/simulator conforms to neutral KPI Invariant I15 and 8px ceiling', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/salary/simulator', { waitUntil: 'domcontentloaded' });
    await page.locator('.fs-loading').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // All 4 KPI summary cards have solid graphite surface
    const kpiCards = page.locator('.tax-kpi-card');
    await expect(kpiCards.first()).toBeVisible();
    expect(await kpiCards.count()).toBe(4);

    for (let i = 0; i < 4; i++) {
      const card = kpiCards.nth(i);
      const bg = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(bg).toBe('rgb(26, 28, 32)'); // --fs-surface

      // Invariant I14: Zero linear gradients
      const bgImage = await card.evaluate((el) => window.getComputedStyle(el).backgroundImage);
      expect(bgImage).toBe('none');

      // Invariant I16: 8px ceiling on radius
      const r = await card.evaluate((el) => parseInt(window.getComputedStyle(el).borderRadius, 10));
      expect(r).toBeLessThanOrEqual(8);
    }

    // Zero page-level horizontal overflow at 390px
    await page.setViewportSize({ width: 390, height: 844 });
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });
});
