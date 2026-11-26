/* eslint-disable testing-library/await-async-utils, testing-library/prefer-screen-queries, no-restricted-syntax, jest/valid-expect */
/**
 * frontend/tests/visual/gold-reference-match.spec.js
 *
 * Automated computed-style, accessibility, and responsive verification for the
 * Gold Wallet subsystem against Canonical Reference Frames 01, 02, and 03
 * (Dense Table, Form, Dashboard Variant B), plus purchasing-power chart a11y.
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupGoldMocks } = require('./fixtures/goldMocks');

const ACCENT = 'rgb(20, 184, 166)';
const INK = 'rgb(13, 14, 16)';
const SURFACE = 'rgb(26, 28, 32)';
const TEXT = 'rgb(242, 243, 245)';

async function gotoAndSettle(page, path) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    try {
      // Wait for the React root to actually mount each page before checking
      // loaders; on a cold webServer the first HTML can arrive before bundles.
      await page.locator('.gold-page-container, .purchasing-power-container')
        .first()
        .waitFor({ state: 'visible', timeout: 8000 });
      await page.locator('.fs-loading, .fs-skeleton')
        .waitFor({ state: 'detached', timeout: 8000 })
        .catch(() => {});
      await page.waitForTimeout(300);
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(500);
    }
  }
}

async function hasPageOverflow(page) {
  return page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
}

test.describe('Phase 8A: Gold Wallet Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupGoldMocks(page);
  });

  test('1. /gold-wallet conforms to Reference Frame 01 (Variant B — Dense Table) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/gold-wallet');

    await expect(page.locator('.gold-log-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Gold Wallet Log', level: 1 })).toBeVisible();

    const tableWrap = page.locator('.gold-log-page .gold-table-wrap');
    await expect(tableWrap).toBeVisible();
    const tableBg = await tableWrap.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(tableBg).toBe(SURFACE);
    const tableRadius = await tableWrap.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(tableRadius).toBeLessThanOrEqual(8);

    const numericCell = page.locator('.gold-table td.fs-num').first();
    await expect(numericCell).toBeVisible();
    const numericFont = await numericCell.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { family: style.fontFamily, variant: style.fontVariantNumeric };
    });
    expect(numericFont.family.toLowerCase()).toContain('plex sans');
    expect(numericFont.variant).toContain('tabular-nums');

    const primaryBtn = page.locator('.gold-header .fs-btn-primary');
    await expect(primaryBtn).toBeVisible();
    const primaryBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const primaryColor = await primaryBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(primaryBg).toBe(ACCENT);
    expect(primaryColor).toBe(INK);
    const primaryRadius = await primaryBtn.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(primaryRadius).toBeLessThanOrEqual(8);
  });

  test('2. /gold-wallet active filter uses accent with ink text and neutral status badges', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/gold-wallet');

    const activeFilter = page.locator('.gold-filter-btn.is-active');
    await expect(activeFilter).toHaveText('All');
    const filterBg = await activeFilter.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const filterColor = await activeFilter.evaluate((el) => window.getComputedStyle(el).color);
    expect(filterBg).toBe(ACCENT);
    expect(filterColor).toBe(INK);

    const badges = page.locator('.gold-table .fs-badge');
    expect(await badges.count()).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < await badges.count(); i += 1) {
      const classes = await badges.nth(i).getAttribute('class');
      expect(classes).toContain('fs-badge');
      expect(classes).not.toContain('fs-badge--positive');
      expect(classes).not.toContain('fs-badge--negative');
      expect(classes).not.toContain('fs-badge--warning');
    }

    await page.getByRole('button', { name: 'Hold', exact: true }).click();
    await expect(page.locator('.gold-filter-active-note')).toHaveText('Showing hold gold entries only');
    await expect(page.locator('.gold-filter-btn.is-active')).toHaveText('Hold');
  });

  test('3. /gold-wallet/summary conforms to Reference Frame 03 (Variant B — KPI grid) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/gold-wallet/summary');

    await expect(page.locator('.gold-summary-page')).toBeVisible({ timeout: 10000 });
    const kpiCards = page.locator('.gold-kpi-card');
    await expect(kpiCards).toHaveCount(6);
    const kpiBg = await kpiCards.first().evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(kpiBg).toBe(SURFACE);
    const kpiRadius = await kpiCards.first().evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(kpiRadius).toBeLessThanOrEqual(8);

    const kpiValue = page.locator('.gold-kpi-value.fs-num').first();
    const kpiFont = await kpiValue.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(kpiFont.toLowerCase()).toContain('plex sans');

    const delta = page.locator('.gold-kpi-card .fs-delta');
    await expect(delta).toBeVisible();
    const deltaValue = await page.locator('.gold-kpi-card .fs-delta-value').innerText();
    expect(deltaValue).toMatch(/^[+\-\u2212]?\d+\.\d{2}%$/);
    await expect(page.locator('.gold-kpi-card .fs-delta-label')).toHaveText(/Gain|Loss/);

    const holdHeaders = page.locator('.gold-table').first().locator('thead th');
    await expect(holdHeaders).toHaveCount(8);
  });

  test('4. /gold-wallet/new conforms to Reference Frame 02 (Variant B — Form) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/gold-wallet/new');

    await expect(page.locator('.gold-form-page')).toBeVisible({ timeout: 10000 });
    const formCard = page.locator('.gold-form-card');
    await expect(formCard).toBeVisible();
    const formBg = await formCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(formBg).toBe(SURFACE);
    const formRadius = await formCard.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(formRadius).toBeLessThanOrEqual(8);

    await expect(page.locator('.gold-form-page .fs-btn-primary')).toHaveCount(1);
    const submitBtn = page.locator('.gold-submit-btn');
    const submitBg = await submitBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const submitColor = await submitBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(submitBg).toBe(ACCENT);
    expect(submitColor).toBe(INK);

    const cancelLink = page.locator('.gold-cancel-link');
    await expect(cancelLink).toHaveText('Cancel');
    expect(await cancelLink.getAttribute('class')).toContain('fs-btn-secondary');

    await expect(page.locator('#gold-date')).toBeVisible();
    await expect(page.locator('label[for="gold-item"]')).toHaveText('Item Description');
  });

  test('5. /gold-wallet/new renders inline validation and sold-only fields', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/gold-wallet/new');

    await page.locator('.gold-submit-btn').click();
    await expect(page.locator('#gold-item')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#gold-item-error')).toHaveText('Item Description is required.');
    await expect(page.locator('.gold-form-error-summary')).toBeVisible();

    await expect(page.locator('#gold-sellingPrice')).toHaveCount(0);
    await page.locator('#gold-status').selectOption('sold');
    await expect(page.locator('#gold-sellingPrice')).toBeVisible();
    await expect(page.locator('#gold-sellingDate')).toBeVisible();
    await expect(page.locator('#gold-destinationAccount')).toBeVisible();
  });

  test('6. Gold Wallet routes conform to D19 compact-expand cards at <= 768px', async ({ page }) => {
    for (const width of [768, 480, 390]) {
      await page.setViewportSize({ width, height: 800 });

      await gotoAndSettle(page, '/gold-wallet');
      await expect(page.locator('.gold-desktop-table')).toBeHidden();
      const logCards = page.locator('.gold-mobile-cards').first();
      await expect(logCards).toBeVisible();
      const logExpander = logCards.locator('.gold-card-expander-btn').first();
      const logBox = await logExpander.boundingBox();
      expect(logBox.width).toBeGreaterThanOrEqual(44);
      expect(logBox.height).toBeGreaterThanOrEqual(44);

      await logExpander.click();
      const logDrawer = logCards.locator('.gold-card-expanded').first();
      await expect(logDrawer).toBeVisible();
      for (const field of ['Date', 'Item', 'Karat', 'Weight', 'Price/g', 'Price', 'Paid', 'Taxes/Fees', 'Cost/g', 'Selling Price', 'Gain', 'Status']) {
        await expect(logDrawer).toContainText(field);
      }
      expect(await hasPageOverflow(page), `Log page horizontal scroll at ${width}px`).toBe(false);

      await gotoAndSettle(page, '/gold-wallet/summary');
      await expect(page.locator('.gold-desktop-table')).toBeHidden();
      const summaryCards = page.locator('[data-testid="gold-summary-mobile-card-list"]');
      await expect(summaryCards).toBeVisible();
      const summaryExpander = summaryCards.locator('.gold-card-expander-btn').first();
      const summaryBox = await summaryExpander.boundingBox();
      expect(summaryBox.width).toBeGreaterThanOrEqual(44);
      expect(summaryBox.height).toBeGreaterThanOrEqual(44);

      await summaryExpander.click();
      const summaryDrawer = summaryCards.locator('.gold-card-expanded').first();
      await expect(summaryDrawer).toBeVisible();
      for (const field of ['Karat', 'Total Weight (g)', '24K Equiv. Weight', 'Total Paid', 'Current Price/g', 'Current Market Value', '24K Std. Value', 'P/L', 'Rate of Change']) {
        await expect(summaryDrawer).toContainText(field);
      }
      expect(await hasPageOverflow(page), `Summary page horizontal scroll at ${width}px`).toBe(false);
    }
  });

  test('7. documented wrappers and purchasing-power chart preserve tokenized accessible states', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    await gotoAndSettle(page, '/gold-wallet');
    const logWrap = page.locator('.gold-log-page .gold-table-wrap');
    await expect(logWrap).toBeVisible();
    expect(await logWrap.evaluate((el) => window.getComputedStyle(el).overflowX)).toBe('auto');

    await gotoAndSettle(page, '/gold-wallet/summary');
    const summaryWrap = page.locator('.gold-summary-page .gold-table-wrap').first();
    await expect(summaryWrap).toBeVisible();
    expect(await summaryWrap.evaluate((el) => window.getComputedStyle(el).overflowX)).toBe('auto');

    await gotoAndSettle(page, '/analytics/purchasing-power');
    await expect(page.locator('.purchasing-power-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.pp-kpi-card')).toHaveCount(4);

    const canvasWrapper = page.locator('[data-testid="chart-canvas-wrapper"]');
    const canvasLabel = await canvasWrapper.getAttribute('aria-label');
    expect(canvasLabel).toContain('Purchasing Power in 24K Gold (Grams)');
    await expect(page.locator('[data-testid="chart-summary"]')).toContainText('Purchasing Power in 24K Gold (Grams) chart showing:');
    await expect(page.locator('[data-testid="purchasing-power-data-table"] caption'))
      .toContainText('Purchasing Power in 24K Gold (Grams) by date');

    const activeToggle = page.locator('.pp-toggle-btn.active');
    await expect(activeToggle).toHaveCount(1);
    const toggleBg = await activeToggle.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const toggleColor = await activeToggle.evaluate((el) => window.getComputedStyle(el).color);
    expect(toggleBg).toBe(ACCENT);
    expect(toggleColor).toBe(INK);

    const trajectory = page.locator('.pp-kpi-card', { hasText: 'Real Trajectory' });
    await expect(trajectory).toHaveCount(1);
    const trajectoryClass = await trajectory.locator('.pp-kpi-value').getAttribute('class');
    expect(trajectoryClass).toContain('fs-num');
    expect(trajectoryClass).not.toContain('fs-delta');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.pp-currency-desktop')).toBeHidden();
    await expect(page.locator('[data-testid="currency-mobile-card-list"]')).toBeVisible();
    const ppExpander = page.locator('.pp-card-expander-btn').first();
    const ppBox = await ppExpander.boundingBox();
    expect(ppBox.width).toBeGreaterThanOrEqual(44);
    expect(ppBox.height).toBeGreaterThanOrEqual(44);
    expect(await hasPageOverflow(page), 'Purchasing-power horizontal scroll at 390px').toBe(false);
  });

  test('8. interactive touch targets >= 44px and visible focus rings', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/gold-wallet');

    const primaryBtn = page.locator('.gold-header .fs-btn-primary');
    const primaryBox = await primaryBtn.boundingBox();
    expect(primaryBox.height).toBeGreaterThanOrEqual(44);
    expect(primaryBox.width).toBeGreaterThanOrEqual(44);

    const rowAction = page.locator('.gold-table .gold-icon-btn').first();
    const rowActionBox = await rowAction.boundingBox();
    expect(rowActionBox.height).toBeGreaterThanOrEqual(32);
    expect(rowActionBox.width).toBeGreaterThanOrEqual(32);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const expander = page.locator('.gold-mobile-cards .gold-card-expander-btn').first();
    const expanderBox = await expander.boundingBox();
    expect(expanderBox.height).toBeGreaterThanOrEqual(44);
    expect(expanderBox.width).toBeGreaterThanOrEqual(44);

    await expander.click();
    const mobileEdit = page.locator('.gold-card-expanded .fs-btn-secondary').first();
    const mobileDelete = page.locator('.gold-card-expanded .gold-icon-btn-danger').first();
    const mobileEditBox = await mobileEdit.boundingBox();
    const mobileDeleteBox = await mobileDelete.boundingBox();
    expect(mobileEditBox.height).toBeGreaterThanOrEqual(44);
    expect(mobileDeleteBox.height).toBeGreaterThanOrEqual(44);

    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/gold-wallet/new');
    const cancelLink = page.locator('.gold-cancel-link');
    await cancelLink.focus();
    await page.keyboard.press('Tab');
    const submitBtn = page.locator('.gold-submit-btn');
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
    expect(outlineInfo.outlineColor).toBe(TEXT);
  });
});
