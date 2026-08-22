const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../../../validationSchemas/paycheckSchemas');

describe('Paycheck Validation Schemas (Unit Tests)', () => {
  describe('createSchema', () => {
    it('should validate a complete valid paycheck payload', () => {
      const valid = {
        month: '2026-08',
        type: 'Cash',
        amount: 25000,
        note: 'Monthly salary',
        insuranceDeduction: 1200,
        grossAmount: 30000,
        taxDeduction: 3800,
      };

      const result = createSchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(25000);
      expect(result.data.month).toBe('2026-08');
    });

    it('should reject invalid month format', () => {
      const invalid = {
        month: '2026/08/22', // Wrong format
        type: 'Cash',
        amount: 25000,
      };

      const result = createSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('YYYY-MM format');
    });

    it('should reject invalid type enum', () => {
      const invalid = {
        month: '2026-08',
        type: 'Crypto',
        amount: 25000,
      };

      const result = createSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('Type must be one of');
    });

    it('should reject unknown extra fields', () => {
      const invalid = {
        month: '2026-08',
        type: 'Cash',
        amount: 25000,
        _id: '507f1f77bcf86cd799439011',
      };

      const result = createSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('updateSchema', () => {
    it('should validate partial update', () => {
      const valid = { amount: 32000, note: 'Bonus included' };
      const result = updateSchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(valid);
    });

    it('should reject typos on update keys', () => {
      const invalid = { amont: 32000 };
      const result = updateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('querySchema', () => {
    it('should parse year and coerce pagination', () => {
      const result = querySchema.safeParse({ year: '2026', page: '2', limit: '10' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ year: 2026, page: 2, limit: 10 });
    });

    it('should sanitize "undefined", "null", "all", and "" to undefined', () => {
      expect(querySchema.safeParse({ year: 'undefined' }).data.year).toBeUndefined();
      expect(querySchema.safeParse({ year: 'null' }).data.year).toBeUndefined();
      expect(querySchema.safeParse({ year: 'all' }).data.year).toBeUndefined();
      expect(querySchema.safeParse({ year: '' }).data.year).toBeUndefined();
    });

    it('should reject invalid year string that is not a recognized keyword', () => {
      const result = querySchema.safeParse({ year: 'invalid-year' });
      expect(result.success).toBe(false);
    });
  });
});

