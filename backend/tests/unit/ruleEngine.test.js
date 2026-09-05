// backend/tests/unit/ruleEngine.test.js
const { matchesRule, evaluateRules, testRule } = require('../../utils/ruleEngine');

describe('ruleEngine Utility Tests', () => {
  describe('matchesRule', () => {
    test('evaluates "contains" case-insensitively', () => {
      expect(matchesRule('AMAZON MARKETPLACE', 'contains', 'amazon')).toBe(true);
      expect(matchesRule('uber eats order', 'contains', 'UBER')).toBe(true);
      expect(matchesRule('carrefour', 'contains', 'walmart')).toBe(false);
    });

    test('evaluates "equals" case-insensitively', () => {
      expect(matchesRule('Rent', 'equals', 'rent')).toBe(true);
      expect(matchesRule('Rent Monthly', 'equals', 'rent')).toBe(false);
    });

    test('evaluates "startsWith"', () => {
      expect(matchesRule('STARBUCKS #401', 'startsWith', 'starbucks')).toBe(true);
      expect(matchesRule('THE STARBUCKS', 'startsWith', 'starbucks')).toBe(false);
    });

    test('evaluates "endsWith"', () => {
      expect(matchesRule('Invoice #101 BILL', 'endsWith', 'bill')).toBe(true);
      expect(matchesRule('BILL #101', 'endsWith', 'bill')).toBe(false);
    });

    test('evaluates "regex" safely', () => {
      expect(matchesRule('Netflix subscription 09/2026', 'regex', 'netflix.*subscription')).toBe(true);
      expect(matchesRule('Netflix subscription', 'regex', '[unclosed')).toBe(false);
    });
  });

  describe('evaluateRules', () => {
    const rules = [
      {
        name: 'Amazon Low Priority',
        field: 'description',
        operator: 'contains',
        value: 'amazon',
        category: 'Shopping & Leisure',
        priority: 1,
        isActive: true,
      },
      {
        name: 'Amazon Fresh High Priority',
        field: 'description',
        operator: 'contains',
        value: 'amazon fresh',
        category: 'Groceries',
        priority: 10,
        isActive: true,
      },
      {
        name: 'Inactive Rule',
        field: 'description',
        operator: 'contains',
        value: 'carrefour',
        category: 'Groceries',
        priority: 100,
        isActive: false,
      },
      {
        name: 'Payment Method Cash',
        field: 'paymentMethod',
        operator: 'equals',
        value: 'Cash',
        category: 'Other',
        priority: 0,
        isActive: true,
      },
    ];

    test('selects higher priority rule when multiple match', () => {
      const exp = { description: 'Amazon Fresh Order #123', paymentMethod: 'Bank' };
      const match = evaluateRules(exp, rules);
      expect(match).not.toBeNull();
      expect(match.category).toBe('Groceries');
      expect(match.matchedRule.name).toBe('Amazon Fresh High Priority');
    });

    test('falls back to lower priority rule when higher does not match', () => {
      const exp = { description: 'Amazon Kindle Book', paymentMethod: 'Bank' };
      const match = evaluateRules(exp, rules);
      expect(match).not.toBeNull();
      expect(match.category).toBe('Shopping & Leisure');
    });

    test('ignores inactive rules', () => {
      const exp = { description: 'Carrefour Hypermarket', paymentMethod: 'Bank' };
      const match = evaluateRules(exp, rules);
      expect(match).toBeNull();
    });

    test('matches against paymentMethod field', () => {
      const exp = { description: 'Random corner store', paymentMethod: 'Cash' };
      const match = evaluateRules(exp, rules);
      expect(match).not.toBeNull();
      expect(match.category).toBe('Other');
    });

    test('returns null when no rule matches', () => {
      const exp = { description: 'Unknown expense', paymentMethod: 'Bank' };
      expect(evaluateRules(exp, rules)).toBeNull();
    });
  });

  describe('testRule', () => {
    test('correctly evaluates a single candidate rule against sample text', () => {
      const rule = { operator: 'contains', value: 'Gym', category: 'Healthcare' };
      expect(testRule(rule, 'Gold Gym Membership')).toEqual({
        matched: true,
        category: 'Healthcare',
      });
      expect(testRule(rule, 'Grocery Store')).toEqual({
        matched: false,
        category: null,
      });
    });
  });
});
