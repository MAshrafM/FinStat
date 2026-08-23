const { createSchema: certCreate } = require('../../../validationSchemas/certificateSchemas');
const { createSchema: currCreate } = require('../../../validationSchemas/currencySchemas');
const { createCardSchema, createTransactionSchema, createPaymentSchema } = require('../../../validationSchemas/creditCardSchemas');
const { updateSchema: taxUpdate } = require('../../../validationSchemas/taxSchemas');
const { createSchema: insCreate } = require('../../../validationSchemas/insuranceSchemas');

describe('Additional Validation Schemas (Unit Tests)', () => {
  describe('Certificate & Currency Schemas', () => {
    it('should validate certificate payload', () => {
      const valid = {
        name: 'Platinum 3Y Certificate',
        period: 36,
        amount: 100000,
        interest: 21.5,
        startDate: '2026-01-01',
      };
      expect(certCreate.safeParse(valid).success).toBe(true);
    });

    it('should coerce string numbers in certificate payload', () => {
      const valid = {
        name: 'Platinum 3Y Certificate',
        period: '36',
        amount: '100000',
        interest: '21.5',
        startDate: '2026-01-01',
      };
      const result = certCreate.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(100000);
      expect(result.data.interest).toBe(21.5);
    });

    it('should validate currency payload', () => {
      const valid = {
        name: 'USD',
        amount: 1000,
        price: 48.5,
        date: '2026-08-22',
      };
      expect(currCreate.safeParse(valid).success).toBe(true);
    });

    it('should coerce string numbers in currency payload', () => {
      const valid = {
        name: 'USD',
        amount: '1000',
        price: '48.5',
        date: '2026-08-22',
      };
      const result = currCreate.safeParse(valid);
      expect(result.success).toBe(true);
      expect(result.data.amount).toBe(1000);
      expect(result.data.price).toBe(48.5);
    });
  });

  describe('Credit Card Schemas', () => {
    it('should validate card creation', () => {
      const valid = {
        name: 'Platinum Card',
        bank: 'CIB',
        limit: 150000,
        billingCycleDay: 25,
      };
      expect(createCardSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject invalid billing cycle day', () => {
      const invalid = {
        name: 'Platinum Card',
        bank: 'CIB',
        limit: 150000,
        billingCycleDay: 35, // Out of bounds
      };
      expect(createCardSchema.safeParse(invalid).success).toBe(false);
    });

    it('should validate transaction creation', () => {
      const valid = {
        card: '507f1f77bcf86cd799439011',
        description: 'Electronics Store',
        amount: 12000,
        date: '2026-08-22',
        type: 'Installment',
        installmentDetails: {
          months: 12,
          monthlyPrincipal: 1000,
        },
      };
      expect(createTransactionSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('Taxes & Insurance Schemas', () => {
    it('should validate tax brackets and enforce to > from', () => {
      const valid = {
        brackets: [
          { level: 1, from: 0, to: 30000, rate: 0 },
          { level: 2, from: 30000, to: 60000, rate: 0.1 },
        ],
      };
      expect(taxUpdate.safeParse(valid).success).toBe(true);

      const invalid = {
        brackets: [{ level: 1, from: 50000, to: 30000, rate: 0.1 }], // to < from
      };
      expect(taxUpdate.safeParse(invalid).success).toBe(false);
    });

    it('should validate social insurance record', () => {
      const valid = { year: 2026, registeredIncome: 14000 };
      expect(insCreate.safeParse(valid).success).toBe(true);
    });
  });
});
