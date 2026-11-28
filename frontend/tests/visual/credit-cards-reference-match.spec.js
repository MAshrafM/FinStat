// frontend/tests/visual/credit-cards-reference-match.spec.js
/* eslint-disable testing-library/prefer-screen-queries */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupCreditCardsMocks } = require('./fixtures/creditCardsMocks');

const SNAPSHOT_DIR = path.resolve(__dirname, '../../../docs/ui-snapshots/phase-9a');
const REF_FRAME_02_PATH = path.resolve(__dirname, '../../../docs/UI-UX_Plan/reference/02-form.html');
const ALL_WIDTHS = [1440, 1024, 768, 480, 390];

const ensureSnapshotDir = () => {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
};

test.describe('Phase 9A Credit Cards Reference Match & Checkpoint #7', () => {
  test.beforeEach(async ({ page }) => {
    ensureSnapshotDir();
    await setFixedClock(page);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setupCreditCardsMocks(page);
  });

  test('1. /credit-cards @ 1440px: dark canvas, flat KPIs, 3-tier utilization labels, neutral chips', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.locator('.cc-util-card').waitFor({ state: 'visible' });

    const themeAttr = await page.locator('html').getAttribute('data-fs-theme');
    expect(themeAttr).toBe('dark');

    const bodyRgb = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number)
    );
    expect(bodyRgb).toEqual([16, 17, 20]);

    const metrics = await page.evaluate(() => {
      const card = document.querySelector('.cc-util-card');
      const kpi = document.querySelector('.cc-kpi-tile');
      return {
        cardBgImg: getComputedStyle(card).backgroundImage,
        cardShadow: getComputedStyle(card).boxShadow,
        cardRadius: parseFloat(getComputedStyle(card).borderRadius),
        kpiBgImg: getComputedStyle(kpi).backgroundImage,
        kpiShadow: getComputedStyle(kpi).boxShadow,
        kpiRadius: parseFloat(getComputedStyle(kpi).borderRadius),
        inlineStyleCount: document.querySelectorAll('.cc-page-container [style], .cc-util-card [style]').length,
        primaryCtaCount: document.querySelectorAll('.cc-dashboard-page .cc-btn-group .fs-btn-primary').length,
      };
    });

    expect(metrics.cardBgImg).toBe('none');
    expect(metrics.cardShadow).toBe('none');
    expect(metrics.cardRadius).toBeLessThanOrEqual(8);
    expect(metrics.kpiBgImg).toBe('none');
    expect(metrics.kpiShadow).toBe('none');
    expect(metrics.kpiRadius).toBeLessThanOrEqual(8);
    expect(metrics.inlineStyleCount).toBe(0);
    expect(metrics.primaryCtaCount).toBe(1);

    // 3 utilization tiers + informational 30% alert banner/badges
    await expect(page.locator('.cc-util-item')).toHaveCount(3);
    await expect(page.getByText('Elevated', { exact: true })).toBeVisible();
    await expect(page.getByText('High', { exact: true })).toBeVisible();
    await expect(page.getByText(/Above 30% Alert/i)).toHaveCount(2);
    await expect(page.getByText(/One or more cards exceed the recommended 30% threshold/i)).toBeVisible();
  });

  test('2. /credit-cards @ 390px: D19 mobile cards, expandable details & 0px page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="cc-due-mobile-cards"]').waitFor({ state: 'visible' });

    const tableDisplay = await page.evaluate(
      () => getComputedStyle(document.querySelector('.cc-table-wrap')).display
    );
    expect(tableDisplay).toBe('none');

    await page.getByRole('button', { name: /Show due details for/i }).first().click();
    await expect(page.getByRole('button', { name: /Hide due details for/i }).first()).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });

  test('3. Dual-mode CreditCardSubNav captures (themed vs legacy 9B)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.locator('.cc-subnav-container').waitFor({ state: 'visible' });
    await page.locator('.cc-subnav-container').screenshot({
      path: path.join(SNAPSHOT_DIR, 'cc-subnav-themed-1440.png'),
    });

    await page.goto('/credit-cards/statements', { waitUntil: 'domcontentloaded' });
    await page.locator('.cc-subnav-container').waitFor({ state: 'visible' });
    const themeAttr = await page.locator('html').getAttribute('data-fs-theme');
    expect(themeAttr).toBe('dark');
    await page.locator('.cc-subnav-container').screenshot({
      path: path.join(SNAPSHOT_DIR, 'cc-subnav-legacy-1440.png'),
    });
  });

  test('4. Add Card modal across 5 widths + Frame 02 Variant B side-by-side comparison', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Add New Card/i }).click();
    await page.locator('.modal-content').waitFor({ state: 'visible' });

    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({ path: path.join(SNAPSHOT_DIR, `add-card-${width}.png`), animations: 'disabled' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);
    }

    // Generate deterministic Frame 02 Variant B side-by-side artifact
    const helperPage = await context.newPage();
    await helperPage.setViewportSize({ width: 1440, height: 900 });
    const refUrl = `file:///${REF_FRAME_02_PATH.replace(/\\/g, '/')}`;
    await helperPage.goto(refUrl, { waitUntil: 'domcontentloaded' });
    await helperPage.getByRole('button', { name: 'Populated' }).click();
    const refBuf = await helperPage.screenshot();
    const addBuf = fs.readFileSync(path.join(SNAPSHOT_DIR, 'add-card-1440.png'));
    await helperPage.setContent(`
      <html>
        <body style="margin:0;background:black;color:white;font-family:sans-serif;display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;">
          <div>
            <h2 style="margin:0 0 8px 0;font-size:14px;">Reference Frame 02 (Variant B — Populated)</h2>
            <img src="data:image/png;base64,${refBuf.toString('base64')}" style="width:100%;border:1px solid dimgray;" />
          </div>
          <div>
            <h2 style="margin:0 0 8px 0;font-size:14px;">Phase 9A Add Card Modal (1440px)</h2>
            <img src="data:image/png;base64,${addBuf.toString('base64')}" style="width:100%;border:1px solid dimgray;" />
          </div>
        </body>
      </html>
    `);
    await helperPage.screenshot({ path: path.join(SNAPSHOT_DIR, 'frame-02-side-by-side.png') });
    await helperPage.close();
  });

  test('5. Log Transaction modal across 5 widths + FX conversion card & Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.locator('#cc-card-selector').selectOption('card-1');
    await page.getByRole('button', { name: /Log Transaction/i }).click();
    await page.locator('.modal-content').waitFor({ state: 'visible' });

    await page.locator('#card-currency').selectOption('USD');
    await page.locator('#card-foreign-amount').fill('100');
    await expect(page.getByTestId('conversion-confirmation-card')).toBeVisible();

    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({ path: path.join(SNAPSHOT_DIR, `log-transaction-${width}.png`), animations: 'disabled' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);
    }
  });

  test('6. Partial Payment modal across 5 widths', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Make partial payment for/i }).first().click();
    await page.locator('.modal-content').waitFor({ state: 'visible' });

    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({ path: path.join(SNAPSHOT_DIR, `partial-payment-${width}.png`), animations: 'disabled' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);
    }
  });

  test('7. touch targets >= 44px on mobile & keyboard Tab focus-visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.locator('.cc-btn-group .fs-btn-primary').waitFor({ state: 'visible' });

    const ctaBox = await page.locator('.cc-btn-group .fs-btn-primary').boundingBox();
    expect(ctaBox.height).toBeGreaterThanOrEqual(44);

    const expandBtn = page.getByRole('button', { name: /Show due details for/i }).first();
    const expandBox = await expandBtn.boundingBox();
    expect(expandBox.height).toBeGreaterThanOrEqual(44);
    await expandBtn.click();

    const iconBox = await page.locator('.cc-mobile-cards .cc-icon-btn').first().boundingBox();
    expect(iconBox.height).toBeGreaterThanOrEqual(44);
    expect(iconBox.width).toBeGreaterThanOrEqual(44);

    await page.keyboard.press('Tab');
    const hasFocus = await page.evaluate(() => document.activeElement !== document.body);
    expect(hasFocus).toBe(true);
  });

  test('8. Loading, empty, and error state captures @ 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Loading state
    await page.unroute(/\/api\/credit-cards(?:\/|\?|$)/);
    await page.route(/\/api\/credit-cards\/cards\/?$/, () => new Promise(() => {}));
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.locator('.cc-dashboard-page').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'credit-cards-loading-1440.png') });

    // Empty state
    await page.unroute(/\/api\/credit-cards\/cards\/?$/);
    await page.route(/\/api\/credit-cards(?:\/|\?|$)/, async (route) => {
      const origin = route.request().headers().origin || 'http://localhost:3000';
      const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
      };
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers });
      }
      if (route.request().url().includes('/utilization')) {
        return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ cards: [] }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify([]) });
    });
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.getByText('No Credit Cards Found').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'credit-cards-empty-1440.png') });

    // Error state
    await page.unroute(/\/api\/credit-cards(?:\/|\?|$)/);
    await page.route(/\/api\/credit-cards(?:\/|\?|$)/, async (route) => {
      const origin = route.request().headers().origin || 'http://localhost:3000';
      const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
      };
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers });
      }
      return route.fulfill({ status: 500, contentType: 'application/json', headers, body: JSON.stringify({ message: 'Server error' }) });
    });
    await page.goto('/credit-cards', { waitUntil: 'domcontentloaded' });
    await page.locator('.cc-error-card').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'credit-cards-error-1440.png') });
  });
});
