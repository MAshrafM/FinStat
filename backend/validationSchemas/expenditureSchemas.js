const { z } = require('zod');
const {
  mongoIdSchema,
  paramsIdSchema,
  dateStringSchema,
  paginationQuerySchema,
  sanitizeQueryParam,
  optionalString,
} = require('./commonSchemas');

const ALLOWED_TRANSACTION_TYPES = ['W', 'T', 'S', 'na'];
const ALLOWED_PAYMENT_METHODS = ['Bank', 'Cash', 'Prepaid', 'Credit Card'];

const splitItemSchema = z
  .object({
    category: z
      .string({ message: 'Split category must be a string' })
      .trim()
      .min(1, 'Category cannot be empty'),
    amount: z
      .number({ message: 'Split amount must be a number' })
      .positive('Split amount must be greater than 0'),
    description: optionalString('Split description'),
  })
  .strict();

/**
 * Schema for creating a new Expenditure log.
 * Enforces strict typing, rejects unknown properties, and trims strings.
 */
const createSchema = z.preprocess(
  (val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const rawCurr = typeof val.currency === 'string' ? val.currency.trim().toUpperCase() : 'EGP';
      // If foreign transaction and transactionValue not explicitly supplied, synthesize placeholder so superRefine can validate foreignAmount
      if (rawCurr !== 'EGP' && val.transactionValue === undefined) {
        return { ...val, transactionValue: 1 };
      }
    }
    return val;
  },
  z
    .object({
      date: dateStringSchema,
      bank: z.number({ message: 'Bank balance must be a valid number' }).default(0),
      cash: z.number({ message: 'Cash balance must be a valid number' }).default(0),
      prepaid: z.number({ message: 'Prepaid balance must be a valid number' }).default(0),
      transactionValue: z
        .number({
          message: 'Transaction value is required and must be a valid number',
        })
        .positive('Transaction value must be greater than 0'),
      currency: z.string().trim().toUpperCase().default('EGP'),
    foreignAmount: z
      .number({ message: 'foreignAmount must be a valid number' })
      .positive('foreignAmount must be greater than 0')
      .nullish(),
    exchangeRateSnapshot: z
      .number({ message: 'exchangeRateSnapshot must be a valid number' })
      .positive('exchangeRateSnapshot must be greater than 0')
      .nullish(),
    transactionType: z.enum(ALLOWED_TRANSACTION_TYPES, {
      message: `Transaction type must be one of: ${ALLOWED_TRANSACTION_TYPES.join(', ')}`,
    }),
    paymentMethod: z
      .enum(ALLOWED_PAYMENT_METHODS, {
        message: `Payment method must be one of: ${ALLOWED_PAYMENT_METHODS.join(', ')}`,
      })
      .default('Bank'),
    logBankOp: z.enum(['+', '-', 'none']).nullish(),
    logCashOp: z.enum(['+', '-', 'none']).nullish(),
    logPrepaidOp: z.enum(['+', '-', 'none']).nullish(),
    fromAccount: z.string().trim().nullish(),
    toAccount: z.string().trim().nullish(),
    categories: z
      .array(
        z
          .string({ message: 'Category must be a string' })
          .trim()
          .min(1, 'Category cannot be empty')
      )
      .min(1, 'At least one category is required')
      .default(['Other']),
    description: optionalString('Description'),
    isRecurring: z.boolean().optional(),
    recurringId: mongoIdSchema.nullish(),
    splits: z.array(splitItemSchema).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const isBase = !data.currency || data.currency === 'EGP';
    if (isBase) {
      if (data.transactionValue === undefined || data.transactionValue === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['transactionValue'],
          message: 'Transaction value is required for base currency (EGP) transactions',
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

    if (data.splits && data.splits.length > 0 && data.transactionValue !== undefined) {
      const sum = data.splits.reduce((acc, curr) => acc + curr.amount, 0);
      if (Math.abs(sum - data.transactionValue) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['splits'],
          message: `Sum of split amounts (${sum.toFixed(2)}) must equal transaction value (${data.transactionValue.toFixed(2)})`,
        });
      }
    }
  })
);

/**
 * Schema for updating an existing Expenditure log.
 * All fields are optional, internal fields are omitted, and typos are rejected with strict().
 */
