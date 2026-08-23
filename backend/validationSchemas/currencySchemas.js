const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema, dateStringSchema, optionalString } = require('./commonSchemas');

const createSchema = z.object({
  name: z.string({ message: 'Currency name is required' }).trim().min(1, 'Currency name cannot be empty'),
  amount: z.coerce.number({ message: 'Amount is required and must be a valid number' }).positive('Amount must be positive'),
  price: z.coerce.number({ message: 'Price is required and must be a valid number' }).positive('Price must be positive'),
  date: dateStringSchema,
}).strict();

const updateSchema = z.object({
  name: optionalString('Currency name'),
  amount: z.coerce.number({ message: 'Amount must be a valid number' }).positive('Amount must be positive').optional(),
  price: z.coerce.number({ message: 'Price must be a valid number' }).positive('Price must be positive').optional(),
  date: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
}).strict();

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema: paramsIdSchema,
  querySchema: paginationQuerySchema,
};

