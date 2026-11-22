/* eslint-disable testing-library/await-async-utils, no-restricted-syntax */
/**
 * frontend/tests/visual/portfolio-reference-match.spec.js
 *
 * Automated computed-style, accessibility, and responsive verification comparing
 * /portfolio against Canonical Reference Frame 03 (Dashboard Variant B) and
 * Reference Frame 01 (Dense Table Variant B with D19 Mobile Compact-Expand Cards).
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupPortfolioMocks } = require('./fixtures/portfolioMocks');

test.describe('Phase 6A: Portfolio Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupPortfolioMocks(page);
  });

  test('1. /portfolio conforms to Reference Frame 03 (Dashboard Variant B) design tokens at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .ca-loading-spinner, .dash-loading-spinner, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // 1. Page canvas background: rgb(16, 17, 20) (#101114, --fs-bg)
    const pageWrapper = page.locator('.portfolio-page-wrapper');
    await expect(pageWrapper).toBeVisible({ timeout: 10000 });
    const pageBg = await pageWrapper.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(pageBg).toBe('rgb(16, 17, 20)');

    // 2. Navbar background: rgb(12, 13, 15) (#0c0d0f, --fs-surface-sunken / recessed chrome)
    const navbar = page.locator('.navbar');
    if (await navbar.count() > 0) {
      const navBg = await navbar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(navBg).toBe('rgb(12, 13, 15)');
    }

    // 3. Primary CTA background: rgb(20, 184, 166) (#14b8a6, --fs-accent)
    const primaryBtn = page.locator('.portfolio-header-actions .fs-btn-primary');
    await expect(primaryBtn).toBeVisible();
    const btnBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(btnBg).toBe('rgb(20, 184, 166)');

    // 4. Primary CTA text color: rgb(13, 14, 16) (#0d0e10, --fs-ink, WCAG 2.1 compliance)
    const btnColor = await primaryBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(btnColor).toBe('rgb(13, 14, 16)');

    // 5. KPI card background: rgb(26, 28, 32) (#1a1c20, --fs-surface)
    const kpiCard = page.locator('.kpi-card').first();
    await expect(kpiCard).toBeVisible();
    const kpiBg = await kpiCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(kpiBg).toBe('rgb(26, 28, 32)');

    // 6. Radius ceiling <= 8px across all cards and controls
    const kpiRadius = await kpiCard.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(kpiRadius).toBeLessThanOrEqual(8);

    const btnRadius = await primaryBtn.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(btnRadius).toBeLessThanOrEqual(8);
  });

  test('2. /portfolio conforms to Decision D19 mobile compact-expand cards and zero overflow at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .ca-loading-spinner, .dash-loading-spinner, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    // 1. Desktop table hidden on mobile
    const desktopTable = page.locator('.holdings-desktop-table');
    await expect(desktopTable).toBeAttached();
    const isDesktopHidden = await desktopTable.evaluate((el) => window.getComputedStyle(el).display === 'none');
    expect(isDesktopHidden).toBe(true);

    // 2. Mobile card list visible
    const mobileCards = page.locator('.holdings-mobile-cards');
    await expect(mobileCards).toBeVisible();

    const firstCard = page.locator('.holding-mobile-card').first();
    await expect(firstCard).toBeVisible();

    // 3. Expander button present with touch target >= 44px
    const toggleBtn = firstCard.locator('.holding-mobile-toggle-btn');
    await expect(toggleBtn).toBeVisible();
    const box = await toggleBtn.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);

    // 4. Click expander toggles expanded details
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(firstCard.locator('.holding-mobile-expanded-content')).toBeVisible();

    // 5. Zero page-level horizontal scroll (scrollWidth <= clientWidth)
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);
  });
});
