// backend/validationSchemas/corporateActionSchemas.js
const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema, dateStringSchema, sanitizeQueryParam } = require('./commonSchemas');

const ALLOWED_BROKERS = ['Thndr', 'EFG', 'Telda'];
const ALLOWED_TYPES = ['split', 'bonus'];

const createCorporateActionSchema = z.object({
  stockCode: z
    .string({ message: 'Stock code must be a string' })
    .trim()
    .min(1, 'Stock code cannot be empty')
    .toUpperCase(),
  broker: z.enum(ALLOWED_BROKERS, {
    message: `Broker must be one of: ${ALLOWED_BROKERS.join(', ')}`,
  }),
  type: z.enum(ALLOWED_TYPES, {
    message: `Type must be one of: ${ALLOWED_TYPES.join(', ')}`,
  }),
  ratio: z.coerce.number({ message: 'Ratio must be a valid number' }).positive('Ratio must be greater than 0'),
  effectiveDate: dateStringSchema,
  notes: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional()
  ),
  logTrade: z.preprocess(
    (val) => (val === undefined || val === null ? true : val === true || val === 'true'),
    z.boolean().optional().default(true)
  ),
}).strict();

const wizardCorporateActionSchema = createCorporateActionSchema;

const queryCorporateActionSchema = paginationQuerySchema.extend({
  broker: sanitizeQueryParam(z.string().trim().optional()),
  stockCode: sanitizeQueryParam(z.string().trim().toUpperCase().optional()),
  type: sanitizeQueryParam(z.enum(ALLOWED_TYPES).optional()),
});

module.exports = {
  createCorporateActionSchema,
  wizardCorporateActionSchema,
  queryCorporateActionSchema,
  paramsSchema: paramsIdSchema,
};
