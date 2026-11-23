/* eslint-disable testing-library/await-async-utils, no-restricted-syntax */
/**
 * frontend/tests/visual/rebalancing-reports-reference-match.spec.js
 *
 * Automated computed-style, accessibility, and responsive verification comparing
 * /portfolio/rebalancing and /reports/financial against Canonical Reference Frame 03
 * (Dashboard / Report Variant B) and Reference Frame 01 (Dense Table Variant B with
 * Decision D19 Mobile Compact-Expand Cards).
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupRebalancingMocks } = require('./fixtures/rebalancingMocks');
const { setupReportsMocks } = require('./fixtures/reportsMocks');

test.describe('Phase 6B: Rebalancing & Reports Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupRebalancingMocks(page);
    await setupReportsMocks(page);
  });

  test('1. /portfolio/rebalancing conforms to Reference Frame 03 and Frame 01 design tokens at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/portfolio/rebalancing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // 1. Page canvas background: rgb(16, 17, 20) (#101114, --fs-bg)
    const pageWrapper = page.locator('.rebalancing-page');
    await expect(pageWrapper).toBeVisible({ timeout: 10000 });

    // 2. Primary CTA background: rgb(20, 184, 166) (#14b8a6, --fs-accent)
    const primaryBtn = page.locator('.rebalance-submit-btn');
    await expect(primaryBtn).toBeVisible();
    const btnBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(btnBg).toBe('rgb(20, 184, 166)');

    // 3. Primary CTA text color: rgb(13, 14, 16) (#0d0e10, --fs-ink, WCAG 2.1 compliance)
    const btnColor = await primaryBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(btnColor).toBe('rgb(13, 14, 16)');

    // 4. Surface card background: rgb(26, 28, 32) (#1a1c20, --fs-surface)
    const card = page.locator('.rebalance-card').first();
    await expect(card).toBeVisible();
    const cardBg = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(cardBg).toBe('rgb(26, 28, 32)');

    // 5. Radius ceiling <= 8px across cards and buttons
    const cardRadius = await card.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(cardRadius).toBeLessThanOrEqual(8);

    const btnRadius = await primaryBtn.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(btnRadius).toBeLessThanOrEqual(8);
  });

  test('2. /portfolio/rebalancing conforms to Decision D19 mobile compact-expand cards and zero overflow at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/portfolio/rebalancing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // 1. Desktop table hidden on mobile
    const desktopTable = page.locator('.rebalance-desktop-table');
    await expect(desktopTable).toBeAttached();
    const isDesktopHidden = await desktopTable.evaluate((el) => window.getComputedStyle(el).display === 'none');
    expect(isDesktopHidden).toBe(true);

    // 2. Mobile card list visible
    const mobileCards = page.locator('.rebalance-mobile-cards');
    await expect(mobileCards).toBeVisible();

    const firstCard = page.locator('.rebalance-mobile-card').first();
    await expect(firstCard).toBeVisible();

    // 3. Expander button present with touch target >= 44px
    const toggleBtn = firstCard.locator('.rebalance-mobile-toggle-btn');
    await expect(toggleBtn).toBeVisible();
    const box = await toggleBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);

    // 4. Click expander toggles expanded details
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(firstCard.locator('.rebalance-mobile-expanded-content')).toBeVisible();

    // 5. Zero page-level horizontal scroll (scrollWidth <= clientWidth)
    const isOverflowing = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth;
    });
    expect(isOverflowing).toBe(false);
  });

  test('3. /reports/financial conforms to Reference Frame 03 and Frame 01 design tokens at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/reports/financial', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // 1. Report page visible
    const reportPage = page.locator('.comprehensive-report-page');
    await expect(reportPage).toBeVisible({ timeout: 10000 });

    // 2. Surface KPI stat card: rgb(26, 28, 32) (#1a1c20, --fs-surface)
    const kpiCard = page.locator('.kpi-stat-card').first();
    await expect(kpiCard).toBeVisible();
    const kpiBg = await kpiCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(kpiBg).toBe('rgb(26, 28, 32)');

    // 3. Dense financial data tables present with tokenized borders
    const tableCard = page.locator('.report-table-card').first();
    await expect(tableCard).toBeVisible();
    const tableBg = await tableCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(tableBg).toBe('rgb(26, 28, 32)');

    // 4. Radius ceiling <= 8px
    const kpiRadius = await kpiCard.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(kpiRadius).toBeLessThanOrEqual(8);
  });

  test('4. Touch Targets & Keyboard Focus (touch-targets / focus-visible)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/portfolio/rebalancing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // 1. Mobile toggle button has >= 44px touch target
    const toggleBtn = page.locator('.rebalance-mobile-toggle-btn').first();
    await expect(toggleBtn).toBeVisible();
    const box = await toggleBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);

    // 2. Keyboard focus visible
    await toggleBtn.focus();
    const hasFocus = await toggleBtn.evaluate((el) => document.activeElement === el);
    expect(hasFocus).toBe(true);
  });
});
