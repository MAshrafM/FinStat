const { z } = require('zod');
const { mongoIdSchema, paramsIdSchema, dateStringSchema, optionalString } = require('./commonSchemas');

const ALLOWED_TX_TYPES = ['Purchase', 'Installment'];
const ALLOWED_TX_STATUS = ['Due', 'Paid', 'Partial'];
const ALLOWED_PAYMENT_SOURCES = ['Bank', 'Cash', 'Prepaid'];

const createCardSchema = z.object({
  name: z.string({ message: 'Card name is required' }).trim().min(1, 'Card name cannot be empty'),
  bank: z.string({ message: 'Bank is required' }).trim().min(1, 'Bank cannot be empty'),
  limit: z.number({ message: 'Limit is required and must be a valid number' }).positive('Limit must be positive'),
  billingCycleDay: z
    .number({ message: 'Billing cycle day is required' })
    .int('Billing cycle day must be an integer')
    .min(1, 'Billing cycle day must be between 1 and 31')
    .max(31, 'Billing cycle day must be between 1 and 31'),
  statementCloseDay: z.number().int().min(1).max(31).optional(),
  paymentDueDay: z.number().int().min(1).max(31).optional(),
  utilizationAlertThreshold: z.number().min(0).max(100).optional(),
  minimumPaymentPercent: z.number().min(0).max(100).optional(),
  apr: z.number().min(0).optional(),
}).strict();

const updateCardSchema = z.object({
  name: optionalString('Card name'),
  bank: optionalString('Bank'),
  limit: z.number({ message: 'Limit must be a valid number' }).positive('Limit must be positive').optional(),
  billingCycleDay: z
    .number({ message: 'Billing cycle day must be a number' })
    .int('Billing cycle day must be an integer')
    .min(1, 'Billing cycle day must be between 1 and 31')
    .max(31, 'Billing cycle day must be between 1 and 31')
    .optional(),
  statementCloseDay: z.number().int().min(1).max(31).optional(),
  paymentDueDay: z.number().int().min(1).max(31).optional(),
  utilizationAlertThreshold: z.number().min(0).max(100).optional(),
  minimumPaymentPercent: z.number().min(0).max(100).optional(),
  apr: z.number().min(0).optional(),
}).strict();

const createTransactionSchema = z
  .object({
    card: mongoIdSchema,
    description: z.string({ message: 'Description is required' }).trim().min(1, 'Description cannot be empty'),
    category: z.string().trim().optional(),
    amount: z.number({ message: 'Amount must be a valid number' }).positive('Amount must be positive').optional(),
    currency: z.string().trim().toUpperCase().default('EGP'),
    foreignAmount: z
      .number({ message: 'foreignAmount must be a valid number' })
      .positive('foreignAmount must be greater than 0')
      .nullish(),
    exchangeRateSnapshot: z
      .number({ message: 'exchangeRateSnapshot must be a valid number' })
      .positive('exchangeRateSnapshot must be greater than 0')
      .nullish(),
    date: dateStringSchema,
    type: z.enum(ALLOWED_TX_TYPES, {
      message: `Type must be one of: ${ALLOWED_TX_TYPES.join(', ')}`,
    }),
    createExpenditure: z.boolean().optional(),
    installmentDetails: z
      .object({
        months: z.number({ message: 'Months must be an integer' }).int().positive().optional(),
        monthlyPrincipal: z.number({ message: 'Monthly principal must be a number' }).positive().optional(),
        interest: z.number({ message: 'Interest must be a number' }).min(0).default(0),
      })
      .strict()
      .optional(),
    status: z.enum(ALLOWED_TX_STATUS).optional(),
    paidAmount: z.number().min(0).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const isBase = !data.currency || data.currency === 'EGP';
    if (isBase) {
      if (data.amount === undefined || data.amount === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount'],
          message: 'Amount is required for base currency (EGP) transactions',
        });
      }
      if (data.foreignAmount !== undefined && data.foreignAmount !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['foreignAmount'],
          message: 'foreignAmount cannot be specified for base currency (EGP) transactions',
        });
      }
    } else {
      if (data.foreignAmount === undefined || data.foreignAmount === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['foreignAmount'],
          message: `foreignAmount is required for ${data.currency} transactions`,
        });
      }
    }
  });

