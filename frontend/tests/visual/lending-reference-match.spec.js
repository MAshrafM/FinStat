// frontend/tests/visual/lending-reference-match.spec.js
/* eslint-disable testing-library/prefer-screen-queries */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupLendingMocks } = require('./fixtures/lendingMocks');

const SNAPSHOT_DIR = path.resolve(__dirname, '../../../docs/ui-snapshots/phase-9c');
const ALL_WIDTHS = [1440, 1024, 768, 480, 390];

test.describe('Phase 9C Peer-to-Peer Lending Reference Match & D19 Verification', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await setFixedClock(page);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setupLendingMocks(page);
  });

  test('1. /lending responsive sweep @ 1440/1024/768/480/390 + D19 cards + 0px overflow', async ({ page }) => {
    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/lending', { waitUntil: 'domcontentloaded' });
      await page.locator('.lending-kpi-grid').waitFor({ state: 'visible' });
      await page.evaluate(() => document.fonts.ready).catch(() => {});

      expect(await page.locator('html').getAttribute('data-fs-theme')).toBe('dark');
      expect(await page.locator('.lending-page [style]').count()).toBe(0);
      expect(await page.locator('.lending-table th[aria-sort]').count()).toBe(0);
      expect(await page.locator('.lending-table input[type="checkbox"]').count()).toBe(0);

      if (width <= 768) {
        await page.locator('[data-testid="lending-loans-mobile-cards"]').waitFor({ state: 'visible' });
        if (width === 390) {
          await page.getByRole('button', { name: /Show loan details for/i }).first().click();
        }
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);
      await page.screenshot({ path: path.join(SNAPSHOT_DIR, `lending-dashboard-${width}.png`), animations: 'disabled' });
    }
  });

  test('2. /lending/persons/1 @ 1440px and 390px D19 cards + 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/lending/persons/1', { waitUntil: 'domcontentloaded' });
    await page.locator('.lending-summary-banner').waitFor({ state: 'visible' });
    expect(await page.locator('.lending-page [style]').count()).toBe(0);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'lending-person-detail-1440.png'), animations: 'disabled' });

    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('[data-testid="person-loans-mobile-cards"]').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /Show loan details for/i }).first().click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'lending-person-detail-390.png'), animations: 'disabled' });
  });

  test('3. /lending/loans/1 @ 1440px and 390px D19 cards + 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/lending/loans/1', { waitUntil: 'domcontentloaded' });
    await page.locator('.lending-progress').waitFor({ state: 'visible' });
    expect(await page.locator('.lending-page [style]').count()).toBe(0);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'lending-loan-detail-1440.png'), animations: 'disabled' });

    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('[data-testid="loan-tx-mobile-cards"]').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /Show transaction details for/i }).first().click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'lending-loan-detail-390.png'), animations: 'disabled' });
  });

  test('4. Modals and forms @ 1440px and 390px + 0px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/lending', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /\+ Add Person/i }).click();
    await page.locator('.lending-modal-content').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'lending-modals-1440.png'), animations: 'disabled' });

    await page.setViewportSize({ width: 390, height: 900 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'lending-modals-390.png'), animations: 'disabled' });
  });

  test('5. Loading, empty, and error state captures for all 3 routes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Loading states
    await page.unroute(/\/api\/lending(?:\/|\?|$)/);
    await page.route(/\/api\/lending\/.*/, () => new Promise(() => {}));
    for (const item of [
      { slug: 'lending', url: '/lending' },
      { slug: 'lending-person-detail', url: '/lending/persons/1' },
      { slug: 'lending-loan-detail', url: '/lending/loans/1' },
    ]) {
      await page.goto(item.url, { waitUntil: 'domcontentloaded' });
      await page.locator('.fs-loading').waitFor({ state: 'visible' });
      await page.screenshot({ path: path.join(SNAPSHOT_DIR, `${item.slug}-loading.png`) });
    }

    // Empty states
    await page.unroute(/\/api\/lending\/.*/);
    await page.route(/\/api\/lending\/.*/, async (route) => {
      const url = route.request().url();
      if (url.includes('/summary')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { totalBorrowed: 0, totalRepaid: 0, totalOutstanding: 0, activeLoansCount: 0, personsCount: 0 } }) });
      }
      if (url.includes('/persons/1')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { person: { _id: '1', name: 'Ahmed Samir' }, loans: [], aggregate: { totalOutstandingInPiastres: 0, activeLoanCount: 0 } } }) });
      }
      if (url.includes('/loans/1')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { _id: '1', person: { _id: '1', name: 'Ahmed Samir' }, status: 'Active', totalBorrowedInPiastres: 0, totalRepaidInPiastres: 0, balanceInPiastres: 0, transactions: [] } }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    });
    for (const item of [
      { slug: 'lending', url: '/lending' },
      { slug: 'lending-person-detail', url: '/lending/persons/1' },
      { slug: 'lending-loan-detail', url: '/lending/loans/1' },
    ]) {
      await page.goto(item.url, { waitUntil: 'domcontentloaded' });
      await page.locator('.lending-page').waitFor({ state: 'visible' });
      await page.screenshot({ path: path.join(SNAPSHOT_DIR, `${item.slug}-empty.png`) });
    }

    // Error / not-found states
    await page.unroute(/\/api\/lending\/.*/);
    await page.route(/\/api\/lending\/.*/, async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false,"message":"Lending service unavailable"}' });
    });
    for (const item of [
      { slug: 'lending', url: '/lending' },
      { slug: 'lending-person-detail', url: '/lending/persons/1' },
      { slug: 'lending-loan-detail', url: '/lending/loans/1' },
    ]) {
      await page.goto(item.url, { waitUntil: 'domcontentloaded' });
      await page.locator('.lending-empty-state').waitFor({ state: 'visible' });
      await page.screenshot({ path: path.join(SNAPSHOT_DIR, `${item.slug}-error.png`) });
    }
  });

  test('6. Status-chip and PersonCard tone matrix @ 1440px and 390px', async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/lending', { waitUntil: 'domcontentloaded' });
      await page.locator('.lending-persons-grid').waitFor({ state: 'visible' });
      await expect(page.getByText('WrittenOff')).toBeVisible();
      await page.screenshot({ path: path.join(SNAPSHOT_DIR, `lending-status-chips-${width}.png`) });
    }
  });

  test('7. touch targets >= 44px and focus rings visible @ 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/lending', { waitUntil: 'domcontentloaded' });
    await page.locator('.lending-action-btn').first().waitFor({ state: 'visible' });
    const btnBox = await page.locator('.lending-action-btn').first().boundingBox();
    expect(btnBox.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Tab');
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'lending-touch-focus-390.png') });
  });

  test('8. Frame 01 dense-table and Frame 02 form side-by-side comparisons', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/lending', { waitUntil: 'domcontentloaded' });
    await page.locator('.lending-table-wrap').waitFor({ state: 'visible' });
    const tableBuf = await page.locator('.lending-table-wrap').screenshot();

    const refTable = await context.newPage();
    await refTable.setViewportSize({ width: 1440, height: 900 });
    await refTable.goto('http://localhost:3001/docs/UI-UX_Plan/reference/01-dense-table.html', { waitUntil: 'domcontentloaded' });
    const refTableBuf = await refTable.screenshot();
    await refTable.close();

    await page.setContent(`
      <body style="margin:0;display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;">
        <img src="data:image/png;base64,${refTableBuf.toString('base64')}" style="width:100%;" />
        <img src="data:image/png;base64,${tableBuf.toString('base64')}" style="width:100%;" />
      </body>
    `);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'frame-01-dense-table-side-by-side.png') });

    await page.goto('/lending/loans/1', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /\+ Add Repayment/i }).click();
    await page.locator('.lending-modal-content').waitFor({ state: 'visible' });
    const formBuf = await page.locator('.lending-modal-content').screenshot();

    const refForm = await context.newPage();
    await refForm.setViewportSize({ width: 1440, height: 900 });
    await refForm.goto('http://localhost:3001/docs/UI-UX_Plan/reference/02-form.html', { waitUntil: 'domcontentloaded' });
    const refFormBuf = await refForm.screenshot();
    await refForm.close();

    await page.setContent(`
      <body style="margin:0;display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;">
        <img src="data:image/png;base64,${refFormBuf.toString('base64')}" style="width:100%;" />
        <img src="data:image/png;base64,${formBuf.toString('base64')}" style="width:100%;" />
      </body>
    `);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'frame-02-form-side-by-side.png') });
  });
});
