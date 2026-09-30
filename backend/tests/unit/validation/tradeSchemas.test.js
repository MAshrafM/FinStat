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

    it('should allow TopUp trade without stockCode or with empty stockCode', () => {
      const validTopUpNoCode = {
        date: '2026-08-22',
        broker: 'Thndr',
        type: 'TopUp',
        totalValue: 5000,
      };

      const result1 = createSchema.safeParse(validTopUpNoCode);
      expect(result1.success).toBe(true);

      const validTopUpEmptyCode = {
        date: '2026-08-22',
        broker: 'Thndr',
        type: 'TopUp',
        stockCode: '',
        totalValue: 5000,
      };

      const result2 = createSchema.safeParse(validTopUpEmptyCode);
      expect(result2.success).toBe(true);
      expect(result2.data.stockCode).toBeUndefined();
    });

    it('should allow Withdraw trade with empty stockCode', () => {
      const validWithdraw = {
        date: '2026-08-22',
        broker: 'EFG',
        type: 'Withdraw',
        stockCode: '',
        totalValue: 2000,
      };

      const result = createSchema.safeParse(validWithdraw);
      expect(result.success).toBe(true);
      expect(result.data.stockCode).toBeUndefined();
    });

    it('should fail Buy trade with empty string stockCode', () => {
      const invalidBuy = {
        date: '2026-08-22',
        broker: 'Thndr',
        type: 'Buy',
        stockCode: '',
        price: 85.5,
        shares: 100,
        totalValue: 8550,
      };

      const result = createSchema.safeParse(invalidBuy);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toEqual(['stockCode']);
      expect(result.error.issues[0].message).toContain('Stock code is required');
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
