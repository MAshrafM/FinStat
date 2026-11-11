/**
 * frontend/tests/visual/reference-frames.spec.js
 *
 * Visual regression tests for the 3 canonical reference frames:
 * 1. 01-dense-table.html
 * 2. 02-form.html
 * 3. 03-dashboard.html
 *
 * Rendered at 1440px viewport to establish baseline snapshots
 * against real tokens and primitives.
 */

const { test, expect } = require('@playwright/test');

const REFERENCE_FRAMES = [
  {
    name: '01-dense-table',
    url: 'http://localhost:3001/docs/UI-UX_Plan/reference/01-dense-table.html',
    snapshotName: 'reference-01-dense-table-1440.png',
  },
  {
    name: '02-form',
    url: 'http://localhost:3001/docs/UI-UX_Plan/reference/02-form.html',
    snapshotName: 'reference-02-form-1440.png',
  },
  {
    name: '03-dashboard',
    url: 'http://localhost:3001/docs/UI-UX_Plan/reference/03-dashboard.html',
    snapshotName: 'reference-03-dashboard-1440.png',
  },
];

test.describe('Reference Frames Visual Suite', () => {
  for (const frame of REFERENCE_FRAMES) {
    test(`${frame.name} @ 1440px`, async ({ page }) => {
      const consoleErrors = [];
      const failedRequests = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('response', res => {
        if (res.status() >= 400) failedRequests.push(`${res.url()} (${res.status()})`);
      });

      await page.setViewportSize({ width: 1440, height: 900 });

      // Invalidate transient effects / freeze any transitions
      await page.addInitScript(() => {
        window.__VISUAL_TEST__ = true;
      });

      await page.goto(frame.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready).catch(() => {});

      // Verify zero console errors and zero 404s/failed requests (M6)
      expect(failedRequests).toEqual([]);
      expect(consoleErrors).toEqual([]);

      // Verify self-hosted IBM Plex Sans has loaded
      const fontLoaded = await page.evaluate(() => document.fonts.check('14px "IBM Plex Sans"'));
      expect(fontLoaded).toBe(true);

      // Toast suppression (consistent test-only harness rule)
      await page.addStyleTag({
        content: `
          *, *::before, *::after { transition: none !important; animation: none !important; }
          .toast-container,
          [class*="toast-container"],
          .Toastify,
          .undo-toast-wrapper,
          [role="status"],
          [role="alert"] {
            display: none !important;
            visibility: hidden !important;
          }
        `,
      }).catch(() => {});

      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(frame.snapshotName, {
        fullPage: true,
        timeout: 15000,
      });
    });
  }
});

