// backend/tests/unit/ruleEngineSecurity.test.js
const {
  createRuleSchema,
  updateRuleSchema,
  testRuleSchema,
} = require('../../validationSchemas/categorizationRuleSchemas');
const {
  matchesRule,
  testRule,
  testRegexWithTimeout,
} = require('../../utils/ruleEngine');

describe('Categorization Rule Engine ReDoS Mitigation Tests [AUD-SEC-005]', () => {
  describe('Zod Schema Validation (Ingress Defense)', () => {
    it('accepts safe regular expressions', () => {
      const validPayload = {
        name: 'Amazon Cloud',
        operator: 'regex',
        value: 'amazon|aws',
        category: 'Services',
      };
      const result = createRuleSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects classic exponential backtracking regex (a+)+$', () => {
      const vulnerablePayload = {
        name: 'Vulnerable Rule',
        operator: 'regex',
        value: '(a+)+$',
        category: 'Shopping',
      };
      const result = createRuleSchema.safeParse(vulnerablePayload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('catastrophic backtracking');
    });

    it('rejects nested quantifier regex ([a-zA-Z]+)*$', () => {
      const vulnerablePayload = {
        name: 'Nested Group Rule',
        operator: 'regex',
        value: '([a-zA-Z]+)*$',
        category: 'Shopping',
      };
      const result = createRuleSchema.safeParse(vulnerablePayload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('catastrophic backtracking');
    });

    it('rejects regex pattern exceeding 150 characters', () => {
      const longPayload = {
        name: 'Long Pattern Rule',
        operator: 'regex',
        value: 'a'.repeat(151),
        category: 'Shopping',
      };
      const result = createRuleSchema.safeParse(longPayload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('cannot exceed 150 characters');
    });

    it('rejects malformed regex syntax cleanly without throwing an unhandled exception', () => {
      const malformedPayload = {
        name: 'Malformed Syntax Rule',
        operator: 'regex',
        value: '([unclosed',
        category: 'Shopping',
      };
      const result = createRuleSchema.safeParse(malformedPayload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Invalid or unsafe regular expression pattern');
    });

    it('validates regex patterns on updateRuleSchema', () => {
      const updatePayload = {
        operator: 'regex',
        value: '(x+x+)+y',
      };
      const result = updateRuleSchema.safeParse(updatePayload);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('catastrophic backtracking');
    });

    it('rejects sampleText exceeding 1,000 characters in testRuleSchema', () => {
      const longSample = {
        operator: 'regex',
        value: 'test',
        category: 'Shopping',
        sampleText: 'x'.repeat(1001),
      };
      const result = testRuleSchema.safeParse(longSample);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('cannot exceed 1,000 characters');
    });
  });

  describe('Runtime Execution & Timeout Guard', () => {
    it('testRule matches valid regex within timeout guard', () => {
      const rule = {
        operator: 'regex',
        value: '^salary_\\d+$',
        category: 'Income',
      };
      const result = testRule(rule, 'salary_2026');
      expect(result.matched).toBe(true);
      expect(result.category).toBe('Income');
    });

    it('testRegexWithTimeout safely terminates without blocking event loop on pathological input', () => {
      // Pathological regex evaluated against non-matching string
      const startTime = Date.now();
      const match = testRegexWithTimeout('(a+)+$', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa!', 100);
      const elapsed = Date.now() - startTime;

      expect(match).toBe(false);
      // Timeout should cap execution within reasonable bounds (e.g. ~100-300ms)
      expect(elapsed).toBeLessThan(1000);
    });

    it('matchesRule executes without vm overhead on hot path', () => {
      const isMatch = matchesRule('AWS Cloud Invoice', 'regex', 'aws');
      expect(isMatch).toBe(true);

      const noMatch = matchesRule('Google Workspace', 'regex', 'aws');
      expect(noMatch).toBe(false);
    });
  });
});
