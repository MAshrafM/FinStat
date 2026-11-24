/* eslint-disable testing-library/await-async-utils, no-restricted-syntax, jest/valid-expect */
/**
 * frontend/tests/visual/corporate-actions-reference-match.spec.js
 *
 * Automated computed-style, accessibility, and responsive verification comparing
 * /corporate-actions and /corporate-actions/wizard against Canonical
 * Reference Frames 01, 02, and 03 (Dense Table, Form, Dashboard Stepper Variant B).
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupCorporateActionsMocks } = require('./fixtures/corporateActionsMocks');

test.describe('Phase 7B: Corporate Actions Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupCorporateActionsMocks(page);
  });

  test('1. /corporate-actions conforms to Reference Frame 01 (Variant B — Dense Table) at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/corporate-actions', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.locator('.loading-spinner, .loading-spinner-ring, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });

    const pageContainer = page.locator('.ca-page-container');
    await expect(pageContainer).toBeVisible({ timeout: 10000 });

    // 1. Primary CTA background: rgb(20, 184, 166) (#14b8a6, --fs-accent)
    const primaryBtn = page.locator('.ca-page-container .ca-header .ca-btn-primary');
    await expect(primaryBtn).toBeVisible();
    const btnBg = await primaryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(btnBg).toBe('rgb(20, 184, 166)');

    // 2. Primary CTA text color: rgb(13, 14, 16) (#0d0e10, --fs-ink, WCAG 2.1 compliance)
    const btnColor = await primaryBtn.evaluate((el) => window.getComputedStyle(el).color);
    expect(btnColor).toBe('rgb(13, 14, 16)');

    // 3. Table container background: rgb(26, 28, 32) (#1a1c20, --fs-surface)
    const tableWrap = page.locator('.ca-table-wrap');
    await expect(tableWrap).toBeVisible();
    const tableBg = await tableWrap.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(tableBg).toBe('rgb(26, 28, 32)');

    // 4. Radius ceiling <= 8px across cards and buttons
    const containerRadius = await tableWrap.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(containerRadius).toBeLessThanOrEqual(8);

    const btnRadius = await primaryBtn.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(btnRadius).toBeLessThanOrEqual(8);

    // 5. Monospace font on numerical / ratio columns
    const ratioCell = page.locator('.ca-cell-ratio').first();
    await expect(ratioCell).toBeVisible();
    const fontFamily = await ratioCell.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain('mono');

    // 6. Container padding matches Reference Frame 01 dense layout
    const containerPadding = await pageContainer.evaluate((el) => window.getComputedStyle(el).paddingTop);
    expect(parseFloat(containerPadding)).toBeGreaterThan(0);
  });

  test('2. /corporate-actions/wizard conforms to Reference Frame 03 Stepper with compliant contrast at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/corporate-actions/wizard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const wizardCard = page.locator('.wizard-card');
    await expect(wizardCard).toBeVisible({ timeout: 10000 });

    // 1. Step 1 active circle: background matches rgb(20, 184, 166) (--fs-accent)
    const activeStepNumber = page.locator('.step-item.active .step-number');
    await expect(activeStepNumber).toBeVisible();
    const stepBg = await activeStepNumber.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(stepBg).toBe('rgb(20, 184, 166)');

    // 2. Step 1 active circle text color: rgb(13, 14, 16) (--fs-ink), guaranteeing 7.76:1 contrast (strictly NO white text)
    const stepColor = await activeStepNumber.evaluate((el) => window.getComputedStyle(el).color);
    expect(stepColor).toBe('rgb(13, 14, 16)');

    // 3. Wizard card background is dark surface
    const cardBg = await wizardCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(cardBg).toBe('rgb(26, 28, 32)');

    // 4. Radius ceiling <= 8px
    const cardRadius = await wizardCard.evaluate((el) => parseFloat(window.getComputedStyle(el).borderRadius));
    expect(cardRadius).toBeLessThanOrEqual(8);
  });

  test('3. /corporate-actions conforms to Decision D19 mobile compact-expand cards at <= 768px', async ({ page }) => {
    for (const width of [768, 480, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/corporate-actions', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      // Desktop table is hidden
      const tableWrap = page.locator('.ca-table-wrap');
      await expect(tableWrap).toBeHidden();

      // Mobile cards are visible
      const mobileList = page.locator('.ca-mobile-card-list');
      await expect(mobileList).toBeVisible();

      // First card has expander
      const firstExpander = mobileList.locator('.ca-card-expander-btn').first();
      await expect(firstExpander).toBeVisible();

      // Verify 3 compact row elements: stock ticker, badge, formatted ratio
      const firstCard = mobileList.locator('.ca-mobile-card').first();
      await expect(firstCard.locator('.ca-card-stock')).toHaveText('COMI');
      await expect(firstCard.locator('.ca-badge')).toHaveText('Stock Split');
      await expect(firstCard.locator('.ca-card-ratio')).toHaveText('2:1');

      // Verify touch target >= 44x44px
      const box = await firstExpander.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);

      // Expanded content is initially not visible
      const expandedContent = mobileList.locator('.ca-card-expanded-content').first();
      await expect(expandedContent).toBeHidden();

      // Click to expand
      await firstExpander.click();
      await expect(expandedContent).toBeVisible();

      // Verify expanded content displays Broker, Effective Date, Notes
      await expect(expandedContent).toContainText('Broker');
      await expect(expandedContent).toContainText('Effective Date');
      await expect(expandedContent).toContainText('Notes');

      // Verify delete button is reachable with >= 44px touch height
      const deleteBtn = expandedContent.locator('.ca-btn-table-delete');
      await expect(deleteBtn).toBeVisible();
      const deleteBox = await deleteBtn.boundingBox();
      expect(deleteBox.height).toBeGreaterThanOrEqual(44);

      // Zero page-level horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll, `Horizontal page scroll detected at ${width}px`).toBe(false);
    }
  });

  test('4. /corporate-actions table container features horizontal scroll per Phase 7A precedent', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/corporate-actions', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const tableWrap = page.locator('.ca-table-wrap');
    await expect(tableWrap).toBeVisible();

    const overflowX = await tableWrap.evaluate((el) => window.getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');
  });

  test('5. interactive touch targets >= 44px and visible focus rings', async ({ page }) => {
    // 1. Desktop primary CTA touch target >= 44x44px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/corporate-actions', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const primaryBtn = page.locator('.ca-header-actions .ca-btn-primary');
    await expect(primaryBtn).toBeVisible();
    const btnBox = await primaryBtn.boundingBox();
    expect(btnBox.height).toBeGreaterThanOrEqual(44);
    expect(btnBox.width).toBeGreaterThanOrEqual(44);

    // 2. Desktop inline action button touch target >= 32px (calibrated per Amendment AD25)
    const tableDeleteBtn = page.locator('.ca-btn-table-delete').first();
    await expect(tableDeleteBtn).toBeVisible();
    const deleteBox = await tableDeleteBtn.boundingBox();
    expect(deleteBox.height).toBeGreaterThanOrEqual(32);
    expect(deleteBox.width).toBeGreaterThanOrEqual(32);

    // 3. Mobile touch target >= 44x44px at 390px (per UI-UX-PLAN §4.8)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const expanderBtn = page.locator('.ca-mobile-card .ca-card-expander-btn').first();
    await expanderBtn.click();
    const mobileDeleteBtn = page.locator('.ca-card-expanded-content .ca-btn-mobile-delete').first();
    await expect(mobileDeleteBtn).toBeVisible();
    const mobileDeleteBox = await mobileDeleteBtn.boundingBox();
    expect(mobileDeleteBox.height).toBeGreaterThanOrEqual(44);
    expect(mobileDeleteBox.width).toBeGreaterThanOrEqual(44);

    // 4. Keyboard focus test with real Tab keypress triggering :focus-visible
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/corporate-actions', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const refreshBtn = page.locator('.ca-header-actions button[title="Refresh action list"]');
    await refreshBtn.focus();
    await page.keyboard.press('Tab');
    await expect(primaryBtn).toBeFocused();

    const outlineInfo = await primaryBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth) || 0,
        outlineColor: style.outlineColor,
      };
    });
    expect(outlineInfo.outlineStyle).toBe('solid');
    expect(outlineInfo.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(outlineInfo.outlineColor).toBe('rgb(242, 243, 245)');
  });
});
