/**
 * frontend/tests/visual/visual.spec.js
 *
 * Deterministic visual regression test suite per UI-UX-PLAN.md §4.7 & §9.5.
 * Tests 65 routes across the 5 mandatory QA widths:
 * 1440px, 1024px, 768px, 480px, 390px (= 325 snapshots).
 */

const { test, expect } = require('@playwright/test');
const { ROUTES } = require('./fixtures/routes');
const { setFixedClock } = require('./fixtures/clock');

const MANDATORY_QA_WIDTHS = [1440, 1024, 768, 480, 390];

// Smoke routes for PR subset
const SMOKE_ROUTE_SLUGS = new Set([
  'dashboard',
  'expenditures',
  'salary-paychecks',
  'portfolio',
  'credit-cards',
]);

const isPrSubset = process.env.PR_SUBSET === 'true';

test.describe('Visual Regression Suite', () => {
  for (const route of ROUTES) {
    for (const width of MANDATORY_QA_WIDTHS) {
      // In PR subset mode, run:
      // 1. All routes at 1440
      // 2. Smoke routes at 1440 & 390
      if (isPrSubset) {
        const isSmoke = SMOKE_ROUTE_SLUGS.has(route.slug);
        if (width !== 1440 && !(isSmoke && width === 390)) {
          continue;
        }
      }

      test(`${route.slug} @ ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });

        // Freeze clock at 2026-01-15T09:00:00Z
        await setFixedClock(page);

        // Invalidate transient effects / freeze Chart.js animations
        await page.addInitScript(() => {
          window.__VISUAL_TEST__ = true;
        });

        // Navigate to route
        await page.goto(route.resolvedPath, { waitUntil: 'domcontentloaded' });

        // Wait for main content or fallback container
        await page.waitForTimeout(500);

        // Selector-based masking per Component 5.3 & N1 (zero changes to production UI)
        const maskLocators = [
          page.locator('time'),
          page.locator('[data-testid$="-id"]'),
          page.locator('[data-testid*="timestamp"]'),
          page.locator('[data-testid*="date"]'),
          page.locator('[data-visual-mask="true"]'),
        ];

        // Filter to locators that actually match elements on this page
        const activeMasks = [];
        for (const loc of maskLocators) {
          const count = await loc.count().catch(() => 0);
          if (count > 0) {
            activeMasks.push(loc);
          }
        }

        // Assert visual baseline snapshot
        await expect(page).toHaveScreenshot(`${route.slug}-${width}.png`, {
          mask: activeMasks,
          fullPage: true,
        });
      });
    }
  }
});

