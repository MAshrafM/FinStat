const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../../../validationSchemas/expenditureSchemas');

describe('Expenditure Validation Schemas (Unit Tests)', () => {
  describe('createSchema', () => {
    it('should validate a complete valid expenditure payload', () => {
      const validPayload = {
        date: '2026-08-22',
        bank: 1500,
        cash: 300,
        prepaid: 100,
        transactionValue: 50,
        transactionType: 'W',
        paymentMethod: 'Bank',
        categories: ['Groceries'],
        description: 'Supermarket shopping',
      };

      const result = createSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      expect(result.data.bank).toBe(1500);
      expect(result.data.description).toBe('Supermarket shopping');
    });

    it('should apply defaults for omitted optional fields in create', () => {
      const minimalPayload = {
        date: '2026-08-22',
        transactionValue: 120,
        transactionType: 'W',
      };

      const result = createSchema.safeParse(minimalPayload);
      expect(result.success).toBe(true);
      expect(result.data.bank).toBe(0);
      expect(result.data.cash).toBe(0);
      expect(result.data.prepaid).toBe(0);
      expect(result.data.paymentMethod).toBe('Bank');
      expect(result.data.categories).toEqual(['Other']);
    });

    it('should fail when required fields are missing', () => {
      const result = createSchema.safeParse({
        date: '2026-08-22',
      });
      expect(result.success).toBe(false);
      const fields = result.error.issues.map((i) => i.path.join('.'));
      expect(fields).toContain('transactionValue');
      expect(fields).toContain('transactionType');
    });

    it('should reject unknown fields in create due to .strict()', () => {
      const payloadWithExtra = {
        date: '2026-08-22',
        transactionValue: 100,
        transactionType: 'W',
        unknownField: 'malicious or unexpected',
        _id: '507f1f77bcf86cd799439011',
      };

      const result = createSchema.safeParse(payloadWithExtra);
      expect(result.success).toBe(false);
    });

    it('should reject invalid enum values', () => {
      const result = createSchema.safeParse({
        date: '2026-08-22',
        transactionValue: 100,
        transactionType: 'INVALID_TYPE',
        paymentMethod: 'Bitcoin',
      });

      expect(result.success).toBe(false);
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('Transaction type must be one of'))).toBe(true);
      expect(messages.some((m) => m.includes('Payment method must be one of'))).toBe(true);
    });

    it('should allow empty or whitespace-only description and convert to undefined', () => {
      const result = createSchema.safeParse({
        date: '2026-08-22',
        transactionValue: 100,
        transactionType: 'W',
        description: '   ', // whitespace only
      });

      expect(result.success).toBe(true);
      expect(result.data.description).toBeUndefined();

      const resultEmpty = createSchema.safeParse({
        date: '2026-08-22',
        transactionValue: 100,
        transactionType: 'W',
        description: '', // empty string
      });

      expect(resultEmpty.success).toBe(true);
      expect(resultEmpty.data.description).toBeUndefined();
    });

    it('should reject null for description in create', () => {
      const result = createSchema.safeParse({
        date: '2026-08-22',
        transactionValue: 100,
        transactionType: 'W',
        description: null,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateSchema', () => {
    it('should validate a valid partial update', () => {
      const partialUpdate = {
        transactionValue: 200,
        description: 'Updated note',
      };

      const result = updateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(partialUpdate);
    });

    it('should allow description: "" in update and treat as undefined', () => {
      const updateWithEmpty = {
        description: '',
      };

      const result = updateSchema.safeParse(updateWithEmpty);
      expect(result.success).toBe(true);
      expect(result.data.description).toBeUndefined();
    });

    it('should reject unknown fields in update due to .strict()', () => {
      const updateWithTypo = {
        transactionValu: 200, // Typo
      };

      const result = updateSchema.safeParse(updateWithTypo);
      expect(result.success).toBe(false);
    });

    it('should reject null for optional fields without nullable', () => {
      const updateWithNull = {
        description: null,
      };

      const result = updateSchema.safeParse(updateWithNull);
      expect(result.success).toBe(false);
    });
  });

  describe('paramsSchema', () => {
    it('should validate valid MongoDB ObjectId', () => {
      const valid = paramsSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid MongoDB ObjectId', () => {
      const invalid = paramsSchema.safeParse({ id: '123' });
      expect(invalid.success).toBe(false);
      expect(invalid.error.issues[0].message).toBe('Invalid ID format');
    });
  });

  describe('querySchema', () => {
    it('should provide default page and limit', () => {
      const result = querySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ page: 1, limit: 20, type: undefined });
    });

    it('should coerce and trim query parameters', () => {
      const result = querySchema.safeParse({
        page: '2',
        limit: '15',
        type: '  Bank  ',
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ page: 2, limit: 15, type: 'Bank' });
    });
  });
});
