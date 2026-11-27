/* eslint-disable testing-library/await-async-utils, testing-library/prefer-screen-queries, no-restricted-syntax, jest/valid-expect */
/**
 * frontend/tests/visual/currency-reference-match.spec.js
 *
 * Automated computed-style, chart accessibility, D19 mobile collapse, form validation,
 * and touch-target verification for Phase 8D (/currency, /currency/:id, /currency/new, /currency/edit/:id)
 * against Canonical Reference Frames 01, 02, and 03 (Variant B).
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupCurrencyMocks } = require('./fixtures/currencyMocks');

const CANVAS = 'rgb(16, 17, 20)';
const SURFACE = 'rgb(26, 28, 32)';
const ACCENT = 'rgb(20, 184, 166)';
const INK = 'rgb(13, 14, 16)';

async function gotoAndSettle(page, path, selector = '.curr-page-container') {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    try {
      await page.locator(selector).first().waitFor({ state: 'visible', timeout: 8000 });
      await page.locator('.fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
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

test.describe('Phase 8D: Currency Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupCurrencyMocks(page);
  });

  test('1. /currency @ 1440px dark graphite canvas, flat KPI tiles, single primary CTA, neutral badges, Delta P&L, right-aligned numbers', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/currency', '.curr-log-page');

    const root = page.locator('.curr-log-page');
    expect(await root.evaluate((el) => window.getComputedStyle(el).backgroundColor)).toBe(CANVAS);

    const kpis = page.locator('.curr-kpi-tile');
    await expect(kpis).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      const st = await kpis.nth(i).evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, image: s.backgroundImage, shadow: s.boxShadow, radius: parseFloat(s.borderRadius) };
      });
      expect(st.bg).toBe(SURFACE);
      expect(st.image).toBe('none');
      expect(st.shadow).toBe('none');
      expect(st.radius).toBeLessThanOrEqual(8);
    }

    const primaries = page.locator('.curr-log-page .fs-btn-primary');
    await expect(primaries).toHaveCount(1);
    const ctaStyles = await primaries.first().evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color };
    });
    expect(ctaStyles.bg).toBe(ACCENT);
    expect(ctaStyles.color).toBe(INK);

    const badges = page.locator('.curr-table .fs-badge');
    await expect(badges).toHaveCount(3);
    const numCellAlign = await page.locator('.curr-table td.curr-td-num').first().evaluate((el) =>
      window.getComputedStyle(el).textAlign
    );
    expect(numCellAlign).toBe('right');

    const nameDeco = await page.locator('.curr-table .curr-name-link').first().evaluate((el) =>
      window.getComputedStyle(el).textDecorationLine
    );
    expect(nameDeco).toContain('underline');
    await expect(page.locator('.curr-table .fs-delta-label')).toHaveText(['Gain', 'Loss', 'No change']);
  });

  test('2. /currency @ 390px D19 compact-expand mobile cards and 0px page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndSettle(page, '/currency', '.curr-log-page');

    await expect(page.locator('.curr-table-wrap')).toBeHidden();
    const cards = page.getByTestId('currency-mobile-cards');
    await expect(cards).toBeVisible();

    const firstExpander = cards.locator('.curr-card-expander').first();
    expect(await firstExpander.getAttribute('aria-expanded')).toBe('false');
    await firstExpander.click();
    expect(await firstExpander.getAttribute('aria-expanded')).toBe('true');
    await expect(cards.locator('.curr-card-expanded').first()).toBeVisible();

    expect(await hasPageOverflow(page)).toBe(false);
  });

  test('3. /currency/1 @ 1440px flat hero, 6 metric tiles, chart canvas, local plugin, and history table', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/currency/1', '.curr-detail-page');

    const heroStyles = await page.locator('.curr-detail-hero').evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { bg: s.backgroundColor, image: s.backgroundImage, shadow: s.boxShadow, radius: parseFloat(s.borderRadius) };
    });
    expect(heroStyles.bg).toBe(SURFACE);
    expect(heroStyles.image).toBe('none');
    expect(heroStyles.shadow).toBe('none');
    expect(heroStyles.radius).toBeLessThanOrEqual(8);

    await expect(page.locator('.curr-metric-tile')).toHaveCount(6);
    const backDeco = await page.locator('.curr-back-link').evaluate((el) =>
      window.getComputedStyle(el).textDecorationLine
    );
    expect(backDeco).toBe('none');

    await expect(page.locator('.curr-detail-page .fs-btn-primary')).toHaveCount(1);
    const chartWrapper = page.locator('.curr-chart-canvas-wrapper[data-plugin-ids*="currLastPointLabelPlugin"]');
    await expect(chartWrapper).toBeVisible();
    const canvasBox = await chartWrapper.locator('canvas').boundingBox();
    expect(canvasBox.width).toBeGreaterThan(200);
    expect(canvasBox.height).toBeGreaterThan(200);

    await expect(page.getByTestId('curr-chart-summary')).toBeVisible();
    await expect(page.locator('.curr-history-details')).toBeVisible();
    await expect(page.getByTestId('curr-rate-history-table')).toBeAttached();
  });

  test('4. /currency/1 timeframe filter interaction updates aria-pressed and row counts (7, 30, 90, 100, 100)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/currency/1', '.curr-detail-page');

    const summary = page.getByTestId('curr-chart-summary');
    await expect(summary).toContainText('Showing 30 point(s)');

    for (const [label, count] of [['1W', 7], ['3M', 90], ['6M', 100], ['All', 100]]) {
      const btn = page.getByRole('button', { name: label, exact: true });
      await btn.click();
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      await expect(summary).toContainText(`Showing ${count} point(s)`);
    }
  });

  test('5. /currency/1 @ 390px hides desktop history details, shows D19 history mobile cards, 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndSettle(page, '/currency/1', '.curr-detail-page');

    await expect(page.locator('.curr-history-details')).toBeHidden();
    await expect(page.getByTestId('curr-history-mobile-cards')).toBeVisible();
    expect(await hasPageOverflow(page)).toBe(false);
  });

  test('6. /currency/new @ 1440px & 390px Frame 02 stacked form, implied rate preview, blur/submit errors, 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/currency/new', '.curr-form-page');

    await expect(page.locator('#account-selector-sourceAccount')).toBeVisible();
    const amountInput = page.locator('#curr-amount');
    const priceInput = page.locator('#curr-price');

    await amountInput.fill('200');
    await priceInput.fill('10000');
    await expect(page.getByTestId('curr-implied-rate')).toContainText('1 USD = 50.0000 EGP');

    await amountInput.fill('0');
    await amountInput.blur();
    await expect(page.locator('#curr-amount-error')).toBeVisible();
    await expect(amountInput).toHaveAttribute('aria-invalid', 'true');

    await amountInput.fill('250');
    await amountInput.blur();
    await expect(page.locator('#curr-amount-error')).toHaveCount(0);
    await expect(amountInput).toHaveAttribute('aria-invalid', 'false');

    await priceInput.fill('');
    await priceInput.blur();
    await page.getByRole('button', { name: 'Create Currency' }).click();
    await expect(page.locator('.curr-form-error-summary')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await hasPageOverflow(page)).toBe(false);
  });

  test('7. /currency/edit/1 @ 1440px & 390px prefilled form, single primary CTA, neutral Cancel, 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/currency/edit/1', '.curr-form-page');

    await expect(page.locator('#curr-name')).toHaveValue('Dollar');
    await expect(page.locator('#curr-amount')).toHaveValue('2000');
    await expect(page.locator('.curr-form-page .fs-btn-primary')).toHaveText('Update Currency');
    await expect(page.getByRole('link', { name: 'Cancel' })).toHaveClass(/fs-btn-secondary/);

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await hasPageOverflow(page)).toBe(false);
  });

  test('8. interactive touch targets (>=44px) and visible focus rings on keyboard Tab', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndSettle(page, '/currency', '.curr-log-page');

    const primaryBox = await page.locator('.curr-log-page .fs-btn-primary').boundingBox();
    expect(primaryBox.height).toBeGreaterThanOrEqual(44);
    const expanderBox = await page.locator('.curr-card-expander').first().boundingBox();
    expect(expanderBox.width).toBeGreaterThanOrEqual(44);
    expect(expanderBox.height).toBeGreaterThanOrEqual(44);

    const revalueBtn = page.locator('.curr-header .fs-btn-secondary');
    const primaryBtn = page.locator('.curr-header .fs-btn-primary');
    await revalueBtn.focus();
    await page.keyboard.press('Tab');
    await expect(primaryBtn).toBeFocused();
    const outlineStyle = await primaryBtn.evaluate((el) =>
      window.getComputedStyle(el).outlineStyle
    );
    expect(outlineStyle).not.toBe('none');

    await gotoAndSettle(page, '/currency/new', '.curr-form-page');
    const submitBox = await page.locator('.curr-form-page .fs-btn-primary').boundingBox();
    expect(submitBox.height).toBeGreaterThanOrEqual(44);
  });

  test('9. Delete actions on /currency and /currency/1 open ConfirmModal and close on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/currency', '.curr-log-page');

    await page.getByRole('button', { name: 'Delete Dollar (USD)' }).click();
    await expect(page.getByText('Delete Currency Entry')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Delete Currency Entry')).toHaveCount(0);

    await gotoAndSettle(page, '/currency/1', '.curr-detail-page');
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Delete Currency Holding')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Delete Currency Holding')).toHaveCount(0);
  });
});
