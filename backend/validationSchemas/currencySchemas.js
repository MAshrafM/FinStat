const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema, dateStringSchema } = require('./commonSchemas');

const createSchema = z.object({
  name: z.string({ message: 'Currency name is required' }).trim().min(1, 'Currency name cannot be empty'),
  amount: z.number({ message: 'Amount is required and must be a valid number' }).positive('Amount must be positive'),
  price: z.number({ message: 'Price is required and must be a valid number' }).positive('Price must be positive'),
  date: dateStringSchema,
}).strict();

const updateSchema = z.object({
  name: z.string({ message: 'Currency name must be a string' }).trim().min(1, 'Currency name cannot be empty').optional(),
  amount: z.number({ message: 'Amount must be a valid number' }).positive('Amount must be positive').optional(),
  price: z.number({ message: 'Price must be a valid number' }).positive('Price must be positive').optional(),
  date: dateStringSchema.optional(),
}).strict();

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema: paramsIdSchema,
  querySchema: paginationQuerySchema,
};
