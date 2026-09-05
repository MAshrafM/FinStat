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
const ALLOWED_PAYMENT_METHODS = ['Bank', 'Cash', 'Prepaid'];

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
const createSchema = z
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
    if (data.splits && data.splits.length > 0) {
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

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
  splitItemSchema,
};
