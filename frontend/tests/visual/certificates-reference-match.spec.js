/* eslint-disable testing-library/await-async-utils, testing-library/prefer-screen-queries, no-restricted-syntax, jest/valid-expect */
/**
 * frontend/tests/visual/certificates-reference-match.spec.js
 *
 * Automated computed-style, accessibility, dialog keyboard, and responsive
 * verification for Phase 8B (/certificates) against Canonical Reference Frames
 * 01 (Dense Table Variant B) and 03 (Dashboard KPI Grid Variant B).
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupCertificatesMocks } = require('./fixtures/certificatesMocks');

const CANVAS = 'rgb(16, 17, 20)';
const SURFACE = 'rgb(26, 28, 32)';
const SURFACE_RAISED = 'rgb(34, 37, 42)';
const ACCENT = 'rgb(20, 184, 166)';
const INK = 'rgb(13, 14, 16)';
const TEXT = 'rgb(242, 243, 245)';

async function gotoAndSettle(page, path) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    try {
      await page.locator('.cert-log-page')
        .first()
        .waitFor({ state: 'visible', timeout: 8000 });
      await page.locator('.fs-loading, .fs-skeleton')
        .waitFor({ state: 'detached', timeout: 8000 })
        .catch(() => {});
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

test.describe('Phase 8B: Certificates Log Reference Match Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setFixedClock(page);
    await setupCertificatesMocks(page);
  });

  test('1. dark graphite surface, zero gradient banner, zero pixel shadow glows', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates');

    const pageContainer = page.locator('.cert-log-page');
    await expect(pageContainer).toBeVisible();
    expect(await pageContainer.evaluate((el) => window.getComputedStyle(el).backgroundColor)).toBe(CANVAS);

    const kpiTiles = page.locator('.cert-kpi-tile');
    await expect(kpiTiles).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      const tileStyles = await kpiTiles.nth(i).evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, image: s.backgroundImage, shadow: s.boxShadow };
      });
      expect(tileStyles.bg).toBe(SURFACE);
      expect(tileStyles.image).toBe('none');
      expect(tileStyles.shadow).toBe('none');
    }
  });

  test('2. header has single primary CTA with ink on accent and secondary Process Due Payouts', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates');

    const primaryBtns = page.locator('.cert-header .fs-btn-primary');
    await expect(primaryBtns).toHaveCount(1);
    await expect(primaryBtns).toHaveText(/Add Certificate/);

    const primaryStyles = await primaryBtns.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, radius: parseFloat(s.borderRadius) };
    });
    expect(primaryStyles.bg).toBe(ACCENT);
    expect(primaryStyles.color).toBe(INK);
    expect(primaryStyles.radius).toBeLessThanOrEqual(8);

    const secondaryBtn = page.locator('.cert-header .fs-btn-secondary');
    await expect(secondaryBtn).toHaveCount(1);
    await expect(secondaryBtn).toHaveText(/Process Due Payouts/);
  });

  test('3. fs-num uses Plex Sans + tabular-nums, 5 neutral Badges with aria-hidden icons, underlined name links, and non-color isPayoutDue label', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates');

    const numericCell = page.locator('.cert-table td.fs-num').first();
    await expect(numericCell).toBeVisible();
    const numericFont = await numericCell.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { family: s.fontFamily.toLowerCase(), variant: s.fontVariantNumeric };
    });
    expect(numericFont.family).toContain('plex sans');
    expect(numericFont.variant).toContain('tabular-nums');

    const badges = page.locator('.cert-table .fs-badge');
    await expect(badges).toHaveCount(5);
    for (let i = 0; i < 5; i += 1) {
      const badge = badges.nth(i);
      const classes = await badge.getAttribute('class');
      expect(classes).toContain('fs-badge');
      expect(classes).not.toContain('fs-badge--positive');
      expect(classes).not.toContain('fs-badge--negative');
      expect(classes).not.toContain('fs-badge--warning');
      const bg = await badge.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(bg).toBe(SURFACE_RAISED);
      await expect(badge.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    }

    const nameLink = page.locator('.cert-table .cert-name-link').first();
    const decoration = await nameLink.evaluate((el) => window.getComputedStyle(el).textDecorationLine);
    expect(decoration).toContain('underline');

    const dueBtn = page.getByRole('button', {
      name: 'Interest payout due — process payout for NBE Platinum 20%',
    });
    await expect(dueBtn).toBeVisible();
    await expect(dueBtn).toHaveAttribute('data-payout-due', 'true');
  });

  test('4. active filter uses accent/ink and filter radii remain <= 8px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates');

    const activeFilter = page.locator('.cert-filter-btn.is-active');
    await expect(activeFilter).toHaveText('All');
    const filterStyles = await activeFilter.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, radius: parseFloat(s.borderRadius) };
    });
    expect(filterStyles.bg).toBe(ACCENT);
    expect(filterStyles.color).toBe(INK);
    expect(filterStyles.radius).toBeLessThanOrEqual(8);

    await page.getByRole('button', { name: 'Maturing Soon', exact: true }).click();
    await expect(page.locator('.cert-filter-btn.is-active')).toHaveText('Maturing Soon');
    await expect(page.locator('.cert-table tbody tr')).toHaveCount(1);
  });

  test('5. desktop W-8B-1 container scroll and Withdraw/Payout dialog semantics & keyboard recovery', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await gotoAndSettle(page, '/certificates');

    const tableWrap = page.locator('.cert-log-page .cert-table-wrap');
    await expect(tableWrap).toBeVisible();
    expect(await tableWrap.evaluate((el) => window.getComputedStyle(el).overflowX)).toBe('auto');

    // Withdraw dialog semantics + Escape recovery + focus restore
    const withdrawBtn = page.locator('.cert-table').getByRole('button', { name: 'Withdraw NBE Platinum 20%' });
    await withdrawBtn.click();
    const withdrawDialog = page.getByRole('dialog', { name: /Withdraw Certificate Early/i });
    await expect(withdrawDialog).toBeVisible();
    await expect(withdrawDialog).toHaveAttribute('aria-modal', 'true');
    await page.keyboard.press('Escape');
    await expect(withdrawDialog).toBeHidden();
    await expect(withdrawBtn).toBeFocused();

    // Payout dialog semantics + Escape recovery + focus restore
    const payoutBtn = page.locator('.cert-table').getByRole('button', {
      name: 'Interest payout due — process payout for NBE Platinum 20%',
    });
    await payoutBtn.click();
    const payoutDialog = page.getByRole('dialog', { name: /Add Interest Payout/i });
    await expect(payoutDialog).toBeVisible();
    await expect(payoutDialog).toHaveAttribute('aria-modal', 'true');
    await page.keyboard.press('Escape');
    await expect(payoutDialog).toBeHidden();
    await expect(payoutBtn).toBeFocused();
  });

  test('6. D19 compact-expand cards at <=768px (768, 480, 390) with zero 390px page overflow', async ({ page }) => {
    for (const width of [768, 480, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoAndSettle(page, '/certificates');

      await expect(page.locator('.cert-desktop-table')).toBeHidden();
      await expect(page.locator('[data-testid="certificates-mobile-cards"]')).toBeVisible();
      expect(await hasPageOverflow(page), `Horizontal overflow at ${width}px`).toBe(false);
    }

    const firstExpander = page.locator('.cert-card-expander-btn').first();
    await expect(firstExpander).toHaveAttribute('aria-expanded', 'false');
    await firstExpander.click();
    await expect(firstExpander).toHaveAttribute('aria-expanded', 'true');
    const expandedDrawer = page.locator('.cert-card-expanded').first();
    await expect(expandedDrawer).toBeVisible();
    await expect(expandedDrawer).toContainText('Interest Rate');
    await expect(expandedDrawer).toContainText('Maturity Date');
    await expect(expandedDrawer).toContainText('Interest payout due');
  });

  test('7. interactive touch targets >= 44px mobile / >= 32px desktop inline and visible :focus-visible rings', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoAndSettle(page, '/certificates');

    const primaryBtn = page.locator('.cert-header .fs-btn-primary');
    const primaryBox = await primaryBtn.boundingBox();
    expect(primaryBox.height).toBeGreaterThanOrEqual(44);
    expect(primaryBox.width).toBeGreaterThanOrEqual(44);

    const rowAction = page.locator('.cert-table .cert-icon-btn').first();
    const rowActionBox = await rowAction.boundingBox();
    expect(rowActionBox.height).toBeGreaterThanOrEqual(32);
    expect(rowActionBox.width).toBeGreaterThanOrEqual(32);

    // Tab to verify visible :focus-visible outline on interactive control
    const processDueBtn = page.locator('.cert-header .fs-btn-secondary');
    await processDueBtn.focus();
    await page.keyboard.press('Tab');
    await expect(primaryBtn).toBeFocused();
    const outlineInfo = await primaryBtn.evaluate((el) => {
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

    // Mobile >= 44x44px touch targets
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const expander = page.locator('.cert-mobile-cards .cert-card-expander-btn').first();
    const expanderBox = await expander.boundingBox();
    expect(expanderBox.height).toBeGreaterThanOrEqual(44);
    expect(expanderBox.width).toBeGreaterThanOrEqual(44);

    await expander.click();
    const mobileDelete = page.locator('.cert-card-expanded .cert-icon-btn-danger').first();
    const mobileDeleteBox = await mobileDelete.boundingBox();
    expect(mobileDeleteBox.height).toBeGreaterThanOrEqual(44);
    expect(mobileDeleteBox.width).toBeGreaterThanOrEqual(44);
  });
});
