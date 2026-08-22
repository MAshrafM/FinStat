const { z } = require('zod');
const { paramsIdSchema, dateStringSchema, paginationQuerySchema, sanitizeQueryParam, optionalString } = require('./commonSchemas');

const ALLOWED_TRANSACTION_TYPES = ['W', 'T', 'S', 'na'];
const ALLOWED_PAYMENT_METHODS = ['Bank', 'Cash', 'Prepaid'];

/**
 * Schema for creating a new Expenditure log.
 * Enforces strict typing, rejects unknown properties, and trims strings.
 */
const createSchema = z.object({
  date: dateStringSchema,
  bank: z.number({ message: 'Bank balance must be a valid number' }).default(0),
  cash: z.number({ message: 'Cash balance must be a valid number' }).default(0),
  prepaid: z.number({ message: 'Prepaid balance must be a valid number' }).default(0),
  transactionValue: z.number({
    message: 'Transaction value is required and must be a valid number',
  }),
  transactionType: z.enum(ALLOWED_TRANSACTION_TYPES, {
    message: `Transaction type must be one of: ${ALLOWED_TRANSACTION_TYPES.join(', ')}`,
  }),
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS, {
    message: `Payment method must be one of: ${ALLOWED_PAYMENT_METHODS.join(', ')}`,
  }).default('Bank'),
  categories: z
    .array(
      z.string({ message: 'Category must be a string' })
        .trim()
        .min(1, 'Category cannot be empty')
    )
    .min(1, 'At least one category is required')
    .default(['Other']),
  description: optionalString('Description'),
}).strict();

/**
 * Schema for updating an existing Expenditure log.
 * All fields are optional, internal fields are omitted, and typos are rejected with strict().
 */
const updateSchema = z.object({
  date: dateStringSchema.optional(),
  bank: z.number({ message: 'Bank balance must be a valid number' }).optional(),
  cash: z.number({ message: 'Cash balance must be a valid number' }).optional(),
  prepaid: z.number({ message: 'Prepaid balance must be a valid number' }).optional(),
  transactionValue: z.number({ message: 'Transaction value must be a valid number' }).optional(),
  transactionType: z.enum(ALLOWED_TRANSACTION_TYPES, {
    message: `Transaction type must be one of: ${ALLOWED_TRANSACTION_TYPES.join(', ')}`,
  }).optional(),
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS, {
    message: `Payment method must be one of: ${ALLOWED_PAYMENT_METHODS.join(', ')}`,
  }).optional(),
  categories: z
    .array(
      z.string({ message: 'Category must be a string' })
        .trim()
        .min(1, 'Category cannot be empty')
    )
    .min(1, 'At least one category is required')
    .optional(),
  description: optionalString('Description'),
}).strict();

/**
 * Route parameter schema for :id
 */
const paramsSchema = paramsIdSchema;

/**
 * Query schema for expenditure list & filters
 */
const querySchema = paginationQuerySchema.extend({
  type: sanitizeQueryParam(z.string({ message: 'Type filter must be a string' }).trim().optional()),
});

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
};
