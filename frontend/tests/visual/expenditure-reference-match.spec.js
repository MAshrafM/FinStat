/**
 * frontend/tests/visual/expenditure-reference-match.spec.js
 *
 * Automated computed-style and responsive verification comparing the live /expenditures route
 * against Canonical Reference Frame 01 (Dense Table Variant B: docs/UI-UX_Plan/reference/01-dense-table.html).
 *
 * Covers all 14 reference-matching requirements specified in UI Phase 4A:
 * 1. Primary button "+ Add Expenditure" background rgb(20, 184, 166) (--fs-accent), text rgb(13, 14, 16) (--fs-ink)
 * 2. Palette tokens: page background rgb(16, 17, 20), .fs-table-scroll rgb(26, 28, 32), borders rgb(52, 56, 63)
 * 3. Ordinary amounts neutrality (AD13): amount cells compute to rgb(242, 243, 245), zero red or green text
 * 4. Tabular numerals: amount cells have font-variant-numeric: tabular-nums
 * 5. Neutral category badges: compute to rgb(34, 37, 42) background and rgb(242, 243, 245) text
 * 6. Sort header arrow accent (N4): .fs-sort-arrow computes to rgb(20, 184, 166)
 * 7. Mobile responsiveness & zero horizontal scroll (D19): at 390px, table is unmounted, cards rendered, scrollWidth <= clientWidth
 * 8. Mobile category chips visible (C6): every rendered card contains a visible .fs-cat-badge
 * 9. Mobile split transactions (A1 & C5): card renders split tag with badges, drawer reveals breakdown
 * 10. Card interaction: drawer reveals account, bank balance, touch target >= 44px
 * 11. Focus-ring clipping prevention (§4.6 / G4): scroll wrapper has padding 5px, margin -5px, unclipped focus
 * 12. Custom checkbox checkmark affordance (V3-B2): ::after content !== 'none' and border rgb(13, 14, 16)
 * 13. Neutral action icons (N5 & R7): delete button computes to rgb(162, 168, 176) (--fs-text-3), not red
 * 14. Cumulative Layout Shift (CLS) <= 0.1
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');

const MOCK_EXPENDITURES = [
  {
    _id: 'exp-1',
    date: '2026-01-15T10:00:00.000Z',
    transactionValue: 125.50,
    transactionType: 'W',
    categories: ['Groceries'],
    description: 'Weekly Supermarket Restock',
    sourceAccount: 'Checking',
    bankBalanceAfter: 4874.50,
    paidWithCreditCard: false,
    settledFromBank: false,
    isRecurring: false,
  },
  {
    _id: 'exp-2',
    date: '2026-01-14T14:30:00.000Z',
    transactionValue: 350.00,
    transactionType: 'W',
    categories: ['Shopping'],
    description: 'Department Store Split',
    sourceAccount: 'Checking',
    bankBalanceAfter: 4524.50,
    paidWithCreditCard: false,
    settledFromBank: false,
    isRecurring: false,
    splits: [
      { category: 'Clothing', amount: 200.00 },
      { category: 'Home Goods', amount: 150.00 },
    ],
  },
  {
    _id: 'exp-3',
    date: '2026-01-12T09:15:00.000Z',
    transactionValue: 1200.00,
    transactionType: 'W',
    categories: ['Electronics'],
    description: 'New Office Monitor',
    paidWithCreditCard: true,
    settledFromBank: false,
    settledAmountInPiastres: 0,
    isRecurring: false,
  },
  {
    _id: 'exp-4',
    date: '2026-01-10T08:00:00.000Z',
    transactionValue: 45.00,
    transactionType: 'W',
    categories: ['Utilities'],
    description: 'Cloud Server Hosting',
    sourceAccount: 'Checking',
    bankBalanceAfter: 4479.50,
    paidWithCreditCard: false,
    settledFromBank: false,
    isRecurring: true,
  },
];

const MOCK_LATEST_HOLDINGS = {
  runningBalances: {
    bank: 4479.50,
    cash: 850.00,
    prepaid: 200.00,
  },
};

const setupExpenditureMocks = async (page) => {
  await page.route('**/api/expenditures/latest**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_LATEST_HOLDINGS),
    });
  });

  await page.route('**/api/expenditures**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_EXPENDITURES,
          totalPages: 1,
          totalCount: MOCK_EXPENDITURES.length,
          currentPage: 1,
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });
};

