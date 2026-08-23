const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema, dateStringSchema, sanitizeQueryParam } = require('./commonSchemas');

const ALLOWED_BROKERS = ['Thndr', 'EFG', 'Telda'];
const ALLOWED_TRADE_TYPES = ['Buy', 'Sell', 'TopUp', 'Dividend', 'Withdraw'];
const STOCK_CODE_REQUIRED_TYPES = ['Buy', 'Sell', 'Dividend'];

/**
 * Trade creation schema with cross-field refinement ensuring stockCode exists for equity trades.
 */
const createSchema = z.object({
  date: dateStringSchema,
  broker: z.enum(ALLOWED_BROKERS, {
    message: `Broker must be one of: ${ALLOWED_BROKERS.join(', ')}`,
  }),
  stockCode: z
    .string({ message: 'Stock code must be a string' })
    .trim()
    .min(1, 'Stock code cannot be empty')
    .optional(),
  type: z.enum(ALLOWED_TRADE_TYPES, {
    message: `Type must be one of: ${ALLOWED_TRADE_TYPES.join(', ')}`,
  }),
  price: z.coerce.number({ message: 'Price must be a valid number' }).default(0),
  shares: z.coerce.number({ message: 'Shares must be a valid number' }).default(0),
  fees: z.coerce.number({ message: 'Fees must be a valid number' }).default(0),
  totalValue: z.coerce.number({
    message: 'Total value is required and must be a valid number',
  }),
  iteration: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number({ message: 'Iteration must be an integer' }).int().optional()
  ),
})
  .strict()
  .refine(
    (data) => {
      if (STOCK_CODE_REQUIRED_TYPES.includes(data.type)) {
        return Boolean(data.stockCode && data.stockCode.length > 0);
      }
      return true;
    },
    {
      message: 'Stock code is required for Buy, Sell, and Dividend transactions',
      path: ['stockCode'],
    }
  );

/**
 * Trade update schema
 */
const updateSchema = z.object({
  date: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  broker: z.enum(ALLOWED_BROKERS, {
    message: `Broker must be one of: ${ALLOWED_BROKERS.join(', ')}`,
  }).optional(),
  stockCode: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string({ message: 'Stock code must be a string' }).trim().min(1, 'Stock code cannot be empty').optional()
  ),
  type: z.enum(ALLOWED_TRADE_TYPES, {
    message: `Type must be one of: ${ALLOWED_TRADE_TYPES.join(', ')}`,
  }).optional(),
  price: z.coerce.number({ message: 'Price must be a valid number' }).optional(),
  shares: z.coerce.number({ message: 'Shares must be a valid number' }).optional(),
  fees: z.coerce.number({ message: 'Fees must be a valid number' }).optional(),
  totalValue: z.coerce.number({ message: 'Total value must be a valid number' }).optional(),
  iteration: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number({ message: 'Iteration must be an integer' }).int().optional()
  ),
}).strict();

const paramsSchema = paramsIdSchema;

const querySchema = paginationQuerySchema.extend({
  broker: sanitizeQueryParam(z.string({ message: 'Broker filter must be a string' }).trim().optional()),
  search: sanitizeQueryParam(z.string({ message: 'Search filter must be a string' }).trim().optional()),
});

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
};

