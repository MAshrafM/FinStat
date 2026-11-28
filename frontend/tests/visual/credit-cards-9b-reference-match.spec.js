// frontend/tests/visual/credit-cards-9b-reference-match.spec.js
/* eslint-disable testing-library/prefer-screen-queries */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupCreditCardsMocks } = require('./fixtures/creditCardsMocks');

const SNAPSHOT_DIR = path.resolve(__dirname, '../../../docs/ui-snapshots/phase-9b');

test.describe('Phase 9B Credit Cards Sub-Routes Reference Match & D19 Verification', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await setFixedClock(page);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setupCreditCardsMocks(page);
  });

  test('1. /credit-cards/statements @ 1440px and 390px D19 cards + 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/credit-cards/statements', { waitUntil: 'domcontentloaded' });
    await page.locator('.sc-summary-grid').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    expect(await page.locator('html').getAttribute('data-fs-theme')).toBe('dark');
    expect(await page.locator('.sc-page [style]').count()).toBe(0);
    await expect(page.getByText('Due soon').first()).toBeVisible();
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'statements-1440.png'), animations: 'disabled' });

    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('[data-testid="sc-charges-mobile-cards"]').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /Show charge details for/i }).first().click();
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'statements-390.png'), animations: 'disabled' });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });

  test('2. /credit-cards/debt-payoff @ 1440px and 390px D19 cards + 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/credit-cards/debt-payoff', { waitUntil: 'domcontentloaded' });
    await page.locator('.dp-metrics-grid').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    expect(await page.locator('.dp-page [style]').count()).toBe(0);
    await page.getByRole('button', { name: /Debt Avalanche/i }).click();
    await page.getByRole('button', { name: /Show All 10 Months/i }).click();
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'debt-payoff-1440.png'), animations: 'disabled' });

    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('[data-testid="dp-comparison-mobile-cards"]').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /Show comparison details for/i }).first().click();
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'debt-payoff-390.png'), animations: 'disabled' });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });

  test('3. /credit-cards/reconcile @ 1440px and 390px D19 cards + 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/credit-cards/reconcile', { waitUntil: 'domcontentloaded' });
    await page.locator('#rec-actual-balance').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    await page.locator('#rec-actual-balance').fill('3950');
    await page.getByRole('button', { name: /Run Reconciliation/i }).click();
    await page.locator('.rec-status-banner').waitFor({ state: 'visible' });
    await expect(page.getByText('Discrepancy', { exact: true })).toBeVisible();
    expect(await page.locator('.rec-page [style]').count()).toBe(0);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'reconcile-1440.png'), animations: 'disabled' });

    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('[data-testid="rec-charges-mobile-cards"]').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /Show charge details for/i }).first().click();
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'reconcile-390.png'), animations: 'disabled' });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });

  test('4. Unified CreditCardSubNav across all 4 routes @ 1440px and 390px', async ({ page }) => {
    const subRoutes = [
      { key: 'cards', url: '/credit-cards' },
      { key: 'statements', url: '/credit-cards/statements' },
      { key: 'debt-payoff', url: '/credit-cards/debt-payoff' },
      { key: 'reconcile', url: '/credit-cards/reconcile' },
    ];

    for (const item of subRoutes) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(item.url, { waitUntil: 'domcontentloaded' });
        await page.locator('.cc-subnav-container').waitFor({ state: 'visible' });
        expect(await page.locator('html').getAttribute('data-fs-theme')).toBe('dark');
        await page.locator('.cc-subnav-container').screenshot({
          path: path.join(SNAPSHOT_DIR, `cc-subnav-${item.key}-${width}.png`),
        });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow).toBe(0);
      }
    }
  });

  test('5. Loading state captures for all 3 routes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.unroute(/\/api\/credit-cards(?:\/|\?|$)/);
    await page.route(/\/api\/credit-cards\/cards\/?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ _id: 'card-1', name: 'CIB Titanium', bank: 'CIB' }]),
      });
    });
    await page.route(/\/api\/credit-cards\/statement-cycles\/.+/, () => new Promise(() => {}));
    await page.goto('/credit-cards/statements', { waitUntil: 'domcontentloaded' });
    await page.locator('.fs-loading').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'statements-loading.png') });

    await page.unroute(/\/api\/debt-payoff(?:\/|\?|$)/);
    await page.route(/\/api\/debt-payoff\/plans\/?$/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route(/\/api\/debt-payoff\/calculate\/?$/, () => new Promise(() => {}));
    await page.goto('/credit-cards/debt-payoff', { waitUntil: 'domcontentloaded' });
    await page.locator('.fs-loading').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'debt-payoff-loading.png') });

    await page.unroute(/\/api\/credit-cards\/statement-cycles\/.+/);
    await page.route(/\/api\/credit-cards\/statement-cycles\/.+/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cycles: [{ startDate: '2025-12-16T00:00:00.000Z', closeDate: '2026-01-15T00:00:00.000Z' }],
        }),
      });
    });
    await page.route(/\/api\/credit-cards\/reconcile\/.+/, () => new Promise(() => {}));
    await page.goto('/credit-cards/reconcile', { waitUntil: 'domcontentloaded' });
    await page.locator('#rec-actual-balance').fill('3950');
    await page.getByRole('button', { name: /Run Reconciliation/i }).click();
    await page.locator('.fs-loading').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'reconcile-loading.png') });
  });

  test('6. Empty state captures for all 3 routes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.unroute(/\/api\/credit-cards(?:\/|\?|$)/);
    await page.route(/\/api\/credit-cards\/cards\/?$/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.goto('/credit-cards/statements', { waitUntil: 'domcontentloaded' });
    await page.locator('.sc-empty-card').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'statements-empty.png') });

    await page.goto('/credit-cards/reconcile', { waitUntil: 'domcontentloaded' });
    await page.locator('.rec-empty-card').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'reconcile-empty.png') });

    await page.unroute(/\/api\/debt-payoff(?:\/|\?|$)/);
    await page.route(/\/api\/debt-payoff\/plans\/?$/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route(/\/api\/debt-payoff\/calculate\/?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ strategy: 'snowball', monthlyBudget: 2000, cards: [], schedule: [], monthsToPayoff: 0 }),
      });
    });
    await page.goto('/credit-cards/debt-payoff', { waitUntil: 'domcontentloaded' });
    await page.locator('.dp-empty-card').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'debt-payoff-empty.png') });
  });

  test('7. Error state captures for all 3 routes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.unroute(/\/api\/credit-cards(?:\/|\?|$)/);
    await page.route(/\/api\/credit-cards\/cards\/?$/, async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Failed to load cards"}' });
    });
    await page.goto('/credit-cards/statements', { waitUntil: 'domcontentloaded' });
    await page.locator('.sc-error-card').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'statements-error.png') });

    await page.goto('/credit-cards/reconcile', { waitUntil: 'domcontentloaded' });
    await page.locator('.rec-error-card').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'reconcile-error.png') });

    await page.unroute(/\/api\/debt-payoff(?:\/|\?|$)/);
    await page.route(/\/api\/debt-payoff\/plans\/?$/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route(/\/api\/debt-payoff\/calculate\/?$/, async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Simulation failed"}' });
    });
    await page.goto('/credit-cards/debt-payoff', { waitUntil: 'domcontentloaded' });
    await page.locator('.dp-error-card').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'debt-payoff-error.png') });
  });

  test('8. touch targets >= 44px and focus rings visible across Phase 9B routes @ 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });

    await page.goto('/credit-cards/statements', { waitUntil: 'domcontentloaded' });
    await page.locator('#sc-card-select').waitFor({ state: 'visible' });
    expect((await page.locator('#sc-card-select').boundingBox()).height).toBeGreaterThanOrEqual(44);

    await page.goto('/credit-cards/debt-payoff', { waitUntil: 'domcontentloaded' });
    await page.locator('.dp-action-btn').first().waitFor({ state: 'visible' });
    expect((await page.locator('.dp-action-btn').first().boundingBox()).height).toBeGreaterThanOrEqual(44);

    await page.goto('/credit-cards/reconcile', { waitUntil: 'domcontentloaded' });
    await page.locator('.rec-submit-btn').waitFor({ state: 'visible' });
    expect((await page.locator('.rec-submit-btn').boundingBox()).height).toBeGreaterThanOrEqual(44);

    await page.keyboard.press('Tab');
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'phase-9b-touch-focus-390.png') });
  });

  test('9. Frame 02 Variant B side-by-side comparison for Debt Payoff strategy form', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/credit-cards/debt-payoff', { waitUntil: 'domcontentloaded' });
    await page.locator('.dp-control-card').waitFor({ state: 'visible' });

    const refPage = await context.newPage();
    await refPage.setViewportSize({ width: 1440, height: 900 });
    await refPage.goto('http://localhost:3001/docs/UI-UX_Plan/reference/02-form.html', { waitUntil: 'domcontentloaded' });
    const appBuf = await page.locator('.dp-control-card').screenshot();
    const refBuf = await refPage.screenshot();
    await refPage.close();

    await page.setContent(`
      <body style="margin:0;display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;">
        <img src="data:image/png;base64,${refBuf.toString('base64')}" style="width:100%;" />
        <img src="data:image/png;base64,${appBuf.toString('base64')}" style="width:100%;" />
      </body>
    `);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'frame-02-side-by-side.png') });
  });
});
