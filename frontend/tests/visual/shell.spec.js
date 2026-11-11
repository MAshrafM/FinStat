/**
 * frontend/tests/visual/shell.spec.js
 *
 * Dedicated shell visual regression test suite per UI-UX-PLAN.md §6.6 (Phase 2B Option A)
 * Tests 6 persistent shell configurations on the stable /portfolio route:
 * 1. shell-legacy-desktop (1440px, unthemed)
 * 2. shell-legacy-mobile (390px, unthemed)
 * 3. shell-dark-desktop-collapsed (1440px, themed dark, collapsed 70px)
 * 4. shell-dark-desktop-expanded (1440px, themed dark, expanded 280px via hover)
 * 5. shell-dark-mobile-drawer (390px, themed dark, open mobile drawer)
 * 6. shell-dark-account-dropdown (1440px, themed dark, account switcher popover open)
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');

const TEST_ROUTE = '/portfolio';

// Common preparation helper
async function prepareShellPage(page, { width, themed = false }) {
  await page.setViewportSize({ width, height: 900 });
  await setFixedClock(page);

  await page.addInitScript(({ isThemed }) => {
    window.__VISUAL_TEST__ = true;
    if (isThemed) {
      document.documentElement.setAttribute('data-fs-theme', 'dark');
    }
  }, { isThemed: themed });

  await page.goto(TEST_ROUTE, { waitUntil: 'domcontentloaded' });
  if (themed) {
    await page.evaluate(() => document.documentElement.setAttribute('data-fs-theme', 'dark'));
  }
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => { });
  await page.locator('.loading-spinner, .loading-spinner-ring, .ca-loading-spinner, .dash-loading-spinner').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });
  await page.evaluate(() => document.fonts.ready).catch(() => { });

  // Disable CSS transitions/animations for visual determinism
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }
      .toast-container,
      [class*="toast-container"],
      .Toastify,
      .alert-banner {
        display: none !important;
      }
    `,
  });
}

test.describe('Shell Visual Suite (Option A)', () => {
  test('shell-legacy-desktop', async ({ page }) => {
    await prepareShellPage(page, { width: 1440, themed: false });
    await expect(page).toHaveScreenshot('shell-legacy-desktop.png');
  });

  test('shell-legacy-mobile', async ({ page }) => {
    await prepareShellPage(page, { width: 390, themed: false });
    await expect(page).toHaveScreenshot('shell-legacy-mobile.png');
  });

  test('shell-dark-desktop-collapsed', async ({ page }) => {
    await prepareShellPage(page, { width: 1440, themed: true });

    // Assert computed styles on themed shell
    const navbarBg = await page.locator('.navbar').evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const sidebarBg = await page.locator('.sidebar').evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(navbarBg).toBe('rgb(12, 13, 15)'); // #0c0d0f (--fs-surface-sunken)
    expect(sidebarBg).toBe('rgb(12, 13, 15)'); // #0c0d0f (--fs-surface-sunken)

    await expect(page).toHaveScreenshot('shell-dark-desktop-collapsed.png');
  });

  test('shell-dark-desktop-expanded', async ({ page }) => {
    await prepareShellPage(page, { width: 1440, themed: true });

    // Trigger sidebar expansion by hovering
    await page.locator('.sidebar').hover();
    await page.locator('.sidebar.expanded').waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });

    // Assert active sidebar item styling
    const activeItem = page.locator('.sidebar-item.active').first();
    if (await activeItem.count() > 0) {
      const activeBg = await activeItem.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      const activeBorderLeft = await activeItem.evaluate((el) => window.getComputedStyle(el).borderLeft);
      expect(activeBg).toBe('rgb(34, 37, 42)'); // #22252a (--fs-surface-raised)
      expect(activeBorderLeft).toContain('rgb(242, 243, 245)'); // #f2f3f5 (--fs-text)
    }

    await expect(page).toHaveScreenshot('shell-dark-desktop-expanded.png');
  });

  test('shell-dark-mobile-drawer', async ({ page }) => {
    await prepareShellPage(page, { width: 390, themed: true });

    // Open mobile sidebar drawer
    const mobileToggle = page.locator('.mobile-toggle');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await page.locator('.sidebar.expanded').waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
    }

    await expect(page).toHaveScreenshot('shell-dark-mobile-drawer.png');
  });

  test('shell-dark-account-dropdown', async ({ page }) => {
    await prepareShellPage(page, { width: 1440, themed: true });

    // Expand sidebar so account switcher is visible
    await page.locator('.sidebar').hover();
    await page.locator('.sidebar.expanded').waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });

    // Open account switcher dropdown
    const accountPill = page.locator('.account-switcher-pill');
    if (await accountPill.isVisible()) {
      await accountPill.click();
      await page.locator('.account-switcher-dropdown').waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
    }

    await expect(page).toHaveScreenshot('shell-dark-account-dropdown.png');
  });
});
