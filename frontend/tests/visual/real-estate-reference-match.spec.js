// frontend/tests/visual/real-estate-reference-match.spec.js
/* eslint-disable testing-library/prefer-screen-queries */
const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupRealEstateMocks } = require('./fixtures/realEstateMocks');

test.describe('Phase 8E Real Estate Reference Match', () => {
  test.beforeEach(async ({ page }) => {
    await setFixedClock(page);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setupRealEstateMocks(page);
  });

  test('1. /real-estate @ 1440px: dark canvas, flat KPIs, single primary CTA, neutral badges, no Sold negative tone', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/real-estate', { waitUntil: 'domcontentloaded' });
    await page.locator('.re-prop-card').first().waitFor({ state: 'visible' });

    const themeAttr = await page.locator('html').getAttribute('data-fs-theme');
    expect(themeAttr).toBe('dark');

    const bodyRgbChannels = await page.evaluate(() => {
      const bg = getComputedStyle(document.body).backgroundColor;
      return bg.match(/\d+/g).map(Number);
    });
    expect(bodyRgbChannels).toEqual([16, 17, 20]);

    // Single primary CTA in header
    const primaryCtas = await page.locator('.re-log-page .fs-btn-primary').count();
    expect(primaryCtas).toBe(1);

    // Zero gradients, zero glows, radii <= 8px on KPI tiles and property cards
    const cardMetrics = await page.evaluate(() => {
      const kpi = document.querySelector('.re-kpi-tile');
      const card = document.querySelector('.re-prop-card');
      return {
        kpiBgImg: getComputedStyle(kpi).backgroundImage,
        kpiShadow: getComputedStyle(kpi).boxShadow,
        kpiRadius: parseFloat(getComputedStyle(kpi).borderRadius),
        cardBgImg: getComputedStyle(card).backgroundImage,
        cardShadow: getComputedStyle(card).boxShadow,
        cardRadius: parseFloat(getComputedStyle(card).borderRadius),
        inlineStyleCount: document.querySelectorAll('.re-page-container [style]').length,
        deltaCount: document.querySelectorAll('.re-page-container .fs-delta').length,
        negativeBadgeCount: document.querySelectorAll('.re-page-container .fs-badge--negative').length,
      };
    });

    expect(cardMetrics.kpiBgImg).toBe('none');
    expect(cardMetrics.kpiShadow).toBe('none');
    expect(cardMetrics.kpiRadius).toBeLessThanOrEqual(8);
    expect(cardMetrics.cardBgImg).toBe('none');
    expect(cardMetrics.cardShadow).toBe('none');
    expect(cardMetrics.cardRadius).toBeLessThanOrEqual(8);
    expect(cardMetrics.inlineStyleCount).toBe(0);
    expect(cardMetrics.deltaCount).toBe(0);
    expect(cardMetrics.negativeBadgeCount).toBe(0);

    // Sold-loss property renders with neutral figures and accessible progress bar
    await expect(page.getByText('Downtown Retail Unit')).toBeVisible();
    const progressCount = await page.locator('progress.re-appreciation-progress').count();
    expect(progressCount).toBe(4);
  });

  test('2. /real-estate Table view @ 1440px: 9-column semantic table, right-aligned numbers & W-8E-1 container', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/real-estate', { waitUntil: 'domcontentloaded' });
    await page.locator('.re-prop-card').first().waitFor({ state: 'visible' });

    await page.getByRole('button', { name: 'Table' }).click();
    await page.locator('.re-table').waitFor({ state: 'visible' });

    const tableInfo = await page.evaluate(() => {
      const wrap = document.querySelector('.re-table-wrap');
      const headers = Array.from(document.querySelectorAll('.re-table thead th')).map((th) =>
        th.textContent.trim()
      );
      const numCell = document.querySelector('.re-td-num');
      return {
        overflowX: getComputedStyle(wrap).overflowX,
        headerCount: headers.length,
        numAlign: getComputedStyle(numCell).textAlign,
        mobileDisplay: getComputedStyle(document.querySelector('.re-mobile-cards')).display,
      };
    });

    expect(tableInfo.overflowX).toBe('auto');
    expect(tableInfo.headerCount).toBe(9);
    expect(tableInfo.numAlign).toBe('right');
    expect(tableInfo.mobileDisplay).toBe('none');
  });

  test('3. /real-estate @ 390px: Cards view and Table D19 mobile cards render with 0px page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/real-estate', { waitUntil: 'domcontentloaded' });
    await page.locator('.re-prop-card').first().waitFor({ state: 'visible' });

    const cardsOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(cardsOverflow).toBe(0);

    await page.getByRole('button', { name: 'Table' }).click();
    await page.locator('[data-testid="real-estate-mobile-cards"]').waitFor({ state: 'visible' });

    const tableHidden = await page.evaluate(
      () => getComputedStyle(document.querySelector('.re-table-wrap')).display
    );
    expect(tableHidden).toBe('none');

    // Expand first mobile card
    await page.getByRole('button', { name: /Show details for/i }).first().click();
    await expect(page.getByRole('button', { name: /Hide details for/i }).first()).toBeVisible();

    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(mobileOverflow).toBe(0);
  });

  test('4. /real-estate filter, search, and sort interactions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/real-estate', { waitUntil: 'domcontentloaded' });
    await page.locator('.re-prop-card').first().waitFor({ state: 'visible' });

    await page.getByRole('button', { name: 'Owned' }).click();
    await expect(page.locator('.re-prop-card')).toHaveCount(2);

    await page.getByRole('button', { name: 'Villa' }).click();
    await expect(page.locator('.re-prop-card')).toHaveCount(1);
    await expect(page.getByText('North Coast Chalet')).toBeVisible();

    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.getByRole('button', { name: 'All Types' }).click();
    await expect(page.locator('.re-prop-card')).toHaveCount(4);
  });

  test('5. /real-estate/new @ 1440px & 390px: Frame 02 form, conditional Sold fields, blur & submit validation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/real-estate/new', { waitUntil: 'domcontentloaded' });
    await page.locator('.re-form-card').waitFor({ state: 'visible' });

    // Trigger blur validation first so submit button does not shift on click
    const nameInput = page.locator('#re-name');
    await nameInput.focus();
    await nameInput.blur();
    await expect(page.locator('#re-name-error')).toBeVisible();

    await page.getByRole('button', { name: 'Add Property' }).click();
    await expect(page.locator('.re-form-error-summary')).toBeVisible();

    // Conditional Sold fields appear and clear on switch back to Owned
    await page.locator('#re-status').selectOption('Sold');
    await expect(page.locator('#re-selling-price')).toBeVisible();
    await expect(page.locator('#re-selling-date')).toBeVisible();

    await page.locator('#re-status').selectOption('Owned');
    await expect(page.locator('#re-selling-price')).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(mobileOverflow).toBe(0);
  });

  test('6. /real-estate/edit/1 @ 1440px & 390px: prefilled form with 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/real-estate/edit/1', { waitUntil: 'domcontentloaded' });
    await page.locator('#re-name').waitFor({ state: 'visible' });

    await expect(page.locator('#re-name')).toHaveValue('New Cairo Apartment');
    await expect(page.locator('#re-purchase-price')).toHaveValue('1800000');

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(mobileOverflow).toBe(0);
  });

  test('7. touch targets >= 44px on mobile & keyboard Tab focus-visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/real-estate', { waitUntil: 'domcontentloaded' });
    await page.locator('.re-prop-card').first().waitFor({ state: 'visible' });

    const ctaBox = await page.locator('.re-header-actions .fs-btn-primary').boundingBox();
    expect(ctaBox.height).toBeGreaterThanOrEqual(44);

    const editBox = await page.locator('.re-icon-btn').first().boundingBox();
    expect(editBox.height).toBeGreaterThanOrEqual(44);
    expect(editBox.width).toBeGreaterThanOrEqual(44);

    // Keyboard Tab focus-visible check
    await page.keyboard.press('Tab');
    const hasFocus = await page.evaluate(() => document.activeElement !== document.body);
    expect(hasFocus).toBe(true);
  });

  test('8. Delete ConfirmModal opens and closes cleanly on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/real-estate', { waitUntil: 'domcontentloaded' });
    await page.locator('.re-prop-card').first().waitFor({ state: 'visible' });

    await page.getByRole('button', { name: 'Delete New Cairo Apartment' }).click();
    await expect(page.getByText('Delete Real Estate Property')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Delete Real Estate Property')).toHaveCount(0);
  });
});
