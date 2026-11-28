// frontend/tests/visual/profile-settings-reference-match.spec.js
/* eslint-disable testing-library/prefer-screen-queries */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupProfileSettingsMocks } = require('./fixtures/profileSettingsMocks');

const SNAPSHOT_DIR = path.resolve(__dirname, '../../../docs/ui-snapshots/phase-10a');
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

test.describe('Phase 10A Profile, Settings & Recycle Bin Reference Match (Checkpoint #8)', () => {
  test.beforeEach(async ({ page }) => {
    ensureSnapshotDir();
    await setFixedClock(page);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
  });

  test('1. /profile 5-width sweep: dark canvas, Frame 02 cards, badge, single primary CTA, 0 inline styles, typography', async ({ page }) => {
    await setupProfileSettingsMocks(page, 'profile');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await page.locator('.user-profile-page .profile-card').first().waitFor({ state: 'visible' });
    await hideToastsAndAnimations(page);

    const themeAttr = await page.locator('html').getAttribute('data-fs-theme');
    expect(themeAttr).toBe('dark');

    const metrics = await page.evaluate(() => {
      const bodyRgb = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number);
      const card = document.querySelector('.user-profile-page .profile-card');
      const dob = document.querySelector('#profile-dateOfBirth');
      const natId = document.querySelector('#profile-nationalId');
      const header = document.querySelector('.user-profile-page .profile-page-header');
      const pill = document.querySelector('.user-profile-page .profile-role-pill');
      return {
        bodyRgb,
        cardBgImg: getComputedStyle(card).backgroundImage,
        cardShadow: getComputedStyle(card).boxShadow,
        cardRadius: parseFloat(getComputedStyle(card).borderRadius),
        cardMaxWidth: getComputedStyle(card).maxWidth,
        headerBg: getComputedStyle(header).backgroundColor,
        pillRadius: getComputedStyle(pill).borderRadius,
        inlineStyleCount: document.querySelectorAll('.user-profile-page [style]').length,
        primaryCtaCount: document.querySelectorAll('.user-profile-page .fs-btn-primary').length,
        numFont: getComputedStyle(dob).fontFamily,
        numVariant: getComputedStyle(dob).fontVariantNumeric,
        monoFont: getComputedStyle(natId).fontFamily,
      };
    });

    expect(metrics.bodyRgb).toEqual([16, 17, 20]);
    expect(metrics.cardBgImg).toBe('none');
    expect(metrics.cardShadow).toBe('none');
    expect(metrics.cardRadius).toBeLessThanOrEqual(8);
    expect(metrics.cardMaxWidth).toBe('none');
    expect(metrics.inlineStyleCount).toBe(0);
    expect(metrics.primaryCtaCount).toBe(1);
    expect(metrics.numFont.toLowerCase()).toContain('ibm plex sans');
    expect(metrics.numVariant).toContain('tabular-nums');
    expect(metrics.monoFont.toLowerCase()).toContain('ibm plex mono');

    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await page.locator('.user-profile-page .profile-card').first().waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);

      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `profile-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('2. Checkpoint #8 side-by-side: Reference Frame 02 (Variant B) vs /profile @ 1440px and 390px', async ({ page }) => {
    await setupProfileSettingsMocks(page, 'profile');

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://localhost:3001/docs/UI-UX_Plan/reference/02-form.html', { waitUntil: 'domcontentloaded' });
      await page.locator('.fs-page').waitFor({ state: 'visible' });
      const refBuf = await page.screenshot({ fullPage: true });

      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await page.locator('.user-profile-page .profile-card').first().waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);
      const liveBuf = await page.screenshot({ fullPage: true });

      const helperPage = await page.context().newPage();
      await helperPage.setViewportSize({ width: width === 1440 ? 1600 : 860, height: 900 });
      await helperPage.setContent(`
        <html>
          <body style="margin:0;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px;background:black;color:white;font-family:sans-serif;">
            <div>
              <h2 style="margin:0 0 8px 0;font-size:14px;">Reference Frame 02 (Variant B) — ${width}px</h2>
              <img src="data:image/png;base64,${refBuf.toString('base64')}" style="width:100%;border:1px solid dimgray;" />
            </div>
            <div>
              <h2 style="margin:0 0 8px 0;font-size:14px;">Live /profile (Phase 10A) — ${width}px</h2>
              <img src="data:image/png;base64,${liveBuf.toString('base64')}" style="width:100%;border:1px solid dimgray;" />
            </div>
          </body>
        </html>
      `);
      await helperPage.screenshot({
        path: path.join(SNAPSHOT_DIR, `frame-02-form-side-by-side-${width}.png`),
        fullPage: true,
      });
      await helperPage.close();
    }
  });

  test('3. /profile save flow: edits field, submits PUT /api/users/profile & shows toast', async ({ page }) => {
    await setupProfileSettingsMocks(page, 'profile');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await page.locator('#profile-fullName').waitFor({ state: 'visible' });

    await page.locator('#profile-fullName').fill('Ahmed M. Mansour');
    const [putReq] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/users/profile') && req.method() === 'PUT'),
      page.getByRole('button', { name: /Save Profile Changes/i }).click(),
    ]);
    expect(putReq.postDataJSON().fullName).toBe('Ahmed M. Mansour');
    await expect(page.getByText(/Profile updated successfully!/i)).toBeVisible();
  });

  test('4. /settings 5-width sweep + FIFO selection: Section 25 accent survives active+hover, neutral info-box, 0px overflow', async ({ page }) => {
    await setupProfileSettingsMocks(page, 'settings');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await page.locator('.settings-page .method-option').first().waitFor({ state: 'visible' });
    await hideToastsAndAnimations(page);

    const metrics = await page.evaluate(() => {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--fs-accent').trim();
      const probe = document.createElement('div');
      probe.style.borderColor = accent;
      document.body.appendChild(probe);
      const expectedAccentRgb = getComputedStyle(probe).borderColor;
      probe.remove();

      const activeCard = document.querySelector('.settings-page .method-option.active');
      const activeIcon = document.querySelector('.settings-page .method-option.active .check-icon');
      const infoBox = document.querySelector('.settings-page .info-box');
      return {
        expectedAccentRgb,
        activeBorder: getComputedStyle(activeCard).borderTopColor,
        activeIconColor: getComputedStyle(activeIcon).color,
        infoBoxLeftColor: getComputedStyle(infoBox).borderLeftColor,
        inlineStyleCount: document.querySelectorAll('.settings-page [style]').length,
      };
    });

    expect(metrics.activeBorder).toBe(metrics.expectedAccentRgb);
    expect(metrics.activeIconColor).toBe(metrics.expectedAccentRgb);
    expect(metrics.infoBoxLeftColor).not.toBe(metrics.expectedAccentRgb);
    expect(metrics.inlineStyleCount).toBe(0);

    // Hover active card and verify accent border is preserved
    await page.locator('.settings-page .method-option.active').hover();
    const hoverBorder = await page.evaluate(
      () => getComputedStyle(document.querySelector('.settings-page .method-option.active')).borderTopColor
    );
    expect(hoverBorder).toBe(metrics.expectedAccentRgb);

    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/settings', { waitUntil: 'domcontentloaded' });
      await page.locator('.settings-page .method-option').first().waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);

      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `settings-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }

    // FIFO selection captures at 1440 and 390
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/settings', { waitUntil: 'domcontentloaded' });
      await page.locator('label[for="cost-basis-fifo"]').click();
      await expect(page.locator('#cost-basis-fifo')).toBeChecked();
      await hideToastsAndAnimations(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `settings-fifo-selected-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('5. /settings/recycle-bin 5-width sweep: APG tabs, desktop table, trades tab captures, 0px overflow', async ({ page }) => {
    await setupProfileSettingsMocks(page, 'settings-recycle-bin');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/settings/recycle-bin', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="deleted-items-table"]').waitFor({ state: 'visible' });
    await hideToastsAndAnimations(page);

    const expTab = page.getByTestId('tab-expenditures');
    await expect(expTab).toHaveAttribute('role', 'tab');
    await expect(expTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'recycle-tab-expenditures');

    const numMetrics = await page.evaluate(() => {
      const cell = document.querySelector('.recycle-num-cell.fs-num');
      return {
        font: getComputedStyle(cell).fontFamily,
        variant: getComputedStyle(cell).fontVariantNumeric,
        inlineCount: document.querySelectorAll('.recycle-bin-container [style]').length,
      };
    });
    expect(numMetrics.font.toLowerCase()).toContain('ibm plex sans');
    expect(numMetrics.variant).toContain('tabular-nums');
    expect(numMetrics.inlineCount).toBe(0);

    for (const width of ALL_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/settings/recycle-bin', { waitUntil: 'domcontentloaded' });
      const waitSel = width > 768 ? '[data-testid="deleted-items-table"]' : '[data-testid="recycle-mobile-cards"]';
      await page.locator(waitSel).waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);

      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `settings-recycle-bin-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }

    // Deleted Trades tab captures at 1440 and 390
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/settings/recycle-bin', { waitUntil: 'domcontentloaded' });
      await page.getByTestId('tab-trades').click();
      await expect(page.getByTestId('tab-trades')).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'recycle-tab-trades');
      const waitSel = width > 768 ? '[data-testid="deleted-items-table"]' : '[data-testid="recycle-mobile-cards"]';
      await page.locator(waitSel).waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `settings-recycle-bin-trades-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('6. /settings/recycle-bin @ 390px: D19 mobile cards, desktop table absent, APG keyboard tabs, 0px overflow', async ({ page }) => {
    await setupProfileSettingsMocks(page, 'settings-recycle-bin');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/settings/recycle-bin', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="recycle-mobile-cards"]').waitFor({ state: 'visible' });

    await expect(page.locator('[data-testid="deleted-items-table"]')).toHaveCount(0);

    const expandBtn = page.getByRole('button', { name: /Show details for Cloud Hosting Invoice/i });
    await expandBtn.click();
    await expect(page.getByRole('button', { name: /Hide details for Cloud Hosting Invoice/i })).toBeVisible();
    await expect(page.getByTestId('restore-btn-exp-del-1')).toBeVisible();

    const expTab = page.getByTestId('tab-expenditures');
    await expTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('tab-trades')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('tab-trades')).toHaveAttribute('aria-selected', 'true');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });

  test('7. Restore modal, empty state, and loading/error captures (visible error toast asserted)', async ({ page }) => {
    // Restore modal @ 1440 & 390
    await setupProfileSettingsMocks(page, 'settings-recycle-bin');
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/settings/recycle-bin', { waitUntil: 'domcontentloaded' });
      if (width <= 768) {
        await page.getByRole('button', { name: /Show details for Cloud Hosting Invoice/i }).click();
      }
      await page.getByTestId('restore-btn-exp-del-1').click();
      await expect(page.getByRole('heading', { name: /Restore Record/i })).toBeVisible();
      await hideToastsAndAnimations(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `settings-recycle-bin-restore-modal-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }

    // Empty state @ 1440 & 390
    await page.unrouteAll();
    await setupProfileSettingsMocks(page, 'settings-recycle-bin', { empty: true });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/settings/recycle-bin', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-testid="empty-recycle-bin"]').waitFor({ state: 'visible' });
      await hideToastsAndAnimations(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `settings-recycle-bin-empty-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }

    // Loading states @ 1440 (3 routes)
    const loadingRoutes = [
      { slug: 'profile', url: '/profile', waitSel: '.user-profile-page .fs-loading' },
      { slug: 'settings', url: '/settings', waitSel: '.settings-page .fs-loading' },
      { slug: 'settings-recycle-bin', url: '/settings/recycle-bin', waitSel: '.recycle-bin-container .fs-loading' },
    ];
    for (const entry of loadingRoutes) {
      await page.unrouteAll();
      await setupProfileSettingsMocks(page, entry.slug, { delayMs: 8000 });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(entry.url, { waitUntil: 'domcontentloaded' });
      await page.locator(entry.waitSel).waitFor({ state: 'visible' });
      await freezeAnimationsOnly(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `${entry.slug}-loading.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }

    // Forced-error states @ 1440 (3 routes, visible toast asserted, no toast masking)
    const errorRoutes = [
      { slug: 'profile', url: '/profile', msg: /Failed to load profile details/i },
      { slug: 'settings', url: '/settings', msg: /Failed to load user settings/i },
      { slug: 'settings-recycle-bin', url: '/settings/recycle-bin', msg: /Failed to load deleted records/i },
    ];
    for (const entry of errorRoutes) {
      await page.unrouteAll();
      await setupProfileSettingsMocks(page, entry.slug, { error: true });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(entry.url, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(entry.msg)).toBeVisible();
      await freezeAnimationsOnly(page);
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, `${entry.slug}-error.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('8. touch targets >= 44px on mobile, focus-visible rings & collision computed-style table', async ({ page }) => {
    await setupProfileSettingsMocks(page, 'profile');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await page.locator('.btn-save-profile').waitFor({ state: 'visible' });

    const profileSaveBox = await page.locator('.btn-save-profile').boundingBox();
    expect(profileSaveBox.height).toBeGreaterThanOrEqual(44);

    // Collision assertions (§0:3)
    const profileCollisions = await page.evaluate(() => {
      const card = document.querySelector('.user-profile-page .profile-card');
      const label = document.querySelector('.user-profile-page .form-label');
      const input = document.querySelector('.user-profile-page .form-input');
      return {
        cardMaxWidth: getComputedStyle(card).maxWidth,
        labelFontSize: getComputedStyle(label).fontSize,
        inputBg: getComputedStyle(input).backgroundColor,
      };
    });
    expect(profileCollisions.cardMaxWidth).toBe('none');
    expect(profileCollisions.labelFontSize).toBe('12px');

    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await page.locator('.settings-save-btn').waitFor({ state: 'visible' });
    const settingsSaveBox = await page.locator('.settings-save-btn').boundingBox();
    const backLinkBox = await page.locator('.settings-nav-link').first().boundingBox();
    expect(settingsSaveBox.height).toBeGreaterThanOrEqual(44);
    expect(backLinkBox.height).toBeGreaterThanOrEqual(44);

    await page.goto('/settings/recycle-bin', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="recycle-mobile-cards"]').waitFor({ state: 'visible' });
    const expandBox = await page.locator('.recycle-expand-btn').first().boundingBox();
    const tabBox = await page.getByTestId('tab-expenditures').boundingBox();
    expect(expandBox.height).toBeGreaterThanOrEqual(44);
    expect(expandBox.width).toBeGreaterThanOrEqual(44);
    expect(tabBox.height).toBeGreaterThanOrEqual(44);

    await page.keyboard.press('Tab');
    const hasFocus = await page.evaluate(() => document.activeElement !== document.body);
    expect(hasFocus).toBe(true);
  });
});
