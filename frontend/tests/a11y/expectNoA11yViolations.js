const { axe, toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);

/**
 * Shared accessibility assertion helper for React component tests in jsdom.
 *
 * NOTE:
 * - Evaluates structural accessibility, roles, and labels in jsdom.
 * - jsdom has no rendering or layout engine: color-contrast and layout-dependent
 *   rules are skipped. Full color contrast is measured against the real browser
 *   in Playwright via a11y.spec.js.
 * - Disables the 'region' rule by default since component test containers do not
 *   contain landmark regions.
 *
 * @param {HTMLElement|string} container - DOM node or HTML string to test
 * @param {object} [options] - Additional axe options or rule overrides
 */
async function expectNoA11yViolations(container, options = {}) {
  const results = await axe(container, {
    rules: {
      region: { enabled: false }, // jsdom container override
      ...options.rules,
    },
  });
  expect(results).toHaveNoViolations();
}

module.exports = { expectNoA11yViolations };

