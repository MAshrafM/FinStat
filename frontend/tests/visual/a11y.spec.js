/* eslint-disable jest/valid-expect, testing-library/await-async-utils */
/**
 * frontend/tests/visual/a11y.spec.js
 *
 * Real-browser WCAG 2.1 accessibility and contrast verification suite.
 * Evaluates real computed styles, colors, and layout in Chromium using axe-core.
 */

const { test, expect } = require('@playwright/test');
const { ROUTES } = require('./fixtures/routes');
const { setFixedClock } = require('./fixtures/clock');
const { setupPaycheckMocks } = require('./fixtures/paycheckMocks');
const { setupPortfolioMocks } = require('./fixtures/portfolioMocks');
const { setupRebalancingMocks } = require('./fixtures/rebalancingMocks');
const { setupReportsMocks } = require('./fixtures/reportsMocks');
const { setupTradesMocks } = require('./fixtures/tradesMocks');
const { setupCorporateActionsMocks } = require('./fixtures/corporateActionsMocks');
const { setupMutualFundMocks } = require('./fixtures/mutualFundsMocks');
const { setupGoldMocks } = require('./fixtures/goldMocks');
const { setupCertificatesMocks } = require('./fixtures/certificatesMocks');
const { setupCurrencyMocks } = require('./fixtures/currencyMocks');
const { setupRealEstateMocks } = require('./fixtures/realEstateMocks');
const { setupCreditCardsMocks } = require('./fixtures/creditCardsMocks');
const { setupLendingMocks } = require('./fixtures/lendingMocks');
const { setupProfileSettingsMocks } = require('./fixtures/profileSettingsMocks');
const { setupSecurityMocks } = require('./fixtures/securityMocks');

const AXE_SOURCE_PATH = require.resolve('axe-core/axe.min.js');

test.describe('Real-Browser Accessibility & Contrast (axe-core)', () => {
  for (const route of ROUTES) {
    test(`a11y check: ${route.slug}`, async ({ page }) => {
      page.on('pageerror', err => console.log('PAGE ERROR on', route.slug, ':', err.message));
      page.on('console', msg => console.log('PAGE CONSOLE on', route.slug, ':', msg.type(), msg.text()));
      await page.setViewportSize({ width: 1440, height: 900 });
      await setFixedClock(page);
      await page.addInitScript(() => {
        window.__VISUAL_TEST__ = true;
      });

      if (
        route.slug.startsWith('salary-paycheck') ||
        route.slug.startsWith('salary-profile-') ||
        route.slug === 'analysis-payroll' ||
        route.slug === 'salary-simulator'
      ) {
        await setupPaycheckMocks(page, route.slug);
      } else if (route.slug === 'portfolio') {
        await setupPortfolioMocks(page);
      } else if (route.slug === 'portfolio-rebalancing') {
        await setupRebalancingMocks(page);
      } else if (route.slug === 'reports-financial') {
        await setupReportsMocks(page);
      } else if (
        route.slug.startsWith('trades') ||
        route.slug === 'trade-summary'
      ) {
        await setupTradesMocks(page, route.slug);
      } else if (route.slug.startsWith('corporate-actions')) {
        await setupCorporateActionsMocks(page);
      } else if (route.slug.startsWith('mutual-funds')) {
        await setupMutualFundMocks(page, route.slug);
      } else if (
        route.slug.startsWith('gold-wallet') ||
        route.slug === 'analytics-purchasing-power'
      ) {
        await setupGoldMocks(page, route.slug);
      } else if (route.slug.startsWith('certificates')) {
        await setupCertificatesMocks(page);
      } else if (route.slug.startsWith('currency')) {
        await setupCurrencyMocks(page);
      } else if (route.slug.startsWith('real-estate')) {
        await setupRealEstateMocks(page);
      } else if (route.slug.startsWith('credit-cards')) {
        await setupCreditCardsMocks(page);
      } else if (route.slug.startsWith('lending')) {
        await setupLendingMocks(page);
      } else if (
        route.slug === 'profile' ||
        route.slug === 'settings' ||
        route.slug === 'settings-recycle-bin'
      ) {
        await setupProfileSettingsMocks(page, route.slug);
      } else if (route.slug === 'security') {
        await setupSecurityMocks(page);
      }

      await page.goto(route.resolvedPath, { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-spinner, .loading-spinner-ring, .ca-loading-spinner, .dash-loading-spinner, .fs-loading, .fs-skeleton, .paycheck-loading-container').waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });
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

