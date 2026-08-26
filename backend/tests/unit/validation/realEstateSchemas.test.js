// backend/tests/unit/validation/realEstateSchemas.test.js
const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../../../validationSchemas/realEstateSchemas');

describe('RealEstate Validation Schemas', () => {
  describe('createSchema', () => {
    it('should validate valid real estate payload', () => {
      const payload = {
        name: 'Apartment 101 New Cairo',
        type: 'Residential',
        area: 120,
        location: 'New Cairo, 5th Settlement',
        purchasePrice: 1500000,
        currentValuation: 2200000,
        purchaseDate: '2022-05-15',
        status: 'Owned',
      };

      const result = createSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Apartment 101 New Cairo');
      expect(result.data.area).toBe(120);
    });

    it('should reject missing name or non-positive purchasePrice', () => {
      const invalidPayload = {
        type: 'Residential',
        purchasePrice: -500,
        currentValuation: 1000,
        purchaseDate: '2023-01-01',
      };

      const result = createSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('updateSchema', () => {
    it('should allow partial updates', () => {
      const payload = {
        currentValuation: 2500000,
        notes: 'Market appreciation',
      };

      const result = updateSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data.currentValuation).toBe(2500000);
    });
  });

  describe('paramsSchema', () => {
    it('should validate valid Mongo ObjectId', () => {
      const result = paramsSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid Mongo ObjectId', () => {
      const result = paramsSchema.safeParse({ id: 'invalid-id-123' });
      expect(result.success).toBe(false);
    });
  });
});
