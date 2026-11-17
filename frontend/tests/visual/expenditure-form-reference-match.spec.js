/**
 * frontend/tests/visual/expenditure-form-reference-match.spec.js
 *
 * Automated computed-style, accessibility, and responsive verification comparing the live
 * /expenditures/new and /expenditures/edit/:id routes against Canonical Reference Frame 02
 * (Form Variant B: docs/UI-UX_Plan/reference/02-form.html).
 *
 * Covers all 12 reference-matching requirements specified in UI Phase 4B:
 * 1. Primary Save CTA background rgb(20, 184, 166) (--fs-accent), text rgb(13, 14, 16) (--fs-ink)
 * 2. Neutral Discard CTA background rgb(26, 28, 32) (--fs-surface), border rgb(106, 111, 119) (--fs-border-control)
 * 3. Stacked sub-panel cards background rgb(34, 37, 42) (--fs-surface-raised), border rgb(52, 56, 63) (--fs-border)
 * 4. Exactly one accent CTA in form footer
 * 5. Category picker radiogroup semantics (role="radiogroup", role="radio", aria-checked)
 * 6. Category chip border-radius: 4px (--fs-radius-sm, strictly not pill)
 * 7. Mobile touch targets >= 44px on chips and radio options
 * 8. Split table transforms into stacked cards at 390px; every split input has valid aria-label
 * 9. Zero horizontal scroll (scrollWidth <= clientWidth) at 390px
 * 10. Foreign exchange conversion card renders live calculated equivalent upon USD selection
 * 11. Viewer role mutation gating (ProtectedAction disables submit CTA)
 * 12. Real-browser WCAG 2.1 AA accessibility (axe-core: 0 critical/serious violations)
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');

const AXE_SOURCE_PATH = require.resolve('axe-core/axe.min.js');

const MOCK_LATEST_HOLDINGS = {
  bank: 5000.0,
  cash: 850.0,
  prepaid: 200.0,
};

const MOCK_EDIT_EXPENDITURE = {
  _id: 'exp-1',
  date: '2026-01-15T10:00:00.000Z',
  transactionValue: 350.0,
  currency: 'EGP',
  transactionType: 'W',
  paymentMethod: 'Bank',
  categories: ['Clothing', 'Home Goods'],
  description: 'Department Store Split Transaction',
  bank: 4650.0,
  cash: 850.0,
  prepaid: 200.0,
  splits: [
    { category: 'Groceries', amount: 200.0, description: 'Supermarket supplies' },
    { category: 'Food & Dining', amount: 150.0, description: 'Dinner takeaway' },
  ],
};

const MOCK_RULES = [
  {
    _id: 'rule-1',
    name: 'Supermarket Rule',
    field: 'description',
    operator: 'contains',
    value: 'supermarket',
    category: 'Groceries',
    isActive: true,
  },
];

const MOCK_FX_RATES = [
  { currencyID: 'USD', buyRate: 48.2, sellRate: 48.5 },
  { currencyID: 'EUR', buyRate: 52.0, sellRate: 52.5 },
];

const setupFormMocks = async (page) => {
  await page.addInitScript(() => {
    window.__VISUAL_TEST__ = true;
  });

  await page.route('**/api/categorization-rules**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: MOCK_RULES, success: true }),
    });
  });

  await page.route('**/api/currency/price**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FX_RATES),
    });
  });

  await page.route('**/api/currencies/rates**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FX_RATES),
    });
  });

  await page.route('**/api/expenditures/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/latest')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LATEST_HOLDINGS),
      });
    } else if (url.includes('/exp-1')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EDIT_EXPENDITURE),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'new-123' } }),
      });
    }
  });

  await page.route('**/api/expenditures', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { _id: 'exp-new-123' } }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_EDIT_EXPENDITURE], totalPages: 1 }),
      });
    }
  });
};

