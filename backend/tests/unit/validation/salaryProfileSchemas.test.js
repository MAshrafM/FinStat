const {
  createSchema,
  updateSchema,
  historyParamsSchema,
  updateHistorySchema,
} = require('../../../validationSchemas/salaryProfileSchemas');

describe('SalaryProfile Validation Schemas (Unit Tests)', () => {
  describe('createSchema', () => {
    it('should validate full salary profile creation payload', () => {
      const valid = {
        name: 'John Doe',
        title: 'Senior Engineer',
        position: 'Tech Lead',
        year: 2026,
        salaryDetails: {
          basicSalary: 50000,
          basicProduction: 10000,
          meal: 1500,
        },
      };

      const result = createSchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('John Doe');
      expect(result.data.salaryDetails.basicSalary).toBe(50000);
      expect(result.data.salaryDetails.prepaid).toBe(0); // default applied
    });

    it('should fail when required profile fields are missing', () => {
      const invalid = { position: 'Engineer' };
      const result = createSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      const fields = result.error.issues.map((i) => i.path.join('.'));
      expect(fields).toContain('name');
      expect(fields).toContain('title');
      expect(fields).toContain('year');
    });

    it('should reject extra fields due to strict()', () => {
      const invalid = {
        name: 'John',
        title: 'Lead',
        year: 2026,
        extra: 'field',
      };
      const result = createSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('historyParamsSchema', () => {
    it('should validate valid MongoDB historyId', () => {
      const valid = historyParamsSchema.safeParse({ historyId: '507f1f77bcf86cd799439011' });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid historyId', () => {
      const invalid = historyParamsSchema.safeParse({ historyId: 'not-valid' });
      expect(invalid.success).toBe(false);
    });
  });

  describe('updateHistorySchema', () => {
    it('should validate partial history update', () => {
      const valid = { basicSalary: 60000, variables: 5000 };
      const result = updateHistorySchema.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(valid);
    });
  });
});
