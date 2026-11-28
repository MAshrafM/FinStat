// frontend/tests/visual/admin-reference-match.spec.js
const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');
const { setupAdminMocks } = require('./fixtures/adminMocks');

const ADMIN_ROUTES = [
  { path: '/admin', slug: 'admin' },
  { path: '/admin/tax-brackets', slug: 'admin-tax-brackets' },
  { path: '/admin/social-insurance', slug: 'admin-social-insurance' },
  { path: '/admin/backup', slug: 'admin-backup' },
];

test.describe('Phase 10C Admin Reference Match & Responsive QA', () => {
  for (const route of ADMIN_ROUTES) {
    for (const width of [1440, 390]) {
      test(`${route.slug} @ ${width}px has zero horizontal overflow and dark theme applied`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await setFixedClock(page);
        await page.addInitScript(() => {
          window.__VISUAL_TEST__ = true;
        });
        await setupAdminMocks(page);

        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        await page.locator('.fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(300);

        const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-fs-theme'));
        expect(themeAttr).toBe('dark');

        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
      });
    }
  }

  test('admin user table collapses to D19 mobile cards at 390px and opens Add User modal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await setFixedClock(page);
    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });
    await setupAdminMocks(page);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await expect(page.getByTestId('admin-users-mobile-cards')).toBeVisible();

    await page.getByRole('button', { name: /Add New User/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