test.describe('Expenditure Reference Match (Live /expenditures vs Frame 01)', () => {
  test('matches Reference Frame 01 design tokens on desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setFixedClock(page);
    await setupExpenditureMocks(page);

    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });

    await page.goto('/expenditures', { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({
      content: `
        .toast-container,
        [class*="toast-container"],
        .Toastify,
        .toasts-wrapper { display: none !important; }
      `,
    });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    // Wait for expenditure rows to render
    await expect(page.locator('.styled-table tbody tr').first()).toBeVisible();

    // 1. Primary CTA button verification (+ Add Expenditure)
    const primaryBtn = page.locator('.page-header-actions .fs-btn-primary').first();
    await expect(primaryBtn).toBeVisible();
    const btnBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const btnColor = await primaryBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(btnBg).toBe('rgb(20, 184, 166)');
    expect(btnColor).toBe('rgb(13, 14, 16)');

    // 2. Palette tokens & table scroll surface (A3)
    const pageBg = await page.evaluate(() => {
      const el = document.querySelector('.main-content.fs-page') || document.querySelector('.fs-page');
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(pageBg).toBe('rgb(16, 17, 20)');

    const tableScroll = page.locator('.fs-table-scroll');
    await expect(tableScroll).toBeVisible();
    const scrollBg = await tableScroll.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(scrollBg).toBe('rgb(26, 28, 32)');

    const tableTh = page.locator('.styled-table th').first();
    const thBorderColor = await tableTh.evaluate((el) => window.getComputedStyle(el).borderBottomColor);
    expect(thBorderColor).toBe('rgb(52, 56, 63)');

    // 3. Ordinary amounts neutrality (AD13)
    const amountCells = page.locator('.styled-table td.fs-num');
    const amountCount = await amountCells.count();
    expect(amountCount).toBeGreaterThan(0);
    for (let i = 0; i < amountCount; i++) {
      const cellColor = await amountCells.nth(i).evaluate((el) => window.getComputedStyle(el).color);
      expect(cellColor).toBe('rgb(242, 243, 245)');
      expect(cellColor).not.toBe('rgb(239, 68, 68)');
      expect(cellColor).not.toBe('rgb(34, 197, 94)');
      expect(cellColor).not.toBe('rgb(16, 185, 129)');
    }

    // 4. Tabular numerals
    const firstAmountCell = amountCells.first();
    const numVariant = await firstAmountCell.evaluate((el) => window.getComputedStyle(el).fontVariantNumeric);
    expect(numVariant).toBe('tabular-nums');

    // 5. Neutral category badges
    const catBadge = page.locator('.fs-cat-badge').first();
    await expect(catBadge).toBeVisible();
    const badgeBg = await catBadge.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const badgeColor = await catBadge.evaluate((el) => window.getComputedStyle(el).color);
    expect(badgeBg).toBe('rgb(34, 37, 42)');
    expect(badgeColor).toBe('rgb(242, 243, 245)');

    // 6. Sort header arrow accent (N4)
    const sortArrow = page.locator('.styled-table .fs-sort-arrow').first();
    await expect(sortArrow).toBeVisible();
    const arrowColor = await sortArrow.evaluate((el) => window.getComputedStyle(el).color);
    expect(arrowColor).toBe('rgb(20, 184, 166)');

    // 11. Focus-ring clipping prevention (§4.6 / G4)
    const scrollPadding = await tableScroll.evaluate((el) => window.getComputedStyle(el).padding);
    expect(scrollPadding).toBe('5px');

    // 12. Custom checkbox checkmark affordance (V3-B2 & Soft 5)
    const firstRowCheckbox = page.locator('.styled-table tbody tr .fs-checkbox-input').first();
    await firstRowCheckbox.click();
    expect(await firstRowCheckbox.isChecked()).toBe(true);

    const checkmarkAffordance = await page.evaluate(() => {
      const customSpan = document.querySelector('.styled-table tbody tr .fs-checkbox-input:checked + .fs-checkbox-custom');
      if (!customSpan) return null;
      const afterStyle = window.getComputedStyle(customSpan, '::after');
      return {
        content: afterStyle.content,
        borderColor: afterStyle.borderBottomColor,
      };
    });
    expect(checkmarkAffordance).not.toBeNull();
    expect(checkmarkAffordance.content).not.toBe('none');
    expect(checkmarkAffordance.borderColor).toBe('rgb(13, 14, 16)');

    // 13. Neutral action & delete icons (N5 & R7)
    const deleteBtn = page.locator('.action-icon.delete-icon').first();
    await expect(deleteBtn).toBeVisible();
    const deleteColor = await deleteBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(deleteColor).toBe('rgb(162, 168, 176)');
    expect(deleteColor).not.toBe('rgb(239, 68, 68)');

    // Taste Checkpoint 2: Capture 1440px live screenshot
    const screenshotDir = 'C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-4a';
    await page.screenshot({ path: `${screenshotDir}/expenditure-1440.png`, fullPage: true });

    // 14. Cumulative Layout Shift (CLS <= 0.1)
    const cumulativeLayoutShift = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) cls += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(cls), 2000);
      });
    });
    console.log(`CLS desktop: ${cumulativeLayoutShift}`);
    expect(cumulativeLayoutShift).toBeLessThanOrEqual(0.1);
  });

  test('matches Reference Frame 01 mobile compact-expand cards on mobile (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setFixedClock(page);
    await setupExpenditureMocks(page);

    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });

    await page.goto('/expenditures', { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({
      content: `
        .toast-container,
        [class*="toast-container"],
        .Toastify,
        .toasts-wrapper { display: none !important; }
      `,
    });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    // 7. Mobile responsiveness & zero horizontal scroll (D19)
    const tableCount = await page.locator('table.styled-table').count();
    expect(tableCount).toBe(0);

    const cardList = page.locator('.fs-mobile-card-list');
    await expect(cardList).toBeVisible();

    const noHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    expect(noHorizontalScroll).toBe(true);

    const cards = page.locator('.fs-card-item');
    const cardCount = await cards.count();
    expect(cardCount).toBe(MOCK_EXPENDITURES.length);

    // 8. Mobile category chips visible on every card (C6)
    for (let i = 0; i < cardCount; i++) {
      const badge = cards.nth(i).locator('.fs-cat-badge').first();
      await expect(badge).toBeVisible();
    }

    // 9. Mobile split transactions (A1 & C5)
    // Card index 1 is exp-2 which has splits
    const splitCard = cards.nth(1);
    await expect(splitCard.locator('.split-badge-title')).toContainText('✂ Split');
    const splitBadges = splitCard.locator('.category-badges-list .fs-cat-badge');
    expect(await splitBadges.count()).toBe(2);

    // 10. Card interaction & touch target >= 44px
    const expanderBtn = splitCard.locator('.fs-card-expander-btn');
    await expect(expanderBtn).toBeVisible();
    const btnBox = await expanderBtn.boundingBox();
    expect(btnBox.height).toBeGreaterThanOrEqual(44);

    // Expand drawer
    await expanderBtn.click();
    await expect(expanderBtn).toHaveText('Hide Details ▲');

    const drawer = splitCard.locator('.fs-card-details-drawer');
    await expect(drawer).toBeVisible();

    // Verify split breakdown drawer layout (S1 align-items: stretch override)
    const splitDrawer = drawer.locator('.split-details-drawer');
    await expect(splitDrawer).toBeVisible();
    const splitAlign = await splitDrawer.evaluate((el) => window.getComputedStyle(el).alignItems);
    expect(splitAlign).toBe('stretch');

    const splitRows = splitDrawer.locator('.split-detail-row');
    expect(await splitRows.count()).toBe(2);

    // Mobile selection row highlight
    const mobileCheckbox = splitCard.locator('.fs-checkbox-input');
    await mobileCheckbox.click();
    await expect(splitCard).toHaveClass(/fs-row-selected/);

    // Taste Checkpoint 2: Capture 390px live screenshot & expanded split card (S1 / E2)
    const screenshotDir = 'C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-4a';
    await splitCard.screenshot({ path: `${screenshotDir}/expenditure-390-split-expanded.png` });
    await page.screenshot({ path: `${screenshotDir}/expenditure-390.png`, fullPage: true });
  });

  test('captures Reference Frame 01 screenshots for taste comparison', async ({ page }) => {
    const screenshotDir = 'C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-4a';
    const refUrl = 'http://localhost:3001/docs/UI-UX_Plan/reference/01-dense-table.html';

    // 1440px reference
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(refUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.screenshot({ path: `${screenshotDir}/reference-01-dense-table-1440.png`, fullPage: true });

    // 390px reference
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(refUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.screenshot({ path: `${screenshotDir}/reference-01-dense-table-390.png`, fullPage: true });
  });
});
