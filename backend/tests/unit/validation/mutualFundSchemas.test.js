const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../../../validationSchemas/mutualFundSchemas');

describe('MutualFund Validation Schemas (Unit Tests)', () => {
  it('should validate valid mutual fund trade payload', () => {
    const valid = {
      date: '2026-08-22',
      name: 'AZ-Opportunity MF',
      code: 'AZO',
      type: 'Buy',
      units: 50,
      price: 200,
      fees: 10,
      totalValue: 10010,
    };

    const result = createSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data.code).toBe('AZO');
  });

  it('should reject invalid enum type', () => {
    const invalid = {
      date: '2026-08-22',
      name: 'AZ-Opportunity MF',
      code: 'AZO',
      type: 'Transfer',
      totalValue: 5000,
    };

    const result = createSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