const updateTransactionSchema = z
  .object({
    description: optionalString('Description'),
    category: optionalString('Category'),
    amount: z.number({ message: 'Amount must be a valid number' }).positive('Amount must be positive').optional(),
    currency: z.string().trim().toUpperCase().optional(),
    foreignAmount: z
      .number({ message: 'foreignAmount must be a valid number' })
      .positive('foreignAmount must be greater than 0')
      .nullish(),
    exchangeRateSnapshot: z
      .number({ message: 'exchangeRateSnapshot must be a valid number' })
      .positive('exchangeRateSnapshot must be greater than 0')
      .nullish(),
    date: dateStringSchema.optional(),
    type: z.enum(ALLOWED_TX_TYPES).optional(),
    createExpenditure: z.boolean().optional(),
    installmentDetails: z
      .object({
        months: z.number().int().positive().optional(),
        monthlyPrincipal: z.number().positive().optional(),
        interest: z.number().min(0).optional(),
      })
      .strict()
      .optional(),
    status: z.enum(ALLOWED_TX_STATUS).optional(),
    paidAmount: z.number().min(0).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.currency === 'EGP' && data.foreignAmount !== undefined && data.foreignAmount !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['foreignAmount'],
        message: 'foreignAmount cannot be specified for base currency (EGP) transactions',
      });
    }
    if (data.currency && data.currency !== 'EGP' && data.foreignAmount === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['foreignAmount'],
        message: `foreignAmount cannot be null for ${data.currency} transactions`,
      });
    }
  });

const createPaymentSchema = z.object({
  card: mongoIdSchema,
  amount: z.number({ message: 'Amount is required and must be a valid number' }).positive('Amount must be positive'),
  date: dateStringSchema,
  paymentSource: z.enum(ALLOWED_PAYMENT_SOURCES).optional(),
  createExpenditure: z.boolean().optional(),
}).strict();

const updatePaymentSchema = z.object({
  amount: z.number({ message: 'Amount must be a valid number' }).positive('Amount must be positive').optional(),
  date: dateStringSchema.optional(),
  paymentSource: z.enum(ALLOWED_PAYMENT_SOURCES).optional(),
  createExpenditure: z.boolean().optional(),
}).strict();

const payInFullSchema = z.object({
  transactionId: mongoIdSchema,
  paymentSource: z.enum(ALLOWED_PAYMENT_SOURCES).optional(),
  createExpenditure: z.boolean().optional(),
}).strict();

const partialPaymentSchema = z.object({
  transactionId: mongoIdSchema,
  amount: z.number().positive('Payment amount must be positive'),
  paymentSource: z.enum(ALLOWED_PAYMENT_SOURCES).optional(),
  createExpenditure: z.boolean().optional(),
}).strict();

const cardIdParamsSchema = z.object({
  cardId: mongoIdSchema,
}).strict();

const reconcileSchema = z.object({
  cycleStart: dateStringSchema,
  cycleEnd: dateStringSchema,
  actualStatementBalance: z.number({ message: 'Actual statement balance is required' }),
}).strict();

module.exports = {
  createCardSchema,
  updateCardSchema,
  createTransactionSchema,
  updateTransactionSchema,
  createPaymentSchema,
  updatePaymentSchema,
  payInFullSchema,
  partialPaymentSchema,
  cardIdParamsSchema,
  reconcileSchema,
  paramsSchema: paramsIdSchema,
  querySchema: undefined,
  createSchema: createCardSchema,
  updateSchema: updateCardSchema,
};
