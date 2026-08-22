const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../../../validationSchemas/tradeSchemas');

describe('Trade Validation Schemas (Unit Tests)', () => {
  describe('createSchema & cross-field refinement', () => {
    it('should validate Buy trade with stockCode', () => {
      const valid = {
        date: '2026-08-22',
        broker: 'Thndr',
        stockCode: 'COMI',
        type: 'Buy',
        price: 85.5,
        shares: 100,
        totalValue: 8550,
      };

      const result = createSchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data.stockCode).toBe('COMI');
    });

    it('should fail Buy trade without stockCode (cross-field refinement)', () => {
      const invalid = {
        date: '2026-08-22',
        broker: 'Thndr',
        type: 'Buy',
        price: 85.5,
        shares: 100,
        totalValue: 8550,
      };

      const result = createSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toEqual(['stockCode']);
      expect(result.error.issues[0].message).toContain('Stock code is required');
    });

    it('should allow TopUp trade without stockCode', () => {
      const validTopUp = {
        date: '2026-08-22',
        broker: 'Thndr',
        type: 'TopUp',
        totalValue: 5000,
      };

      const result = createSchema.safeParse(validTopUp);
      expect(result.success).toBe(true);
    });
  });

  describe('querySchema', () => {
    it('should coerce pagination and filter parameters', () => {
      const result = querySchema.safeParse({ page: '1', broker: 'Thndr', search: 'COMI' });
      expect(result.success).toBe(true);
      expect(result.data.broker).toBe('Thndr');
      expect(result.data.search).toBe('COMI');
    });
  });
});