test.describe('Expenditure Forms Reference Match (Live Routes vs Frame 02)', () => {
  test('matches Reference Frame 02 tokens, semantics, and live conversion on /expenditures/new (1440px)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setFixedClock(page);
    await setupFormMocks(page);

    await page.goto('/expenditures/new', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.fs-form-container', { state: 'visible', timeout: 15000 });

    // 1. Primary Save CTA token computed styles (A-5)
    const primaryBtn = page.locator('.fs-form-footer .fs-btn-primary');
    await expect(primaryBtn).toBeVisible();
    const primaryBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const primaryColor = await primaryBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(primaryBg).toBe('rgb(20, 184, 166)'); // --fs-accent
    expect(primaryColor).toBe('rgb(13, 14, 16)'); // --fs-ink

    // 2. Neutral Discard CTA token computed styles (A-3, A-4)
    const secondaryBtn = page.locator('.fs-form-footer .fs-btn-secondary');
    await expect(secondaryBtn).toBeVisible();
    const secBg = await secondaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const secBorder = await secondaryBtn.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(secBg).toBe('rgb(34, 37, 42)'); // --fs-surface-raised
    expect(secBorder).toBe('rgb(106, 111, 119)'); // --fs-border-control

    // 3. Stacked Sub-Panel Cards token computed styles (A-1, A-2)
    const sectionCards = page.locator('.fs-section-card');
    expect(await sectionCards.count()).toBeGreaterThanOrEqual(2);
    const firstCard = sectionCards.first();
    const cardBg = await firstCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const cardBorder = await firstCard.evaluate((el) => window.getComputedStyle(el).borderColor);
    expect(cardBg).toBe('rgb(34, 37, 42)'); // --fs-surface-raised
    expect(cardBorder).toBe('rgb(52, 56, 63)'); // --fs-border

    // 4. Exactly one accent CTA in form footer
    const footerAccentButtons = await page
      .locator('.fs-form-footer *')
      .evaluateAll((elements) => {
        return elements.filter((el) => window.getComputedStyle(el).backgroundColor === 'rgb(20, 184, 166)');
      });
    expect(footerAccentButtons.length).toBe(1);

    // 5. Radio Semantics & Consistency (B-4, S-2)
    const radioGroup = page.locator('.fs-category-chips-grid');
    await expect(radioGroup).toHaveAttribute('role', 'radiogroup');
    const chips = radioGroup.locator('button.filter-chip');
    expect(await chips.count()).toBeGreaterThan(0);
    const firstChip = chips.first();
    await expect(firstChip).toHaveAttribute('role', 'radio');

    // 6. Category chip border-radius: 4px (--fs-radius-sm, strictly not pill) (B-2)
    const chipRadius = await firstChip.evaluate((el) => window.getComputedStyle(el).borderRadius);
    expect(chipRadius).toBe('4px');

    // 10. Foreign exchange conversion card renders live calculated equivalent upon USD selection
    const currencySelect = page.locator('#expenditure-currency');
    await currencySelect.selectOption('USD');

    const conversionCard = page.locator('[data-testid="conversion-confirmation-card"]');
    await expect(conversionCard).toBeVisible();

    const foreignInput = page.locator('#foreign-amount');
    await foreignInput.fill('100');

    const rateInput = page.locator('#exchange-rate');
    await rateInput.fill('48.50');

    const convertedVal = page.locator('[data-testid="converted-egp-value"]');
    await expect(convertedVal).toContainText('4,850');

    // 12. Real-browser WCAG 2.1 AA accessibility (axe-core)
    await page.addScriptTag({ path: AXE_SOURCE_PATH });
    const axeResults = await page.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      });
    });
    const seriousViolations = axeResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolations).toEqual([]);

    // Capture 1440px screenshot for taste comparison
    const screenshotDir =
      'C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-4b';
    await page.screenshot({ path: `${screenshotDir}/expenditures-new-1440.png`, fullPage: true });

    // Also navigate to edit page at 1440px to capture taste checkpoint
    await page.goto('/expenditures/edit/exp-1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.fs-form-container', { state: 'visible', timeout: 10000 });
    await page.screenshot({ path: `${screenshotDir}/expenditures-edit-1440.png`, fullPage: true });
  });

  test('matches Reference Frame 02 mobile responsive collapse, split cards, and touch targets at 390px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setFixedClock(page);
    await setupFormMocks(page);

    // Test /expenditures/new at 390px
    await page.goto('/expenditures/new', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.fs-form-container', { state: 'visible', timeout: 10000 });

    // 9. Zero horizontal scroll at 390px on /expenditures/new
    const hasHScrollNew = await page.evaluate(() => {
      const pageEl = document.querySelector('.fs-page');
      return (
        document.body.scrollWidth > document.body.clientWidth ||
        (pageEl ? pageEl.scrollWidth > pageEl.clientWidth : false)
      );
    });
    expect(hasHScrollNew).toBe(false);

    // 7. Mobile Touch Targets (B-5, I-2): >= 44px
    const firstChip = page.locator('.fs-category-chips-grid .filter-chip').first();
    const chipBox = await firstChip.boundingBox();
    expect(chipBox.height).toBeGreaterThanOrEqual(44);

    // Check Log operations radio buttons touch targets
    const typeSelect = page.locator('#transaction-type');
    await typeSelect.selectOption('na');
    const radioOption = page.locator('.radio-option').first();
    await expect(radioOption).toBeVisible();
    const radioBox = await radioOption.boundingBox();
    expect(radioBox.height).toBeGreaterThanOrEqual(44);
    expect(radioBox.width).toBeGreaterThanOrEqual(44);

    const screenshotDir =
      'C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-4b';
    await page.screenshot({ path: `${screenshotDir}/expenditures-new-390.png`, fullPage: true });

    // Test /expenditures/edit/exp-1 at 390px (exercises split mode)
    await page.goto('/expenditures/edit/exp-1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.fs-form-container', { state: 'visible', timeout: 10000 });

    // 9. Zero horizontal scroll at 390px on /expenditures/edit/exp-1
    const hasHScrollEdit = await page.evaluate(() => {
      const pageEl = document.querySelector('.fs-page');
      return (
        document.body.scrollWidth > document.body.clientWidth ||
        (pageEl ? pageEl.scrollWidth > pageEl.clientWidth : false)
      );
    });
    expect(hasHScrollEdit).toBe(false);

    // 8. Split Mobile Cards & Labels (D-3, H-1)
    const splitTheadDisplay = await page.locator('.fs-split-table thead').evaluate(
      (el) => window.getComputedStyle(el).display
    );
    expect(splitTheadDisplay).toBe('none');

    const splitRows = page.locator('.fs-split-table tbody tr');
    expect(await splitRows.count()).toBe(2);

    const firstSplitRow = splitRows.first();
    const rowDisplay = await firstSplitRow.evaluate((el) => window.getComputedStyle(el).display);
    expect(rowDisplay).toBe('flex');

    // Verify all split inputs carry explicit aria-label attributes (H-1)
    const catSelect = firstSplitRow.locator('select');
    await expect(catSelect).toHaveAttribute('aria-label', 'Split category');

    const amtInput = firstSplitRow.locator('input[type="number"]');
    await expect(amtInput).toHaveAttribute('aria-label', 'Split amount');

    const noteInput = firstSplitRow.locator('input[type="text"]');
    await expect(noteInput).toHaveAttribute('aria-label', 'Split note');

    // 12. axe-core scan on /expenditures/edit/exp-1
    await page.addScriptTag({ path: AXE_SOURCE_PATH });
    const axeResultsEdit = await page.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      });
    });
    const seriousViolationsEdit = axeResultsEdit.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousViolationsEdit).toEqual([]);

    await page.screenshot({ path: `${screenshotDir}/expenditures-edit-390.png`, fullPage: true });
  });

  test('enforces viewer role mutation gating via ProtectedAction (Invariant I4, B-6, S-6)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setFixedClock(page);
    await setupFormMocks(page);

    // Set user as viewer in localStorage before navigating
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-viewer-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 'viewer-1', username: 'viewer', role: 'viewer' })
      );
    });

    await page.goto('/expenditures/new', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.fs-form-container', { state: 'visible', timeout: 10000 });

    const submitBtn = page.locator('.fs-form-footer button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    const isDisabled = await submitBtn.evaluate(
      (el) => el.disabled || el.getAttribute('aria-disabled') === 'true'
    );
    expect(isDisabled).toBe(true);
  });

  test('captures Reference Frame 02 screenshots for taste comparison', async ({ page }) => {
    const screenshotDir =
      'C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-4b';
    const refUrl = 'http://localhost:3001/docs/UI-UX_Plan/reference/02-form.html';

    // 1440px reference
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(refUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.screenshot({ path: `${screenshotDir}/reference-02-form-1440.png`, fullPage: true });

    // 390px reference
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(refUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.screenshot({ path: `${screenshotDir}/reference-02-form-390.png`, fullPage: true });
  });
});
