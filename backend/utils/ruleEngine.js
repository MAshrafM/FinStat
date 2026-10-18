// backend/utils/ruleEngine.js

/**
 * Tests whether a target string satisfies a given rule condition.
 * @param {string} targetValue
 * @param {'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex'} operator
 * @param {string} ruleValue
 * @returns {boolean}
 */
function matchesRule(targetValue, operator, ruleValue) {
  if (ruleValue === undefined || ruleValue === null) return false;
  const str = (targetValue || '').toString().trim();
  const val = ruleValue.toString().trim();

  switch (operator) {
    case 'contains':
      return str.toLowerCase().includes(val.toLowerCase());
    case 'equals':
      return str.toLowerCase() === val.toLowerCase();
    case 'startsWith':
      return str.toLowerCase().startsWith(val.toLowerCase());
    case 'endsWith':
      return str.toLowerCase().endsWith(val.toLowerCase());
    case 'regex':
      try {
        // Safe regex execution with case-insensitivity
        const regex = new RegExp(val, 'i');
        return regex.test(str);
      } catch (e) {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Evaluates active categorization rules (highest priority first) against an expenditure.
 * @param {object} expenditure - Object with description, paymentMethod, merchant, etc.
 * @param {Array<object>} rules - Array of active CategorizationRule documents or objects.
 * @returns {{ category: string, matchedRule: object } | null}
 */
function evaluateRules(expenditure, rules = []) {
  if (!expenditure || !Array.isArray(rules) || rules.length === 0) {
    return null;
  }

  // Ensure rules are sorted by priority descending
  const sortedRules = [...rules]
    .filter((r) => r.isActive !== false)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of sortedRules) {
    let targetValue = '';

    if (rule.field === 'description') {
      targetValue = expenditure.description || '';
    } else if (rule.field === 'paymentMethod') {
      targetValue = expenditure.paymentMethod || '';
    } else if (rule.field === 'merchant') {
      targetValue = expenditure.merchant || expenditure.description || '';
    } else {
      targetValue = expenditure[rule.field] || '';
    }

    if (matchesRule(targetValue, rule.operator, rule.value)) {
      return {
        category: rule.category,
        matchedRule: rule,
      };
    }
  }

  return null;
}

const vm = require('vm');

/**
 * Executes a regular expression test inside an isolated vm context
 * with a 100ms execution timeout guard to protect the event loop.
 *
 * @param {string} pattern - Regular expression pattern
 * @param {string} sampleText - Input sample string
 * @param {number} timeoutMs - Timeout in milliseconds (default: 100ms)
 * @returns {boolean} Whether pattern matched within the timeout window
 */
function testRegexWithTimeout(pattern, sampleText, timeoutMs = 100) {
  try {
    const context = {
      str: (sampleText || '').toString(),
      pattern: pattern,
      result: false,
    };
    vm.createContext(context);
    vm.runInContext('result = new RegExp(pattern, "i").test(str);', context, {
      timeout: timeoutMs,
    });
    return Boolean(context.result);
  } catch (err) {
    // Timed out or regex syntax error; fail safe without blocking event loop
    return false;
  }
}

/**
 * Helper to test a rule against a sample text.
 * Uses testRegexWithTimeout (100ms vm guard) for regex rules to protect the event loop.
 *
 * @param {object} rule - Rule definition containing operator, value, category
 * @param {string} sampleText - Sample text input
 * @returns {{ matched: boolean, category: string | null }}
 */
function testRule(rule, sampleText) {
  if (!rule) {
    return { matched: false, category: null };
  }

  let isMatch = false;
  if (rule.operator === 'regex') {
    isMatch = testRegexWithTimeout(rule.value, sampleText, 100);
  } else {
    isMatch = matchesRule(sampleText, rule.operator, rule.value);
  }

  return {
    matched: isMatch,
    category: isMatch ? rule.category : null,
  };
}

module.exports = {
  matchesRule,
  evaluateRules,
  testRule,
  testRegexWithTimeout,
};

