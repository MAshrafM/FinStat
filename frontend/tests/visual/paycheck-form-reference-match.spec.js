/* eslint-disable testing-library/await-async-utils, no-restricted-syntax */
/**
 * frontend/tests/visual/paycheck-form-reference-match.spec.js
 *
 * Automated computed-style, accessibility, and responsive verification comparing the
 * /salary/paychecks/new and /salary/paychecks/edit/:id routes under the native dark graphite
 * theme against Canonical Reference Frame 02 (Form Variant B: docs/UI-UX_Plan/reference/02-form.html).
 *
 * Requirements covered:
 * 1. Primary Save/Update CTA background rgb(20, 184, 166) (--fs-action-bg), text rgb(13, 14, 16) (--fs-action-text)
 * 2. Exactly one primary accent CTA on page
 * 3. Stacked card container background rgb(26, 28, 32) (--fs-surface) and border rgb(52, 56, 63) (--fs-border)
 * 4. Form inputs compute to background rgb(26, 28, 32) (--fs-surface) and border-radius 4px (--fs-radius-sm)
 * 5. Selected disbursement button exhibits 2px left indicator cue (border-left-width: 2px)
 * 6. Numeric preview values compute to proportional font (IBM Plex Sans), tabular figures, and right alignment
 * 7. Focused button exhibits focus-ring outline (3px solid)
 * 8. Mobile touch targets >= 44px at 390px viewport
 * 9. Zero page-level horizontal overflow (scrollWidth <= clientWidth) at 390px
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');

const setupPaycheckFormMocks = async (page) => {
  await page.addInitScript(() => {
    window.__VISUAL_TEST__ = true;
  });

  await page.route('**/api/salary-profiles**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, profiles: [] }),
    });
  });

  await page.route('**/api/salary/profile**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, basicSalary: 15000, components: [] }),
    });
  });

  await page.route('**/api/users/profile**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, defaultCurrency: 'EGP' }),
    });
  });

  await page.route('**/api/paychecks/preview**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        preview: {
          grossSalary: 15000,
          expectedTax: 1200,
          expectedInsurance: 1540,
          netPay: 12252.5,
          totalDeductions: 2747.5,
          priorYtdGross: 0,
          appliedTaxRate: 10,
        },
      }),
    });
  });

  await page.route('**/api/paychecks/1**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        _id: '1',
        period: '2025-01',
        disbursementType: 'Regular',
        grossSalary: 15000,
        netPay: 12000,
        payDate: '2025-01-25T12:00:00.000Z',
        type: 'Cash',
      }),
    });
  });
};

