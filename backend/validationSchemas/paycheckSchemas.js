const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema, dateStringSchema, sanitizeQueryParam } = require('./commonSchemas');

const ALLOWED_PAYCHECK_TYPES = ['Cash', 'Prepaid'];
const MONTH_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Schema for creating a Paycheck log
 */
const createSchema = z.object({
  month: z
    .string({ message: 'Month is required' })
    .trim()
    .regex(MONTH_FORMAT_REGEX, 'Month must be in YYYY-MM format (e.g., 2024-07)'),
  type: z.enum(ALLOWED_PAYCHECK_TYPES, {
    message: `Type must be one of: ${ALLOWED_PAYCHECK_TYPES.join(', ')}`,
  }),
  amount: z.number({
    message: 'Amount is required and must be a valid number',
  }),
  note: z
    .string({ message: 'Note must be a string' })
    .trim()
    .min(1, 'Note cannot be empty')
    .optional(),
  insuranceDeduction: z.number({ message: 'Insurance deduction must be a valid number' }).default(0),
  grossAmount: z.number({ message: 'Gross amount must be a valid number' }).default(0),
  taxDeduction: z.number({ message: 'Tax deduction must be a valid number' }).default(0),
  date: dateStringSchema.optional(),
}).strict();

/**
 * Schema for updating a Paycheck log
 */
const updateSchema = z.object({
  month: z
    .string({ message: 'Month must be a string' })
    .trim()
    .regex(MONTH_FORMAT_REGEX, 'Month must be in YYYY-MM format (e.g., 2024-07)')
    .optional(),
  type: z.enum(ALLOWED_PAYCHECK_TYPES, {
    message: `Type must be one of: ${ALLOWED_PAYCHECK_TYPES.join(', ')}`,
  }).optional(),
  amount: z.number({ message: 'Amount must be a valid number' }).optional(),
  note: z
    .string({ message: 'Note must be a string' })
    .trim()
    .min(1, 'Note cannot be empty')
    .optional(),
  insuranceDeduction: z.number({ message: 'Insurance deduction must be a valid number' }).optional(),
  grossAmount: z.number({ message: 'Gross amount must be a valid number' }).optional(),
  taxDeduction: z.number({ message: 'Tax deduction must be a valid number' }).optional(),
  date: dateStringSchema.optional(),
}).strict();

const paramsSchema = paramsIdSchema;

const querySchema = paginationQuerySchema.extend({
  year: sanitizeQueryParam(
    z
      .coerce
      .number({ message: 'Year must be a number' })
      .int('Year must be an integer')
      .min(1900, 'Year must be after 1900')
      .max(2100, 'Year must be before 2100')
      .optional()
  ),
});

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
};