const updateSchema = z
  .object({
    date: dateStringSchema.optional(),
    bank: z.number({ message: 'Bank balance must be a valid number' }).optional(),
    cash: z.number({ message: 'Cash balance must be a valid number' }).optional(),
    prepaid: z.number({ message: 'Prepaid balance must be a valid number' }).optional(),
    transactionValue: z
      .number({ message: 'Transaction value must be a valid number' })
      .positive('Transaction value must be greater than 0')
      .optional(),
    currency: z.string().trim().toUpperCase().optional(),
    foreignAmount: z
      .number({ message: 'foreignAmount must be a valid number' })
      .positive('foreignAmount must be greater than 0')
      .nullish(),
    exchangeRateSnapshot: z
      .number({ message: 'exchangeRateSnapshot must be a valid number' })
      .positive('exchangeRateSnapshot must be greater than 0')
      .nullish(),
    transactionType: z
      .enum(ALLOWED_TRANSACTION_TYPES, {
        message: `Transaction type must be one of: ${ALLOWED_TRANSACTION_TYPES.join(', ')}`,
      })
      .optional(),
    paymentMethod: z
      .enum(ALLOWED_PAYMENT_METHODS, {
        message: `Payment method must be one of: ${ALLOWED_PAYMENT_METHODS.join(', ')}`,
      })
      .optional(),
    logBankOp: z.enum(['+', '-', 'none']).nullish(),
    logCashOp: z.enum(['+', '-', 'none']).nullish(),
    logPrepaidOp: z.enum(['+', '-', 'none']).nullish(),
    fromAccount: z.string().trim().nullish(),
    toAccount: z.string().trim().nullish(),
    categories: z
      .array(
        z
          .string({ message: 'Category must be a string' })
          .trim()
          .min(1, 'Category cannot be empty')
      )
      .min(1, 'At least one category is required')
      .optional(),
    description: optionalString('Description'),
    isRecurring: z.boolean().optional(),
    recurringId: mongoIdSchema.nullish(),
    splits: z.array(splitItemSchema).optional(),
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

    if (data.splits && data.splits.length > 0 && data.transactionValue !== undefined) {
      const sum = data.splits.reduce((acc, curr) => acc + curr.amount, 0);
      if (Math.abs(sum - data.transactionValue) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['splits'],
          message: `Sum of split amounts (${sum.toFixed(2)}) must equal transaction value (${data.transactionValue.toFixed(2)})`,
        });
      }
    }
  });

/**
 * Route parameter schema for :id
 */
const paramsSchema = paramsIdSchema;

/**
 * Query schema for expenditure list & filters
 */
const querySchema = paginationQuerySchema.extend({
  type: sanitizeQueryParam(z.string({ message: 'Type filter must be a string' }).trim().optional()),
  isRecurring: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
});

/**
 * Bulk category reassignment schema [GAP-008]
 * Maximum 100 items per request for $O(1)$ batch update.
 */
const bulkCategorySchema = z
  .object({
    ids: z
      .array(mongoIdSchema, { message: 'ids must be an array of valid IDs' })
      .min(1, 'At least one ID is required')
      .max(100, 'Cannot update more than 100 items at once'),
    category: z
      .string({ message: 'Category must be a string' })
      .trim()
      .min(1, 'Category cannot be empty')
      .max(100, 'Category cannot exceed 100 characters'),
  })
  .strict();

/**
 * Bulk delete schema [GAP-008]
 * Maximum 50 items per request to guarantee ACID transaction completion.
 */
const bulkDeleteSchema = z
  .object({
    ids: z
      .array(mongoIdSchema, { message: 'ids must be an array of valid IDs' })
      .min(1, 'At least one ID is required')
      .max(50, 'Cannot delete more than 50 items at once'),
  })
  .strict();

/**
 * Recurring Bill Schemas [FEAT-005, GAP-009]
 */
const ALLOWED_BILL_FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'];
const ALLOWED_BILL_PAYMENT_METHODS = ['Bank', 'Cash', 'Prepaid'];

const createRecurringBillSchema = z
  .object({
    name: z
      .string({ message: 'Bill name is required' })
      .trim()
      .min(1, 'Bill name cannot be empty')
      .max(100, 'Bill name cannot exceed 100 characters'),
    category: z
      .string({ message: 'Category is required' })
      .trim()
      .min(1, 'Category cannot be empty')
      .max(100, 'Category cannot exceed 100 characters'),
    amount: z
      .number({ message: 'Amount is required and must be a number' })
      .positive('Amount must be greater than 0'),
    frequency: z.enum(ALLOWED_BILL_FREQUENCIES, {
      message: 'Frequency must be weekly, monthly, quarterly, or yearly',
    }).default('monthly'),
    dueDay: z
      .number({ message: 'dueDay must be a number' })
      .int('dueDay must be an integer')
      .min(1, 'dueDay must be at least 1')
      .max(31, 'dueDay cannot exceed 31'),
    nextDueDate: dateStringSchema,
    paymentMethod: z.enum(ALLOWED_BILL_PAYMENT_METHODS, {
      message: 'Payment method must be Bank, Cash, or Prepaid',
    }).default('Bank'),
    reminderDaysBefore: z
      .number()
      .int()
      .min(1)
      .max(30)
      .default(3)
      .optional(),
    isActive: z.boolean().default(true).optional(),
    notes: optionalString('Notes'),
  })
  .strict();

const updateRecurringBillSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    amount: z.number().positive().optional(),
    frequency: z.enum(ALLOWED_BILL_FREQUENCIES).optional(),
    dueDay: z.number().int().min(1).max(31).optional(),
    nextDueDate: dateStringSchema.optional(),
    paymentMethod: z.enum(ALLOWED_BILL_PAYMENT_METHODS).optional(),
    reminderDaysBefore: z.number().int().min(1).max(30).optional(),
    isActive: z.boolean().optional(),
    notes: optionalString('Notes'),
  })
  .strict();

const payRecurringBillSchema = z
  .object({
    paymentDate: dateStringSchema.optional(),
    paymentMethod: z.enum(ALLOWED_BILL_PAYMENT_METHODS).optional(),
  })
  .strict()
  .optional()
  .default({});

const queryUpcomingBillsSchema = z
  .object({
    days: z.coerce.number().int().min(1).max(60).default(3).optional(),
  })
  .strip();

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
  splitItemSchema,
  bulkCategorySchema,
  bulkDeleteSchema,
  createRecurringBillSchema,
  updateRecurringBillSchema,
  payRecurringBillSchema,
  queryUpcomingBillsSchema,
};
