/**
 * frontend/tests/visual/dashboard-reference-match.spec.js
 *
 * Automated computed-style verification comparing the live /dashboard route
 * against Canonical Reference Frame 03 (docs/UI-UX_Plan/reference/03-dashboard.html).
 *
 * Verifies 6 critical design tokens:
 * 1. Navbar background: rgb(12, 13, 15) (#0c0d0f, recessed chrome)
 * 2. Primary button background: rgb(20, 184, 166) (#14b8a6, interactive teal accent)
 * 3. Primary button text color: rgb(13, 14, 16) (#0d0e10, --fs-ink for WCAG 2.1 compliance)
 * 4. KPI cards border radius: <= 8px (AD9 8px ceiling)
 * 5. KPI cards background: rgb(22, 24, 29) (#16181d, graphite surface)
 * 6. Page background: rgb(16, 17, 20) (#101114, dark graphite canvas)
 */

const { test, expect } = require('@playwright/test');
const { setFixedClock } = require('./fixtures/clock');

test.describe('Dashboard Reference Match (Live /dashboard vs Frame 03)', () => {
  test('matches Reference Frame 03 design tokens on live /dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setFixedClock(page);

    await page.addInitScript(() => {
      window.__VISUAL_TEST__ = true;
    });

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({
      content: `
        .toast-container,
        [class*="toast-container"],
        .Toastify,
        .toasts-wrapper { display: none !important; }
      `,
    });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.locator('.loading-spinner, .loading-spinner-ring, .ca-loading-spinner, .dash-loading-spinner, .fs-loading, .fs-skeleton').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});

    // 1. Navbar background: rgb(12, 13, 15) (#0c0d0f)
    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();
    const navBg = await navbar.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(navBg).toBe('rgb(12, 13, 15)');

    // 2. Primary button background: rgb(20, 184, 166) (#14b8a6)
    const primaryBtn = page.locator('.dash-hero-actions .fs-btn-primary').first();
    await expect(primaryBtn).toBeVisible();
    const btnBg = await primaryBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(btnBg).toBe('rgb(20, 184, 166)');

    // 3. Primary button text color: rgb(13, 14, 16) (#0d0e10, --fs-ink)
    const btnColor = await primaryBtn.evaluate(el => window.getComputedStyle(el).color);
    expect(btnColor).toBe('rgb(13, 14, 16)');

    // 4. KPI cards border radius: <= 8px
    const kpiCard = page.locator('.dash-kpi').first();
    await expect(kpiCard).toBeVisible();
    const kpiRadius = await kpiCard.evaluate(el => {
      const radiusStr = window.getComputedStyle(el).borderRadius;
      return parseFloat(radiusStr);
    });
    expect(kpiRadius).toBeLessThanOrEqual(8);

    // 5. KPI cards background: var(--fs-surface) (#1a1c20 / rgb(26, 28, 32) or #16181d)
    const kpiBg = await kpiCard.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(['rgb(26, 28, 32)', 'rgb(22, 24, 29)']).toContain(kpiBg);

    // 6. Page background: rgb(16, 17, 20) (#101114)
    const pageBg = await page.evaluate(() => {
      const shell = document.querySelector('.dashboard-shell') || document.body;
      return window.getComputedStyle(shell).backgroundColor;
    });
    expect(pageBg).toBe('rgb(16, 17, 20)');

    // 7. Numeric figures typography (D16 & §4.5: Proportional figures with tabular-nums; Plex Mono is reserved for identifiers)
    const numFigure = page.locator('.fs-num').first();
    await expect(numFigure).toBeVisible();
    const numFontFamily = await numFigure.evaluate(el => window.getComputedStyle(el).fontFamily);
    const numVariant = await numFigure.evaluate(el => window.getComputedStyle(el).fontVariantNumeric);
    expect(numFontFamily).toContain('IBM Plex Sans');
    expect(numVariant).toBe('tabular-nums');

    // 8. CLS <= 0.1 on /dashboard (S2 / R22 requirement)
    const cumulativeLayoutShift = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) cls += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(cls), 3000);
      });
    });
    console.log(`CLS: ${cumulativeLayoutShift}`);
    expect(cumulativeLayoutShift).toBeLessThanOrEqual(0.1);
  });

  test('unthemed route (/trades) has 0 font requests (S2 font isolation)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/trades', { waitUntil: 'networkidle' });
    const fontRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource').filter(r => r.name.match(/\.(?:woff2?|ttf|otf)$/i)).length;
    });
    expect(fontRequests).toBe(0);
  });
});
