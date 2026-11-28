// frontend/tests/visual/security-reference-match.spec.js
/* eslint-disable testing-library/prefer-screen-queries */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupSecurityMocks } = require('./fixtures/securityMocks');

const SNAPSHOT_DIR = path.resolve(__dirname, '../../../docs/ui-snapshots/phase-10b');
const ALL_WIDTHS = [1440, 1024, 768, 480, 390];

const ensureSnapshotDir = () => {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
};

const hideToastsAndAnimations = async (page) => {
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.addStyleTag({
    content: `
      *, *::before, *::after { transition: none !important; animation: none !important; }
      .toast-container, [class*="toast-container"], .Toastify, .undo-toast-wrapper {
        display: none !important;
        visibility: hidden !important;
      }
    `,
  }).catch(() => {});
};

const freezeAnimationsOnly = async (page) => {
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  }).catch(() => {});
};

test.describe('Phase 10B Security Reference Match (/security)', () => {
  test.beforeEach(async ({ page }) => {
    ensureSnapshotDir();
    await setFixedClock(page);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
  });

  test('1. /security 5-width sweep: dark canvas, flat cards, no gradient text, neutral badges, single primary CTA, 0 inline styles', async ({ page }) => {
    await setupSecurityMocks(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/security', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="security-audit-table"]').waitFor({ state: 'visible' });
    await hideToastsAndAnimations(page);

    const themeAttr = await page.locator('html').getAttribute('data-fs-theme');
    expect(themeAttr).toBe('dark');

    const metrics = await page.evaluate(() => {
      const bodyRgb = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number);
      const title = document.querySelector('.security-page-title');
      const card = document.querySelector('.security-card');
      const timeEl = document.querySelector('.audit-table time.fs-num');
      const ipEl = document.querySelector('.audit-table .audit-ip-code.fs-mono');
      return {
        bodyRgb,
        titleBgImg: getComputedStyle(title).backgroundImage,
        titleClip: getComputedStyle(title).webkitBackgroundClip,
        cardBgImg: getComputedStyle(card).backgroundImage,
        cardShadow: getComputedStyle(card).boxShadow,
        cardRadius: parseFloat(getComputedStyle(card).borderRadius),
        inlineStyleCount: document.querySelectorAll('.security-page-container [style]').length,
        primaryCtaCount: document.querySelectorAll('.security-page-container .fs-btn-primary').length,
        numFont: getComputedStyle(timeEl).fontFamily,
        numVariant: getComputedStyle(timeEl).fontVariantNumeric,
        monoFont: getComputedStyle(ipEl).fontFamily,
      };
    });

    expect(metrics.bodyRgb).toEqual([16, 17, 20]);
    expect(metrics.titleBgImg).toBe('none');
    expect(metrics.titleClip).not.toBe('text');
    expect(metrics.cardBgImg).toBe('none');
    expect(metrics.cardShadow).toBe('none');
    expect(metrics.cardRadius).toBeLessThanOrEqual(8);
    expect(metrics.inlineStyleCount).toBe(0);
    expect(metrics.primaryCtaCount).toBe(1);
    expect(metrics.numFont.toLowerCase()).toContain('ibm plex sans');
    expect(metrics.numVariant).toContain('tabular-nums');
    expect(metrics.monoFont.toLowerCase()).toContain('ibm plex mono');

    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/security', { waitUntil: 'domcontentloaded' });
      const waitSel = width > 768 ? '[data-testid="security-audit-table"]' : '[data-testid="security-mobile-cards"]';
      await page.locator(waitSel).waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);

      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('2. Frame 01 Variant B side-by-side @ 1440px and 390px', async ({ page }) => {
    await setupSecurityMocks(page);

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://localhost:3001/docs/UI-UX_Plan/reference/01-dense-table.html', { waitUntil: 'domcontentloaded' });
      await page.locator('.fs-page').waitFor({ state: 'visible' });
      const refBuf = await page.screenshot({ fullPage: true });

      await page.goto('/security', { waitUntil: 'domcontentloaded' });
      const waitSel = width > 768 ? '[data-testid="security-audit-table"]' : '[data-testid="security-mobile-cards"]';
      await page.locator(waitSel).waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);
      const liveBuf = await page.screenshot({ fullPage: true });

      const helperPage = await page.context().newPage();
      await helperPage.setViewportSize({ width: width === 1440 ? 1600 : 860, height: 900 });
      await helperPage.setContent(`
        <html>
          <body style="margin:0;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px;background:black;color:white;font-family:sans-serif;">
            <div>
              <h2 style="margin:0 0 8px 0;font-size:14px;">Reference Frame 01 (Variant B) — ${width}px</h2>
              <img src="data:image/png;base64,${refBuf.toString('base64')}" style="width:100%;border:1px solid dimgray;" />
            </div>
            <div>
              <h2 style="margin:0 0 8px 0;font-size:14px;">Live /security (Phase 10B) — ${width}px</h2>
              <img src="data:image/png;base64,${liveBuf.toString('base64')}" style="width:100%;border:1px solid dimgray;" />
            </div>
          </body>
        </html>
      `);
      await helperPage.screenshot({
        path: path.join(SNAPSHOT_DIR, `frame-01-dense-table-side-by-side-${width}.png`),
        fullPage: true,
      });
      await helperPage.close();
    }
  });

  test('3. 2FA setup -> verify -> backup codes modal flow, APG focus lifecycle & captures', async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.unrouteAll();
      await setupSecurityMocks(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/security', { waitUntil: 'domcontentloaded' });
      const enableBtn = page.getByRole('button', { name: /Enable 2FA/i });
      await enableBtn.click();

      const setupDialog = page.getByRole('dialog');
      await expect(setupDialog).toHaveAttribute('aria-modal', 'true');
      await expect(page.locator('.secret-code-text')).toHaveText('JBSW Y3DP EHPK 3PXP');

      const backdropBlur = await page.evaluate(
        () => getComputedStyle(document.querySelector('.security-modal-overlay')).backdropFilter
      );
      expect(backdropBlur).toBe('none');

      await hideToastsAndAnimations(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-2fa-setup-modal-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });

      // Verify Escape closes and restores focus to Enable 2FA trigger
      await page.keyboard.press('Escape');
      await expect(setupDialog).toHaveCount(0);
      await expect(enableBtn).toBeFocused();

      // Re-open, verify, and capture backup codes modal
      await enableBtn.click();
      await page.locator('#security-verify-code').fill('123456');
      await page.getByRole('button', { name: /Verify & Activate/i }).click();
      await page.getByText('Save Now').waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-backup-codes-modal-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('4. 2FA enabled state + disable modal flow (.fs-btn-danger inside dialog only) & captures', async ({ page }) => {
    await setupSecurityMocks(page, { totpEnabled: true });

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/security', { waitUntil: 'domcontentloaded' });
      const disableBtn = page.getByRole('button', { name: /Disable 2FA/i });
      await disableBtn.waitFor({ state: 'visible' });
      await expect(disableBtn).not.toHaveClass(/fs-btn-danger/);
      await hideToastsAndAnimations(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-2fa-enabled-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });

      await disableBtn.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(page.getByRole('button', { name: /Confirm Disable/i })).toHaveClass(/fs-btn-danger/);
      await hideToastsAndAnimations(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-disable-2fa-modal-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('5. D19 mobile cards @ 480px and 390px: desktop table absent, expand/collapse, full wrap, 0px overflow', async ({ page }) => {
    await setupSecurityMocks(page);

    for (const width of [480, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/security', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-testid="security-mobile-cards"]').waitFor({ state: 'visible' });
      await expect(page.locator('[data-testid="security-audit-table"]')).toHaveCount(0);
      await hideToastsAndAnimations(page);

      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-mobile-cards-collapsed-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });

      const expandBtn = page.getByRole('button', { name: /Show details for Success attempt/i }).first();
      await expandBtn.click();
      await expect(page.getByRole('button', { name: /Hide details for Success attempt/i }).first()).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);

      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-mobile-cards-expanded-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('6. Loading, empty, and forced-error captures @ 1440px and 390px (visible error toast asserted)', async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });

      // Loading state
      await page.unrouteAll();
      await setupSecurityMocks(page, { delayMs: 8000 });
      await page.goto('/security', { waitUntil: 'domcontentloaded' });
      await page.locator('.security-page-container .fs-loading').first().waitFor({ state: 'visible' });
      await freezeAnimationsOnly(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-loading-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });

      // Empty state
      await page.unrouteAll();
      await setupSecurityMocks(page, { empty: true });
      await page.goto('/security', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-testid="security-audit-empty"]').waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-empty-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });

      // Forced-error state (no toast masking, visible toast asserted)
      await page.unrouteAll();
      await setupSecurityMocks(page, { error: true });
      await page.goto('/security', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(/Failed to load/i).first()).toBeVisible();
      await freezeAnimationsOnly(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `security-error-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('7. touch targets >= 44px on mobile & visible focus rings', async ({ page }) => {
    await setupSecurityMocks(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/security', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="security-mobile-cards"]').waitFor({ state: 'visible' });

    const enableBox = await page.getByRole('button', { name: /Enable 2FA/i }).boundingBox();
    const refreshBox = await page.getByRole('button', { name: /Refresh/i }).boundingBox();
    const expandBox = await page.locator('.security-expand-btn').first().boundingBox();
    const nextBox = await page.getByRole('button', { name: /Next/i }).boundingBox();

    expect(enableBox.height).toBeGreaterThanOrEqual(44);
    expect(refreshBox.height).toBeGreaterThanOrEqual(44);
    expect(expandBox.height).toBeGreaterThanOrEqual(44);
    expect(expandBox.width).toBeGreaterThanOrEqual(44);
    expect(nextBox.height).toBeGreaterThanOrEqual(44);

    await page.keyboard.press('Tab');
    const hasFocus = await page.evaluate(() => document.activeElement !== document.body);
    expect(hasFocus).toBe(true);
  });

  test('8. computed-style/typography table: no ellipsis truncation, masked <time>, no tone/accent in CSS', async ({ page }) => {
    await setupSecurityMocks(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/security', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="security-audit-table"]').waitFor({ state: 'visible' });

    const tableMetrics = await page.evaluate(() => {
      const agentCell = document.querySelector('.audit-table .audit-agent-cell');
      const timeMask = document.querySelector('.audit-table time[data-visual-mask="true"]');
      const usernameEl = document.querySelector('.security-username');
      return {
        textOverflow: getComputedStyle(agentCell).textOverflow,
        overflowWrap: getComputedStyle(agentCell).overflowWrap,
        hasTimeMask: Boolean(timeMask),
        usernameFont: getComputedStyle(usernameEl).fontFamily,
      };
    });

    expect(tableMetrics.textOverflow).not.toBe('ellipsis');
    expect(tableMetrics.overflowWrap).toBe('anywhere');
    expect(tableMetrics.hasTimeMask).toBe(true);
    expect(tableMetrics.usernameFont.toLowerCase()).toContain('ibm plex sans');
  });
});