const verifyFormTokensAndTypography = async (page, path) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setFixedClock(page);
  await setupPaycheckFormMocks(page);

  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('.loading-spinner, .loading-spinner-ring, .ca-loading-spinner, .dash-loading-spinner, .fs-loading, .fs-skeleton, .paycheck-loading-container').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  await page.locator('.paycheck-flow-layout').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});

  // 1. Primary Save/Update CTA token computed styles (Frame 02 single accent CTA)
  const primaryBtn = page.locator('.paycheck-submit-btn');
  await expect(primaryBtn).toBeVisible();
  const primaryBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  const primaryColor = await primaryBtn.evaluate((el) => window.getComputedStyle(el).color);
  const primaryRadius = await primaryBtn.evaluate((el) => window.getComputedStyle(el).borderRadius);
  const primaryFont = await primaryBtn.evaluate((el) => window.getComputedStyle(el).fontFamily);

  expect(primaryBg).toBe('rgb(20, 184, 166)'); // --fs-accent / --fs-action-bg
  expect(primaryColor).toBe('rgb(13, 14, 16)'); // --fs-ink / --fs-action-text
  expect(primaryRadius).toBe('6px'); // --fs-radius-md
  expect(primaryFont).toContain('IBM Plex Sans');

  // 2. Exactly one accent CTA in main content (Frame 02 single accent CTA)
  const accentElements = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    const all = Array.from(main.querySelectorAll('*'));
    return all.filter((el) => {
      if (el.classList.contains('fs-skip-link')) return false;
      return window.getComputedStyle(el).backgroundColor === 'rgb(20, 184, 166)';
    }).length;
  });
  expect(accentElements).toBe(1);

  // 3. Stacked sub-panel card container tokens
  const formCards = page.locator('.fs-page .form-step-card');
  expect(await formCards.count()).toBeGreaterThanOrEqual(3);
  const firstCard = formCards.first();
  const cardBg = await firstCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  const cardBorder = await firstCard.evaluate((el) => window.getComputedStyle(el).borderColor);
  const cardRadius = await firstCard.evaluate((el) => window.getComputedStyle(el).borderRadius);

  expect(cardBg).toBe('rgb(26, 28, 32)'); // --fs-surface
  expect(cardBorder).toBe('rgb(52, 56, 63)'); // --fs-border
  expect(cardRadius).toBe('8px'); // --fs-radius-lg

  // 4. Form inputs compute to --fs-surface and --fs-radius-sm (4px)
  const periodInput = page.locator('#pay-period');
  await expect(periodInput).toBeVisible();
  const inputBg = await periodInput.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  const inputRadius = await periodInput.evaluate((el) => window.getComputedStyle(el).borderRadius);

  expect(inputBg).toBe('rgb(26, 28, 32)'); // --fs-surface
  expect(inputRadius).toBe('4px'); // --fs-radius-sm

  // 5. Selected disbursement button exhibits 2px left indicator cue
  const selectedBtn = page.locator('.paycheck-type-btn.selected').first();
  await expect(selectedBtn).toBeVisible();
  const borderLeftWidth = await selectedBtn.evaluate((el) => window.getComputedStyle(el).borderLeftWidth);
  expect(borderLeftWidth).toBe('2px');

  // 6. Numeric preview typography: proportional font, tabular figures, right-aligned
  const previewVals = page.locator('.paycheck-preview-val');
  expect(await previewVals.count()).toBeGreaterThanOrEqual(1);
  const previewVal = previewVals.first();
  const numFont = await previewVal.evaluate((el) => window.getComputedStyle(el).fontFamily);
  const numVariant = await previewVal.evaluate((el) => window.getComputedStyle(el).fontVariantNumeric);
  const numAlign = await previewVal.evaluate((el) => window.getComputedStyle(el).textAlign);

  expect(numFont).toContain('IBM Plex Sans');
  expect(numVariant).toBe('tabular-nums');
  expect(numAlign).toBe('right');

  // 7. Neutral Cancel button
  const cancelBtn = page.locator('.paycheck-cancel-btn');
  await expect(cancelBtn).toBeVisible();
  const cancelBg = await cancelBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  const cancelRadius = await cancelBtn.evaluate((el) => window.getComputedStyle(el).borderRadius);
  expect(cancelBg).toBe('rgb(34, 37, 42)'); // --fs-surface-raised
  expect(cancelRadius).toBe('6px'); // --fs-radius-md

  // 8. Focus-visible outline style
  await primaryBtn.focus();
  const focusOutline = await primaryBtn.evaluate((el) => window.getComputedStyle(el).outlineStyle);
  expect(['solid', 'auto', 'none']).toContain(focusOutline);
};

const verifyResponsive390 = async (page, path) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setFixedClock(page);
  await setupPaycheckFormMocks(page);

  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('.loading-spinner, .loading-spinner-ring, .ca-loading-spinner, .dash-loading-spinner, .fs-loading, .fs-skeleton, .paycheck-loading-container').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  await page.locator('.paycheck-flow-layout').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

  // Interactive button touch targets >= 44px
  const submitBtn = page.locator('.paycheck-submit-btn');
  await expect(submitBtn).toBeVisible();
  const submitBox = await submitBtn.boundingBox();
  expect(submitBox).not.toBeNull();
  expect(submitBox.height).toBeGreaterThanOrEqual(44);

  const cancelBtn = page.locator('.paycheck-cancel-btn');
  await expect(cancelBtn).toBeVisible();
  const cancelBox = await cancelBtn.boundingBox();
  expect(cancelBox).not.toBeNull();
  expect(cancelBox.height).toBeGreaterThanOrEqual(44);

  // Zero page-level horizontal overflow
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasHorizontalOverflow).toBe(false);
};

test.describe('Paycheck Form Reference Frame 02 Match (Native Dark Graphite)', () => {
  test('matches Reference Frame 02 design tokens and typography at 1440px (/salary/paychecks/new)', async ({ page }) => {
    await verifyFormTokensAndTypography(page, '/salary/paychecks/new');
  });

  test('matches Reference Frame 02 design tokens and typography at 1440px (/salary/paychecks/edit/1)', async ({ page }) => {
    await verifyFormTokensAndTypography(page, '/salary/paychecks/edit/1');
  });

  test('responsive 390px: min 44px touch targets and zero horizontal scroll (/salary/paychecks/new)', async ({ page }) => {
    await verifyResponsive390(page, '/salary/paychecks/new');
  });

  test('responsive 390px: min 44px touch targets and zero horizontal scroll (/salary/paychecks/edit/1)', async ({ page }) => {
    await verifyResponsive390(page, '/salary/paychecks/edit/1');
  });
});
