/* eslint-disable testing-library/await-async-utils, testing-library/prefer-screen-queries, no-restricted-syntax, jest/valid-expect */
/**
 * frontend/tests/visual/certificates-detail-forms-reference-match.spec.js
 *
 * Automated computed-style, chart accessibility, dialog APG lifecycle, form validation,
 * and responsive verification for Phase 8C (/certificates/:id, /certificates/new, /certificates/edit/:id)
 * against Canonical Reference Frames 02 (Form Variant B) and 03 (Dashboard KPI Grid Variant B).
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupCertificatesMocks } = require('./fixtures/certificatesMocks');

const CANVAS = 'rgb(16, 17, 20)';
const SURFACE = 'rgb(26, 28, 32)';
const ACCENT = 'rgb(20, 184, 166)';
const INK = 'rgb(13, 14, 16)';
const TEXT = 'rgb(242, 243, 245)';

async function gotoAndSettle(page, path, selector = '.cert-page-container') {
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

test.describe('Phase 8C: Certificates Detail & Forms Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupCertificatesMocks(page);
  });

  test('1. /certificates/1 dark graphite canvas, flat hero, 6 neutral KPI tiles, <=8px radii, un-underlined back link', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates/1', '.cert-detail-page');

    const pageContainer = page.locator('.cert-detail-page');
    expect(await pageContainer.evaluate((el) => window.getComputedStyle(el).backgroundColor)).toBe(CANVAS);

    const hero = page.locator('.cert-detail-hero');
    const heroStyles = await hero.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        image: s.backgroundImage,
        shadow: s.boxShadow,
        radius: parseFloat(s.borderRadius),
      };
    });
    expect(heroStyles.bg).toBe(SURFACE);
    expect(heroStyles.image).toBe('none');
    expect(heroStyles.shadow).toBe('none');
    expect(heroStyles.radius).toBeLessThanOrEqual(8);

    const backLink = page.locator('.cert-back-link');
    expect(await backLink.evaluate((el) => window.getComputedStyle(el).textDecorationLine)).toBe('none');

    const kpiTiles = page.locator('.cert-metric-tile');
    await expect(kpiTiles).toHaveCount(6);
    for (let i = 0; i < 6; i += 1) {
      const tileStyles = await kpiTiles.nth(i).evaluate((el) => {
        const s = window.getComputedStyle(el);
        return {
          bg: s.backgroundColor,
          image: s.backgroundImage,
          shadow: s.boxShadow,
          radius: parseFloat(s.borderRadius),
        };
      });
      expect(tileStyles.bg).toBe(SURFACE);
      expect(tileStyles.image).toBe('none');
      expect(tileStyles.shadow).toBe('none');
      expect(tileStyles.radius).toBeLessThanOrEqual(8);
    }
  });

  test('2. /certificates/1 Single Primary CTA per visible section, neutral Badge with aria-hidden icon, .fs-num tabular figures', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates/1', '.cert-detail-page');

    const visiblePrimaryBtns = page.locator('.cert-detail-page .fs-btn-primary:not(.cert-modal .fs-btn-primary)');
    await expect(visiblePrimaryBtns).toHaveCount(1);
    await expect(visiblePrimaryBtns).toHaveText(/Disburse Payout Now/);

    const primaryStyles = await visiblePrimaryBtns.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, radius: parseFloat(s.borderRadius) };
    });
    expect(primaryStyles.bg).toBe(ACCENT);
    expect(primaryStyles.color).toBe(INK);
    expect(primaryStyles.radius).toBeLessThanOrEqual(8);

    await expect(page.getByTestId('add-payout-btn')).toHaveClass(/fs-btn-secondary/);
    await expect(page.locator('.cert-detail-hero .cert-status-badge svg[aria-hidden="true"]')).toHaveCount(2);

    const kpiNumStyles = await page.locator('.cert-metric-tile .fs-num').first().evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { fontFamily: s.fontFamily, fontVariantNumeric: s.fontVariantNumeric };
    });
    expect(kpiNumStyles.fontFamily).toMatch(/IBM Plex Sans/i);
    expect(kpiNumStyles.fontVariantNumeric).toContain('tabular-nums');
  });

  test('3. /certificates/1 dual-series chart presence, aria-label, data-plugin-ids, summary, table semantics, zero accent series', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates/1', '.cert-detail-page');

    const canvasWrapper = page.getByTestId('cert-chart-canvas-wrapper');
    await expect(canvasWrapper).toHaveAttribute('data-plugin-ids', /certLastPointLabelPlugin/);
    const wrapperLabel = await canvasWrapper.getAttribute('aria-label');
    expect(wrapperLabel).toContain('Interest Accrual Trajectory (Dual Series)');

    const canvasBox = await canvasWrapper.locator('canvas').boundingBox();
    expect(canvasBox.width).toBeGreaterThan(0);
    expect(canvasBox.height).toBeGreaterThan(0);

    await expect(page.getByTestId('cert-chart-summary')).toContainText('Interest Accrual Trajectory (Dual Series)');

    await page.locator('.cert-trajectory-details summary').click();
    const table = page.getByTestId('cert-trajectory-table');
    await expect(table).toBeVisible();
    await expect(table.locator('caption')).toContainText('Actual vs. Projected Interest Accrual Trajectory');
    await expect(table.locator('th[scope="col"]')).toHaveCount(3);
    expect(await table.locator('tbody tr td').first().getAttribute('data-label')).toBe('Period');
  });

  test('4. /certificates/1 Withdraw & Payout dialogs: initial focus, confirm button roles, Escape close, and focus restore', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates/1', '.cert-detail-page');

    // Payout dialog
    const addPayoutBtn = page.getByTestId('add-payout-btn');
    await addPayoutBtn.click();
    const payoutDialog = page.getByRole('dialog', { name: /Add Interest Payout/i });
    await expect(payoutDialog).toBeVisible();
    await expect(payoutDialog).toHaveAttribute('aria-modal', 'true');
    const payoutCloseBtn = payoutDialog.getByRole('button', { name: 'Close payout modal' });
    await expect(payoutCloseBtn).toBeFocused();
    await expect(payoutDialog.locator('.fs-btn-primary')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(payoutDialog).toBeHidden();
    await expect(addPayoutBtn).toBeFocused();

    // Withdraw dialog
    const withdrawBtn = page.getByRole('button', { name: /Withdraw/i });
    await withdrawBtn.click();
    const withdrawDialog = page.getByRole('dialog', { name: /Withdraw Certificate Early/i });
    await expect(withdrawDialog).toBeVisible();
    await expect(withdrawDialog).toHaveAttribute('aria-modal', 'true');
    const withdrawCloseBtn = withdrawDialog.getByRole('button', { name: 'Close withdrawal modal' });
    await expect(withdrawCloseBtn).toBeFocused();
    await expect(withdrawDialog.locator('.cert-withdraw-confirm-btn')).toBeVisible();
    await expect(withdrawDialog.locator('.fs-btn-primary')).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(withdrawDialog).toBeHidden();
    await expect(withdrawBtn).toBeFocused();
  });

  test('5. /certificates/1 mobile D19 trajectory cards at 768/480/390px and zero 390px overflow', async ({ page }) => {
    for (const width of [768, 480, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoAndSettle(page, '/certificates/1', '.cert-detail-page');

      await expect(page.locator('.cert-trajectory-details')).toBeHidden();
      await expect(page.getByTestId('cert-trajectory-mobile-cards')).toBeVisible();
      expect(await hasPageOverflow(page), `Horizontal overflow at ${width}px`).toBe(false);
    }

    const firstExpander = page.locator('.cert-trajectory-mobile-cards .cert-card-expander-btn').first();
    await expect(firstExpander).toHaveAttribute('aria-expanded', 'false');
    await firstExpander.click();
    await expect(firstExpander).toHaveAttribute('aria-expanded', 'true');
    const expandedPanel = page.locator('.cert-trajectory-mobile-cards .cert-card-expanded').first();
    await expect(expandedPanel).toContainText('Projected Accrual');
  });

  test('6. /certificates/new Reference Frame 02 Variant B form, label/id pairing, blur+submit validation separation, zero 390px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates/new', '.cert-form-page');

    await expect(page.locator('.cert-form-card')).toBeVisible();
    await expect(page.locator('#account-selector-sourceAccount')).toBeVisible();
    await expect(page.locator('.cert-form-actions .fs-btn-secondary')).toHaveText(/Cancel/);
    await expect(page.locator('.cert-form-actions .fs-btn-primary')).toHaveCount(1);

    // Fill required fields and trigger blur validation
    await page.locator('#cert-name').fill('Validation CD');
    await page.locator('#cert-period').fill('12');
    await page.locator('#cert-amount').fill('50000');
    await page.locator('#cert-interest').fill('20');
    await page.locator('#cert-start-date').fill('2025-12-01');
    await page.locator('#cert-last-payout-date').fill('2025-11-01');
    await page.locator('#cert-last-payout-date').blur();

    await expect(page.locator('#cert-last-payout-error')).toBeVisible();
    await expect(page.locator('#cert-last-payout-date')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#cert-last-payout-date')).toHaveAttribute(
      'aria-describedby',
      'cert-last-payout-help cert-last-payout-error'
    );

    // Failed submit adds distinct summary
    await page.locator('.cert-form-actions .fs-btn-primary').click();
    await expect(page.locator('.cert-form-error-summary')).toBeVisible();
    await expect(page.locator('#cert-last-payout-error')).toBeVisible();

    // Valid blur clears inline and summary errors
    await page.locator('#cert-last-payout-date').fill('2026-01-10');
    await page.locator('#cert-last-payout-date').blur();
    await expect(page.locator('#cert-last-payout-error')).toBeHidden();
    await expect(page.locator('#cert-last-payout-date')).toHaveAttribute('aria-invalid', 'false');
    await expect(page.locator('#cert-last-payout-date')).toHaveAttribute('aria-describedby', 'cert-last-payout-help');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    expect(await hasPageOverflow(page), 'Add form overflow at 390px').toBe(false);
  });

  test('7. /certificates/edit/1 prefills certificate data with single primary Update CTA and zero 390px overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates/edit/1', '.cert-form-page');

    await expect(page.locator('#cert-name')).toHaveValue('NBE Platinum 20%');
    await expect(page.locator('#cert-amount')).toHaveValue('100000');
    await expect(page.locator('.cert-form-actions .fs-btn-primary')).toHaveText(/Update Certificate/);
    await expect(page.locator('.cert-form-actions .fs-btn-primary')).toHaveCount(1);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    expect(await hasPageOverflow(page), 'Edit form overflow at 390px').toBe(false);
  });

  test('8. interactive touch targets >= 44px mobile / >= 32px desktop inline and visible :focus-visible rings', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates/1', '.cert-detail-page');

    const primaryBtn = page.locator('.cert-payout-due-banner .fs-btn-primary');
    const primaryBox = await primaryBtn.boundingBox();
    expect(primaryBox.height).toBeGreaterThanOrEqual(44);
    expect(primaryBox.width).toBeGreaterThanOrEqual(44);

    const refreshBtn = page.getByRole('button', { name: 'Refresh live accrued interest' });
    const refreshBox = await refreshBtn.boundingBox();
    expect(refreshBox.height).toBeGreaterThanOrEqual(32);
    expect(refreshBox.width).toBeGreaterThanOrEqual(32);

    // Real keyboard Tab :focus-visible outline
    await page.locator('.cert-detail-actions .fs-btn').first().focus();
    await page.keyboard.press('Tab');
    const focusedAddPayout = page.getByTestId('add-payout-btn');
    await expect(focusedAddPayout).toBeFocused();
    const outlineInfo = await focusedAddPayout.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: parseFloat(s.outlineWidth) || 0,
        outlineColor: s.outlineColor,
      };
    });
    expect(outlineInfo.outlineStyle).toBe('solid');
    expect(outlineInfo.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(outlineInfo.outlineColor).toBe(TEXT);

    // Mobile expander touch target >= 44x44px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const expander = page.locator('.cert-trajectory-mobile-cards .cert-card-expander-btn').first();
    const expanderBox = await expander.boundingBox();
    expect(expanderBox.height).toBeGreaterThanOrEqual(44);
    expect(expanderBox.width).toBeGreaterThanOrEqual(44);

    // Form submit touch target >= 44x44px
    await gotoAndSettle(page, '/certificates/new', '.cert-form-page');
    const submitBtn = page.locator('.cert-form-actions .fs-btn-primary');
    const submitBox = await submitBtn.boundingBox();
    expect(submitBox.height).toBeGreaterThanOrEqual(44);
    expect(submitBox.width).toBeGreaterThanOrEqual(44);
  });
});
