const { createSchema, updateSchema, querySchema } = require('../../../validationSchemas/goldSchemas');

describe('Gold Validation Schemas (Unit Tests)', () => {
  it('should validate valid gold payload', () => {
    const valid = {
      date: '2026-08-22',
      item: 'Gold Bar 10g',
      karat: 24,
      weight: 10,
      price: 3500,
      paid: 35000,
      status: 'hold',
    };

    const result = createSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data.weight).toBe(10);
  });

  it('should validate sellingDate after purchase date', () => {
    const valid = {
      date: '2026-01-01',
      item: 'Coin',
      karat: 21,
      weight: 8,
      price: 3000,
      paid: 24000,
      status: 'sold',
      sellingPrice: 3500,
      sellingDate: '2026-08-01',
    };

    const result = createSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should fail when sellingDate is before purchase date', () => {
    const invalid = {
      date: '2026-08-01',
      item: 'Coin',
      karat: 21,
      weight: 8,
      price: 3000,
      paid: 24000,
      status: 'sold',
      sellingPrice: 3500,
      sellingDate: '2026-01-01',
    };

    const result = createSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['sellingDate']);
  });

  it('should coerce numeric strings in updateSchema and sanitize empty strings', () => {
    const updatePayload = {
      karat: '24',
      weight: '10.5',
      price: '3200',
      paid: '33600',
      seller: '',
      status: 'hold',
      sellingPrice: '',
      sellingDate: '',
    };

    const result = updateSchema.safeParse(updatePayload);
    expect(result.success).toBe(true);
    expect(result.data.karat).toBe(24);
    expect(result.data.weight).toBe(10.5);
    expect(result.data.price).toBe(3200);
    expect(result.data.paid).toBe(33600);
    expect(result.data.seller).toBeUndefined();
    expect(result.data.sellingPrice).toBeUndefined();
    expect(result.data.sellingDate).toBeUndefined();
  });

  it('should coerce valid sellingPrice numeric string in sold status update', () => {
    const updatePayload = {
      status: 'sold',
      sellingPrice: '3850',
      sellingDate: '2026-08-23',
    };

    const result = updateSchema.safeParse(updatePayload);
    expect(result.success).toBe(true);
    expect(result.data.sellingPrice).toBe(3850);
  });
});

