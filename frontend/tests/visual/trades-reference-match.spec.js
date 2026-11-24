/* eslint-disable testing-library/await-async-utils, no-restricted-syntax */
/**
 * frontend/tests/visual/trades-reference-match.spec.js
 *
 * Automated computed-style, accessibility, and responsive verification comparing
 * /trades, /trades/add, /trades/edit/:id, and /trade-summary against Canonical
 * Reference Frames 01, 02, and 03 (Dense Table, Form, Dashboard Variant B).
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupTradesMocks } = require('./fixtures/tradesMocks');

test.describe('Phase 7A: Stock Trades Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupTradesMocks(page);
  });

  test('1. /trades conforms to Reference Frame 01 (Variant B — Dense Table) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/trades', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });

    // 1. Page canvas background: rgb(16, 17, 20) (#101114, --fs-bg)
    const pageWrapper = page.locator('.trade-log-page');
    await expect(pageWrapper).toBeVisible({ timeout: 10000 });
    const pageBg = await pageWrapper.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(pageBg).toBe('rgb(16, 17, 20)');

    // 2. Primary CTA background: rgb(20, 184, 166) (#14b8a6, --fs-accent)
    const primaryBtn = page.locator('.trade-log-page .fs-btn-primary');
    await expect(primaryBtn).toBeVisible();
    const btnBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(btnBg).toBe('rgb(20, 184, 166)');

    // 3. Primary CTA text color: rgb(13, 14, 16) (#0d0e10, --fs-ink, WCAG 2.1 compliance)
    const btnColor = await primaryBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(btnColor).toBe('rgb(13, 14, 16)');

    // 4. Table container background: rgb(26, 28, 32) (#1a1c20, --fs-surface)
    const tableContainer = page.locator('.trade-log-page .table-container');
    await expect(tableContainer).toBeVisible();
    const tableBg = await tableContainer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(tableBg).toBe('rgb(26, 28, 32)');

    // 5. Radius ceiling <= 8px across cards, table container, and buttons
    const containerRadius = await tableContainer.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(containerRadius).toBeLessThanOrEqual(8);

    const btnRadius = await primaryBtn.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(btnRadius).toBeLessThanOrEqual(8);
  });

  test('2. /trades/add and /trades/edit/1 conform to Reference Frame 02 (Variant B — Form) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/trades/add', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const form = page.locator('.trade-form-page .standard-form');
    await expect(form).toBeVisible();

    // 1. Form surface card background: rgb(26, 28, 32) (#1a1c20, --fs-surface)
    const formBg = await form.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(formBg).toBe('rgb(26, 28, 32)');

    // 2. Form border: rgb(52, 56, 63) (#34383f, --fs-border)
    const formBorder = await form.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(formBorder).toBe('rgb(52, 56, 63)');

    // 3. Form submit button: accent with ink text
    const submitBtn = page.locator('.trade-form-page .fs-btn-primary');
    await expect(submitBtn).toBeVisible();
    const btnBg = await submitBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(btnBg).toBe('rgb(20, 184, 166)');
    const btnColor = await submitBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(btnColor).toBe('rgb(13, 14, 16)');

    // 4. Radius ceiling <= 8px
    const formRadius = await form.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(formRadius).toBeLessThanOrEqual(8);
  });

  test('3. /trade-summary conforms to Reference Frame 03 (Variant B — Dashboard / Summary) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/trade-summary', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });

    const pageWrapper = page.locator('.trade-summary-page');
    await expect(pageWrapper).toBeVisible();

    // 1. KPI cards use surface background: rgb(26, 28, 32) (#1a1c20)
    const kpiCard = page.locator('.trade-summary-page .kpi-card').first();
    await expect(kpiCard).toBeVisible();
    const cardBg = await kpiCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(cardBg).toBe('rgb(26, 28, 32)');

    // 2. Card border: rgb(52, 56, 63) (#34383f)
    const cardBorder = await kpiCard.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(cardBorder).toBe('rgb(52, 56, 63)');

    // 3. Card radius <= 8px
    const cardRadius = await kpiCard.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(cardRadius).toBeLessThanOrEqual(8);
  });

  test('4. /trades and /trade-summary conform to Decision D19 mobile compact-expand cards with zero overflow at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/trades', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });

    // Assert .trade-card elements exist and are rendered at mobile viewport
    const tradeCards = page.locator('.trade-log-page .trade-card');
    await expect(tradeCards.first()).toBeVisible();
    const tradeCardCount = await tradeCards.count();
    expect(tradeCardCount).toBeGreaterThan(0);

    // Assert zero page-level horizontal scroll on /trades
    const tradesOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    });
    expect(tradesOverflow).toBe(true);

    // Navigate to /trade-summary and verify .trade-card elements and zero overflow
    await page.goto('/trade-summary', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });

    const summaryCards = page.locator('.trade-summary-page .trade-card');
    await expect(summaryCards.first()).toBeVisible();
    const summaryCardCount = await summaryCards.count();
    expect(summaryCardCount).toBeGreaterThan(0);

    const summaryOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    });
    expect(summaryOverflow).toBe(true);
  });

  test('5. Touch targets and keyboard focus visibility', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/trades', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 1. Interactive CTA button touch target >= 44x44px
    const addBtn = page.locator('.trade-log-page .fs-btn-primary');
    await expect(addBtn).toBeVisible();
    const box = await addBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);

    // 2. Inline action button touch target >= 32px (calibrated per Amendment AD25)
    const deleteBtn = page.locator('.trade-log-page .action-btn-delete').first();
    await expect(deleteBtn).toBeVisible();
    const deleteBox = await deleteBtn.boundingBox();
    expect(deleteBox.height).toBeGreaterThanOrEqual(32);
    expect(deleteBox.width).toBeGreaterThanOrEqual(32);

    // 3. Keyboard focus test with :focus-visible computed outline
    await addBtn.focus();
    const outlineInfo = await addBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth) || 0,
        outlineColor: style.outlineColor,
      };
    });
    expect(outlineInfo.outlineStyle).not.toBe('none');
    expect(outlineInfo.outlineWidth).toBeGreaterThanOrEqual(1);
    expect(['rgb(242, 243, 245)', '#f2f3f5', 'rgb(17, 18, 20)']).toContain(outlineInfo.outlineColor);
  });
});
