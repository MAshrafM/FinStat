/**
 * frontend/tests/visual/a11y.spec.js
 *
 * Real-browser WCAG 2.1 accessibility and contrast verification suite.
 * Evaluates real computed styles, colors, and layout in Chromium using axe-core.
 */

const { test, expect } = require('@playwright/test');
const { ROUTES } = require('./fixtures/routes');
const { setFixedClock } = require('./fixtures/clock');

const AXE_SOURCE_PATH = require.resolve('axe-core/axe.min.js');

test.describe('Real-Browser Accessibility & Contrast (axe-core)', () => {
  for (const route of ROUTES) {
    test(`a11y check: ${route.slug}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await setFixedClock(page);

      await page.goto(route.resolvedPath, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Inject axe-core into the real browser DOM
      await page.addScriptTag({ path: AXE_SOURCE_PATH });

      // Run axe against the full rendered document
      const axeResults = await page.evaluate(async () => {
        return await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa'],
          },
        });
      });

      // Filter critical violations
      const seriousViolations = axeResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(
        seriousViolations,
        `Accessibility violations found on ${route.resolvedPath}:\n` +
          seriousViolations.map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`).join('\n')
      ).toEqual([]);
    });
  }
});

