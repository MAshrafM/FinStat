/* eslint-disable testing-library/await-async-utils, testing-library/prefer-screen-queries, no-restricted-syntax, jest/valid-expect */
/**
 * frontend/tests/visual/mutual-funds-reference-match.spec.js
 *
 * Automated computed-style, accessibility, and responsive verification for the
 * Mutual Funds subsystem against Canonical Reference Frames 01, 02, and 03
 * (Dense Table, Form, Dashboard Variant B).
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupMutualFundMocks } = require('./fixtures/mutualFundsMocks');

test.describe('Phase 7C: Mutual Funds Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupMutualFundMocks(page);
  });

  test('1. /mutual-funds conforms to Reference Frame 01 (Variant B — Dense Table) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/mutual-funds', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const pageContainer = page.locator('.mf-page-container');
    await expect(pageContainer).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Mutual Fund Log', level: 1 })).toBeVisible();

    const tableWrap = page.locator('.mf-table-wrap');
    await expect(tableWrap).toBeVisible();

    const tableBg = await tableWrap.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(tableBg).toBe('rgb(26, 28, 32)');

    const containerRadius = await tableWrap.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(containerRadius).toBeLessThanOrEqual(8);

    // Monetary figures use the sans stack with tabular numerals (D16).
    const numericCell = page.locator('.mf-table td.fs-num').first();
    await expect(numericCell).toBeVisible();
    const numericFont = await numericCell.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { family: style.fontFamily, variant: style.fontVariantNumeric };
    });
    expect(numericFont.family.toLowerCase()).toContain('plex sans');
    expect(numericFont.variant).toContain('tabular-nums');

    // Fund codes use the mono stack.
    const codeCell = page.locator('.mf-table .fs-code').first();
    const codeFont = await codeCell.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(codeFont.toLowerCase()).toContain('mono');

    const containerPadding = await pageContainer.evaluate((el) => window.getComputedStyle(el).paddingTop);
    expect(parseFloat(containerPadding)).toBeGreaterThan(0);

    const primaryBtn = page.locator('.mf-header .fs-btn-primary');
    await expect(primaryBtn).toBeVisible();
    const btnRadius = await primaryBtn.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(btnRadius).toBeLessThanOrEqual(8);
  });

  test('2. /mutual-funds filter state uses accent with ink text and neutral transaction badges', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/mutual-funds', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const activeFilter = page.locator('.mf-filter-btn.is-active');
    await expect(activeFilter).toHaveText('All Types');
    const filterBg = await activeFilter.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const filterColor = await activeFilter.evaluate((el) => window.getComputedStyle(el).color);
    expect(filterBg).toBe('rgb(20, 184, 166)');
    expect(filterColor).toBe('rgb(13, 14, 16)');

    const badges = page.locator('.mf-table .fs-badge');
    expect(await badges.count()).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < (await badges.count()); i += 1) {
      const classes = await badges.nth(i).getAttribute('class');
      expect(classes).toContain('fs-badge');
      expect(classes).not.toContain('fs-badge--warning');
      expect(classes).not.toContain('fs-badge--positive');
      expect(classes).not.toContain('fs-badge--negative');
    }

    await page.getByRole('button', { name: 'Sell', exact: true }).click();
    const activeNote = page.locator('.mf-filter-active-note');
    await expect(activeNote).toBeVisible();
    await expect(activeNote).toHaveText('Showing Sell transactions only');
  });

  test('3. /mutual-funds/summary conforms to Reference Frame 03 (Variant B — KPI grid) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/mutual-funds/summary', { waitUntil: 'domcontentloaded' });
    await page.locator('.fs-loading').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);

    await expect(page.locator('.mf-summary-page')).toBeVisible({ timeout: 10000 });
    const kpiCards = page.locator('.mf-kpi-card');
    await expect(kpiCards).toHaveCount(5);

    const kpiBg = await kpiCards.first().evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(kpiBg).toBe('rgb(26, 28, 32)');
    const kpiRadius = await kpiCards.first().evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(kpiRadius).toBeLessThanOrEqual(8);

    const kpiValue = page.locator('.mf-kpi-value.fs-num').first();
    const kpiFont = await kpiValue.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(kpiFont.toLowerCase()).toContain('plex sans');

    const delta = page.locator('.mf-kpi-card .fs-delta');
    await expect(delta).toBeVisible();
    const deltaValue = await page.locator('.mf-kpi-card .fs-delta-value').innerText();
    expect(deltaValue).toMatch(/^[+−−]?\d+\.\d{2}%$/);
    await expect(page.locator('.mf-kpi-card .fs-delta-label')).toHaveText(/Gain|Loss/);

    const unavailableBadge = page.locator('.mf-table .fs-badge', { hasText: 'Price Unavailable' });
    await expect(unavailableBadge).toBeVisible();
    const unavailableClasses = await unavailableBadge.getAttribute('class');
    expect(unavailableClasses).toContain('fs-badge');
    expect(unavailableClasses).not.toContain('fs-badge--warning');
  });

  test('4. /mutual-funds/new conforms to Reference Frame 02 (Variant B — Form) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/mutual-funds/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await expect(page.locator('.mf-form-page')).toBeVisible({ timeout: 10000 });
    const formCard = page.locator('.mf-form-card');
    await expect(formCard).toBeVisible();

    const formBg = await formCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(formBg).toBe('rgb(26, 28, 32)');
    const formRadius = await formCard.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(formRadius).toBeLessThanOrEqual(8);

    // Exactly one primary CTA; the neutral Cancel action sits beside it.
    await expect(page.locator('.mf-form-page .fs-btn-primary')).toHaveCount(1);
    const submitBtn = page.locator('.mf-submit-btn');
    const submitBg = await submitBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const submitColor = await submitBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(submitBg).toBe('rgb(20, 184, 166)');
    expect(submitColor).toBe('rgb(13, 14, 16)');

    const cancelLink = page.locator('.mf-cancel-link');
    await expect(cancelLink).toHaveText('Cancel');
    const cancelClasses = await cancelLink.getAttribute('class');
    expect(cancelClasses).toContain('fs-btn-secondary');

    await expect(page.locator('#mf-date')).toBeVisible();
    const inputBg = await page.locator('#mf-date').evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(inputBg).toBe('rgb(26, 28, 32)');
  });

  test('5. /mutual-funds/new renders Reference Frame 02 inline validation and disabled/read-only states', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/mutual-funds/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Inline validation on submit.
    await page.locator('.mf-submit-btn').click();
    const nameInput = page.locator('#mf-name');
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#mf-name-error')).toHaveText('Fund Name is required.');
    await expect(page.locator('.mf-form-error-summary')).toBeVisible();

    // Read-only auto-fill after a successful code lookup.
    await page.locator('#mf-code').fill('AZO');
    await expect(page.locator('.mf-field-hint', { hasText: 'Fund found in database.' })).toBeVisible({ timeout: 5000 });
    await expect(nameInput).toHaveAttribute('readonly', '');

    // Coupon auto-calculation and destination disabling under auto-reinvest.
    await page.locator('#mf-type').selectOption('Coupon');
    await expect(page.locator('#mf-units')).toHaveAttribute('readonly', '');
    await page.locator('#mf-auto-reinvest').check();
    await expect(page.locator('#account-selector-destinationAccount')).toBeDisabled();
  });

  test('6. Mutual Funds routes conform to Decision D19 mobile compact-expand cards at <= 768px', async ({ page }) => {
    for (const width of [768, 480, 390]) {
      await page.setViewportSize({ width, height: 800 });

      await page.goto('/mutual-funds', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      await expect(page.locator('.mf-desktop-table')).toBeHidden();
      const logCards = page.locator('.mf-mobile-cards').first();
      await expect(logCards).toBeVisible();

      const logExpander = logCards.locator('.mf-card-expander-btn').first();
      const logBox = await logExpander.boundingBox();
      expect(logBox.width).toBeGreaterThanOrEqual(44);
      expect(logBox.height).toBeGreaterThanOrEqual(44);

      await logExpander.click();
      const logDrawer = logCards.locator('.mf-card-expanded').first();
      await expect(logDrawer).toBeVisible();
      await expect(logDrawer).toContainText('Date');
      await expect(logDrawer).toContainText('Units');
      await expect(logDrawer).toContainText('Price');
      await expect(logDrawer).toContainText('Fees');

      const logDelete = logDrawer.locator('.mf-icon-btn-danger');
      const logDeleteBox = await logDelete.boundingBox();
      expect(logDeleteBox.height).toBeGreaterThanOrEqual(44);

      let hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalScroll, `Log page horizontal scroll at ${width}px`).toBe(false);

      await page.goto('/mutual-funds/summary', { waitUntil: 'domcontentloaded' });
      await page.locator('.fs-loading').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(400);
      await expect(page.locator('.mf-desktop-table')).toBeHidden();
      const summaryCards = page.locator('[data-testid="mf-summary-mobile-card-list"]');
      await expect(summaryCards).toBeVisible();

      const summaryExpander = summaryCards.locator('.mf-card-expander-btn').first();
      const summaryBox = await summaryExpander.boundingBox();
      expect(summaryBox.width).toBeGreaterThanOrEqual(44);
      expect(summaryBox.height).toBeGreaterThanOrEqual(44);

      await summaryExpander.click();
      const summaryDrawer = summaryCards.locator('.mf-card-expanded').first();
      await expect(summaryDrawer).toBeVisible();
      await expect(summaryDrawer).toContainText('Current Units');
      await expect(summaryDrawer).toContainText('Avg. Price Paid');
      await expect(summaryDrawer).toContainText('Total Value (Cost Basis)');
      await expect(summaryDrawer).toContainText('Total Coupons');
      await expect(summaryDrawer).toContainText('Value (Excluding Coupons)');
      await expect(summaryDrawer).toContainText('Current Price');

      hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalScroll, `Summary page horizontal scroll at ${width}px`).toBe(false);
    }
  });

  test('7. Mutual Funds table containers use horizontal scroll per waiver W-7C-1', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto('/mutual-funds', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const logWrap = page.locator('.mf-table-wrap');
    await expect(logWrap).toBeVisible();
    const logOverflow = await logWrap.evaluate((el) => window.getComputedStyle(el).overflowX);
    expect(logOverflow).toBe('auto');

    await page.goto('/mutual-funds/summary', { waitUntil: 'domcontentloaded' });
    await page.locator('.fs-loading').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);
    const summaryWrap = page.locator('.mf-table-wrap');
    await expect(summaryWrap).toBeVisible();
    const summaryOverflow = await summaryWrap.evaluate((el) => window.getComputedStyle(el).overflowX);
    expect(summaryOverflow).toBe('auto');
  });

  test('8. interactive touch targets >= 44px and visible focus rings', async ({ page }) => {
    // Desktop primary CTA and inline row actions.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/mutual-funds', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const primaryBtn = page.locator('.mf-header .fs-btn-primary');
    const btnBox = await primaryBtn.boundingBox();
    expect(btnBox.height).toBeGreaterThanOrEqual(44);
    expect(btnBox.width).toBeGreaterThanOrEqual(44);

    const rowAction = page.locator('.mf-table .mf-icon-btn').first();
    const rowActionBox = await rowAction.boundingBox();
    expect(rowActionBox.height).toBeGreaterThanOrEqual(32);
    expect(rowActionBox.width).toBeGreaterThanOrEqual(32);

    // Mobile expander and drawer action targets.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const expander = page.locator('.mf-mobile-cards .mf-card-expander-btn').first();
    const expanderBox = await expander.boundingBox();
    expect(expanderBox.height).toBeGreaterThanOrEqual(44);
    expect(expanderBox.width).toBeGreaterThanOrEqual(44);

    await expander.click();
    const mobileEdit = page.locator('.mf-card-expanded .fs-btn-secondary').first();
    const mobileDelete = page.locator('.mf-card-expanded .mf-icon-btn-danger').first();
    const mobileEditBox = await mobileEdit.boundingBox();
    const mobileDeleteBox = await mobileDelete.boundingBox();
    expect(mobileEditBox.height).toBeGreaterThanOrEqual(44);
    expect(mobileDeleteBox.height).toBeGreaterThanOrEqual(44);

    // Real keyboard Tab produces a visible focus-visible ring.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/mutual-funds/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const cancelLink = page.locator('.mf-cancel-link');
    await cancelLink.focus();
    await page.keyboard.press('Tab');
    const submitBtn = page.locator('.mf-submit-btn');
    await expect(submitBtn).toBeFocused();

    const outlineInfo = await submitBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth) || 0,
        outlineColor: style.outlineColor,
      };
    });
    expect(outlineInfo.outlineStyle).toBe('solid');
    expect(outlineInfo.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(outlineInfo.outlineColor).toBe('rgb(242, 243, 245)');
  });
});
