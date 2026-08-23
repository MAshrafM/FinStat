const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema, dateStringSchema, sanitizeQueryParam } = require('./commonSchemas');

const ALLOWED_MF_TYPES = ['Buy', 'Sell', 'Coupon'];

const createSchema = z.object({
  date: dateStringSchema,
  name: z
    .string({ message: 'Fund name is required' })
    .trim()
    .min(1, 'Fund name cannot be empty'),
  code: z
    .string({ message: 'Fund code is required' })
    .trim()
    .min(1, 'Fund code cannot be empty'),
  type: z.enum(ALLOWED_MF_TYPES, {
    message: `Type must be one of: ${ALLOWED_MF_TYPES.join(', ')}`,
  }),
  units: z.coerce.number({ message: 'Units must be a valid number' }).default(0),
  price: z.coerce.number({ message: 'Price must be a valid number' }).default(0),
  fees: z.coerce.number({ message: 'Fees must be a valid number' }).default(0),
  totalValue: z.coerce.number({
    message: 'Total value is required and must be a valid number',
  }),
}).strict();

const updateSchema = z.object({
  date: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  name: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string({ message: 'Fund name must be a string' }).trim().min(1, 'Fund name cannot be empty').optional()
  ),
  code: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string({ message: 'Fund code must be a string' }).trim().min(1, 'Fund code cannot be empty').optional()
  ),
  type: z.enum(ALLOWED_MF_TYPES, {
    message: `Type must be one of: ${ALLOWED_MF_TYPES.join(', ')}`,
  }).optional(),
  units: z.coerce.number({ message: 'Units must be a valid number' }).optional(),
  price: z.coerce.number({ message: 'Price must be a valid number' }).optional(),
  fees: z.coerce.number({ message: 'Fees must be a valid number' }).optional(),
  totalValue: z.coerce.number({ message: 'Total value must be a valid number' }).optional(),
}).strict();

const paramsSchema = paramsIdSchema;

const querySchema = paginationQuerySchema.extend({
  type: sanitizeQueryParam(z.string({ message: 'Type filter must be a string' }).trim().optional()),
});

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
};

