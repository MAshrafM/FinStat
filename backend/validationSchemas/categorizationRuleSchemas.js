// backend/validationSchemas/categorizationRuleSchemas.js
const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema, optionalString } = require('./commonSchemas');

const ALLOWED_FIELDS = ['description', 'paymentMethod', 'merchant'];
const ALLOWED_OPERATORS = ['contains', 'equals', 'startsWith', 'endsWith', 'regex'];

const createRuleSchema = z
  .object({
    name: z.string({ message: 'Rule name is required' }).trim().min(1, 'Rule name cannot be empty'),
    field: z.enum(ALLOWED_FIELDS, {
      message: `Field must be one of: ${ALLOWED_FIELDS.join(', ')}`,
    }).default('description'),
    operator: z.enum(ALLOWED_OPERATORS, {
      message: `Operator must be one of: ${ALLOWED_OPERATORS.join(', ')}`,
    }),
    value: z.string({ message: 'Matching value is required' }).trim().min(1, 'Value cannot be empty'),
    category: z.string({ message: 'Category is required' }).trim().min(1, 'Category cannot be empty'),
    priority: z.coerce.number({ message: 'Priority must be a number' }).int().default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

const updateRuleSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    field: z.enum(ALLOWED_FIELDS).optional(),
    operator: z.enum(ALLOWED_OPERATORS).optional(),
    value: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    priority: z.coerce.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

const testRuleSchema = z
  .object({
    operator: z.enum(ALLOWED_OPERATORS, {
      message: `Operator must be one of: ${ALLOWED_OPERATORS.join(', ')}`,
    }),
    value: z.string({ message: 'Matching value is required' }).trim().min(1, 'Value cannot be empty'),
    category: z.string({ message: 'Category is required' }).trim().min(1, 'Category cannot be empty'),
    sampleText: z.string().default(''),
  })
  .strict();

const queryRuleSchema = paginationQuerySchema.extend({
  isActive: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
});

module.exports = {
  createRuleSchema,
  updateRuleSchema,
  testRuleSchema,
  paramsSchema: paramsIdSchema,
  queryRuleSchema,
};
