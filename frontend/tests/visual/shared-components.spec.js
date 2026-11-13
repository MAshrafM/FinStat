/**
 * frontend/tests/visual/shared-components.spec.js
 *
 * Dual-Mode Computed Style Verification for Phase 2D Shared Overrides:
 * Governed by docs/ui-plans/phase_2d_implementation_plan.md §4.2 and UI-UX-PLAN §6.6 (Exit Gate 2D).
 *
 * Verifies that:
 * 1. Legacy context (un-scoped) renders 100% legacy styles.
 * 2. Themed context (.fs-page + data-fs-theme) overrides defeat legacy rules in browser computed styles.
 * 3. Captures screenshot evidence for walkthrough.
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FIXTURE_URL = 'http://localhost:3001/frontend/tests/visual/fixtures/shared/shared-components.html';
const OUTPUT_DIR = path.join(__dirname, 'output/phase-2d');

test.describe('Phase 2D: Shared Components Dual-Mode Verification', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  test('Table: computed styles verify legacy vs .fs-page theme override', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy checks (outside .fs-page)
    const legacyThBg = await page.$eval('.legacy-table thead tr', el => window.getComputedStyle(el).backgroundColor);
    const legacyZebraBg = await page.$eval('.legacy-table tbody tr:nth-of-type(even)', el => window.getComputedStyle(el).backgroundColor);
    expect(legacyThBg).toBe('rgb(0, 152, 121)');     // #009879
    expect(legacyZebraBg).toBe('rgb(243, 243, 243)'); // #f3f3f3

    // 2. Themed checks (inside .fs-page)
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedThBg = await page.$eval('.themed-table thead tr', el => window.getComputedStyle(el).backgroundColor);
    const themedThColor = await page.$eval('.themed-table th', el => window.getComputedStyle(el).color);
    const themedZebraBg = await page.$eval('.themed-table tbody tr:nth-of-type(even)', el => window.getComputedStyle(el).backgroundColor);

    expect(themedThBg).toBe('rgb(12, 13, 15)');       // #0c0d0f (--fs-surface-sunken)
    expect(themedThColor).toBe('rgb(162, 168, 176)');  // #a2a8b0 (--fs-text-3)
    expect(themedZebraBg).toBe('rgb(12, 13, 15)');    // #0c0d0f (--fs-surface-sunken)

    // Capture screenshots
    await page.locator('.legacy-table-container').screenshot({ path: path.join(OUTPUT_DIR, 'table-legacy-1440.png') });
    await page.locator('.themed-table-container').screenshot({ path: path.join(OUTPUT_DIR, 'table-dark-1440.png') });
  });

  test('Form: computed styles verify legacy vs .fs-page theme override', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy checks
    const legacyInputBorder = await page.$eval('.legacy-input', el => window.getComputedStyle(el).borderColor);
    const legacyBtnBg = await page.$eval('.legacy-submit-button', el => window.getComputedStyle(el).backgroundColor);
    const legacyBtnRadius = await page.$eval('.legacy-submit-button', el => window.getComputedStyle(el).borderRadius);

    expect(legacyInputBorder).toBe('rgb(204, 204, 204)'); // #ccc
    expect(legacyBtnBg).toBe('rgb(0, 152, 121)');         // #009879
    expect(legacyBtnRadius).toBe('5px');

    // 2. Themed checks
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedInputBg = await page.$eval('.themed-input', el => window.getComputedStyle(el).backgroundColor);
    const themedInputBorder = await page.$eval('.themed-input', el => window.getComputedStyle(el).borderColor);
    const themedBtnBg = await page.$eval('.themed-submit-button', el => window.getComputedStyle(el).backgroundColor);
    const themedBtnColor = await page.$eval('.themed-submit-button', el => window.getComputedStyle(el).color);
    const themedBtnRadius = await page.$eval('.themed-submit-button', el => window.getComputedStyle(el).borderRadius);

    expect(themedInputBg).toBe('rgb(26, 28, 32)');        // #1a1c20 (--fs-surface)
    expect(themedInputBorder).toBe('rgb(106, 111, 119)');  // #6a6f77 (--fs-border-control)
    expect(themedBtnBg).toBe('rgb(20, 184, 166)');        // #14b8a6 (--fs-action-bg)
    expect(themedBtnColor).toBe('rgb(13, 14, 16)');       // #0d0e10 (--fs-action-text)
    expect(themedBtnRadius).toBe('4px');                  // var(--fs-radius-sm)

    // Capture screenshots
    await page.locator('.legacy-form-container').screenshot({ path: path.join(OUTPUT_DIR, 'form-legacy-1440.png') });
    await page.locator('.themed-form-container').screenshot({ path: path.join(OUTPUT_DIR, 'form-dark-1440.png') });
  });

  test('Modal: computed styles verify legacy vs theme override (8px ceiling)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy checks
    const legacyContentBg = await page.$eval('.legacy-modal-content', el => window.getComputedStyle(el).backgroundColor);
    const legacyRadius = await page.$eval('.legacy-modal-content', el => window.getComputedStyle(el).borderRadius);
    expect(legacyContentBg).toBe('rgb(255, 255, 255)');
    expect(legacyRadius).toBe('12px');

    // 2. Themed checks
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedOverlayBg = await page.$eval('.themed-modal-overlay', el => window.getComputedStyle(el).backgroundColor);
    const themedOverlayBackdrop = await page.$eval('.themed-modal-overlay', el => window.getComputedStyle(el).backdropFilter);
    const themedContentBg = await page.$eval('.themed-modal-content', el => window.getComputedStyle(el).backgroundColor);
    const themedRadius = await page.$eval('.themed-modal-content', el => window.getComputedStyle(el).borderRadius);

    expect(themedOverlayBg).toBe('rgba(8, 9, 11, 0.72)'); // --fs-scrim
    expect(themedOverlayBackdrop).toBe('none');
    expect(themedContentBg).toBe('rgb(26, 28, 32)');         // #1a1c20 (--fs-surface)
    expect(themedRadius).toBe('8px');                       // var(--fs-radius-lg) 8px ceiling

    // Capture screenshots
    await page.locator('.legacy-modal-content').screenshot({ path: path.join(OUTPUT_DIR, 'modal-legacy-1440.png') });
    await page.locator('.themed-modal-content').screenshot({ path: path.join(OUTPUT_DIR, 'modal-dark-1440.png') });
  });

  test('ConfirmModal: computed styles verify legacy vs theme override', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy checks
    const legacyContentBg = await page.$eval('.legacy-confirm-content', el => window.getComputedStyle(el).backgroundColor);
    const legacyRadius = await page.$eval('.legacy-confirm-content', el => window.getComputedStyle(el).borderRadius);
    const legacyDangerBg = await page.$eval('.legacy-confirm-danger', el => window.getComputedStyle(el).backgroundColor);
    const legacyBackdrop = await page.$eval('.legacy-confirm-overlay', el => window.getComputedStyle(el).backdropFilter);
    expect(legacyContentBg).toBe('rgb(255, 255, 255)');
    expect(legacyRadius).toBe('12px');
    expect(legacyDangerBg).toBe('rgb(220, 38, 38)'); // #dc2626
    expect(legacyBackdrop).toBe('blur(2px)');

    // 2. Themed checks
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedContentBg = await page.$eval('.themed-confirm-content', el => window.getComputedStyle(el).backgroundColor);
    const themedRadius = await page.$eval('.themed-confirm-content', el => window.getComputedStyle(el).borderRadius);
    const themedDangerBg = await page.$eval('.themed-confirm-danger', el => window.getComputedStyle(el).backgroundColor);
    const themedDangerColor = await page.$eval('.themed-confirm-danger', el => window.getComputedStyle(el).color);
    const themedBackdrop = await page.$eval('.themed-confirm-overlay', el => window.getComputedStyle(el).backdropFilter);

    expect(themedContentBg).toBe('rgb(26, 28, 32)');     // #1a1c20 (--fs-surface)
    expect(themedRadius).toBe('8px');                   // var(--fs-radius-lg) 8px ceiling
    expect(themedDangerBg).toBe('rgb(217, 112, 118)');   // #d97076 (--fs-danger)
    expect(themedDangerColor).toBe('rgb(13, 14, 16)');  // #0d0e10 (--fs-ink)
    expect(themedBackdrop).toBe('none');

    // Capture screenshots
    await page.locator('.legacy-confirm-content').screenshot({ path: path.join(OUTPUT_DIR, 'confirm-legacy-1440.png') });
    await page.locator('.themed-confirm-content').screenshot({ path: path.join(OUTPUT_DIR, 'confirm-dark-1440.png') });
  });

  test('SummaryRow & AnalysisCard: computed styles verify theme overrides', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy checks
    const legacySummaryBg = await page.$eval('.legacy-summary-row', el => window.getComputedStyle(el).backgroundColor);
    const legacyAnalysisBg = await page.$eval('.legacy-analysis-card', el => window.getComputedStyle(el).backgroundColor);
    expect(legacySummaryBg).toBe('rgb(248, 249, 250)');   // #f8f9fa
    expect(legacyAnalysisBg).toBe('rgb(255, 255, 255)');  // #ffffff

    // 2. Themed checks
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedSummaryBg = await page.$eval('.themed-summary-row', el => window.getComputedStyle(el).backgroundColor);
    const themedPeriodBg = await page.$eval('.themed-period-item', el => window.getComputedStyle(el).backgroundColor);
    const themedAnalysisBg = await page.$eval('.themed-analysis-card', el => window.getComputedStyle(el).backgroundColor);

    expect(themedSummaryBg).toBe('rgb(26, 28, 32)');     // #1a1c20 (--fs-surface)
    expect(themedPeriodBg).toBe('rgb(34, 37, 42)');      // #22252a (--fs-surface-raised)
    expect(themedAnalysisBg).toBe('rgb(26, 28, 32)');    // #1a1c20 (--fs-surface)

    // Capture screenshots
    await page.locator('.legacy-summary-row').screenshot({ path: path.join(OUTPUT_DIR, 'summary-legacy-1440.png') });
    await page.locator('.themed-summary-row').screenshot({ path: path.join(OUTPUT_DIR, 'summary-dark-1440.png') });
  });

  test('ComponentTable: computed styles verify theme overrides', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy checks
    const legacyWrapperBg = await page.$eval('.legacy-component-table-wrapper', el => window.getComputedStyle(el).backgroundColor);
    const legacyThBg = await page.$eval('.legacy-custom-table th', el => window.getComputedStyle(el).backgroundColor);
    expect(legacyWrapperBg).toBe('rgb(255, 255, 255)');
    expect(legacyThBg).toBe('rgb(248, 250, 252)'); // #f8fafc

    // 2. Themed checks
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedWrapperBg = await page.$eval('.themed-component-table-wrapper', el => window.getComputedStyle(el).backgroundColor);
    const themedThBg = await page.$eval('.themed-custom-table th', el => window.getComputedStyle(el).backgroundColor);

    expect(themedWrapperBg).toBe('rgb(26, 28, 32)');   // #1a1c20 (--fs-surface)
    expect(themedThBg).toBe('rgb(12, 13, 15)');       // #0c0d0f (--fs-surface-sunken)

    // Capture screenshots
    await page.locator('.legacy-component-table-wrapper').screenshot({ path: path.join(OUTPUT_DIR, 'component-table-legacy-1440.png') });
    await page.locator('.themed-component-table-wrapper').screenshot({ path: path.join(OUTPUT_DIR, 'component-table-dark-1440.png') });
  });

  test('ViewOnlyBanner: computed styles verify theme overrides and backdrop-filter none', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy checks
    const legacyBackdrop = await page.$eval('.legacy-view-only', el => window.getComputedStyle(el).backdropFilter);
    expect(legacyBackdrop).toBe('blur(8px)');

    // 2. Themed checks
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedBg = await page.$eval('.themed-view-only', el => window.getComputedStyle(el).backgroundColor);
    const themedColor = await page.$eval('.themed-view-only', el => window.getComputedStyle(el).color);
    const themedBackdrop = await page.$eval('.themed-view-only', el => window.getComputedStyle(el).backdropFilter);

    expect(themedBg).toBe('rgb(34, 37, 42)');       // --fs-surface-raised
    expect(themedColor).toBe('rgb(207, 162, 79)');   // --fs-warning (#cfa24f)
    expect(themedBackdrop).toBe('none');
  });

  test('ProtectedAction: computed styles verify opacity gating', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // Themed checks
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedDisplay = await page.$eval('.themed-protected', el => window.getComputedStyle(el).display);
    const themedOpacity = await page.$eval('.themed-protected-btn', el => window.getComputedStyle(el).opacity);

    expect(themedDisplay).toBe('inline-flex');
    expect(themedOpacity).toBe('0.45');             // --fs-disabled-opacity
  });

  test('Pagination: computed styles verify theme overrides', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // Themed checks
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedBtnBg = await page.$eval('.themed-page-btn', el => window.getComputedStyle(el).backgroundColor);
    const themedBtnBorder = await page.$eval('.themed-page-btn', el => window.getComputedStyle(el).borderColor);

    expect(themedBtnBg).toBe('rgb(26, 28, 32)');        // --fs-surface
    expect(themedBtnBorder).toBe('rgb(106, 111, 119)');  // --fs-border-control (#6a6f77)
  });

  test('AppLauncher: computed styles verify theme overrides and backdrop-filter none', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FIXTURE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Legacy checks
    const legacyBackdrop = await page.$eval('.legacy-launcher-backdrop', el => window.getComputedStyle(el).backdropFilter);
    expect(legacyBackdrop).toBe('blur(10px)');

    // 2. Themed checks
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
    const themedPanelBg = await page.$eval('.themed-launcher-panel', el => window.getComputedStyle(el).backgroundColor);
    const themedPanelRadius = await page.$eval('.themed-launcher-panel', el => window.getComputedStyle(el).borderRadius);
    const themedBackdrop = await page.$eval('.themed-launcher-backdrop', el => window.getComputedStyle(el).backdropFilter);

    expect(themedPanelBg).toBe('rgb(26, 28, 32)');    // --fs-surface
    expect(themedPanelRadius).toBe('8px');            // --fs-radius-lg (8px ceiling)
    expect(themedBackdrop).toBe('none');
  });
});

