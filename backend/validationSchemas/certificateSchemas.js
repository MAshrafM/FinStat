const { z } = require('zod');
const { paramsIdSchema, dateStringSchema } = require('./commonSchemas');

const createSchema = z.object({
  name: z.string({ message: 'Certificate name is required' }).trim().min(1, 'Certificate name cannot be empty'),
  period: z.number({ message: 'Period in months is required and must be a valid number' }).positive('Period must be positive'),
  amount: z.number({ message: 'Amount is required and must be a valid number' }).positive('Amount must be positive'),
  interest: z.number({ message: 'Interest rate is required and must be a valid number' }).min(0, 'Interest cannot be negative'),
  startDate: dateStringSchema,
}).strict();

const updateSchema = z.object({
  name: z.string({ message: 'Certificate name must be a string' }).trim().min(1, 'Certificate name cannot be empty').optional(),
  period: z.number({ message: 'Period must be a valid number' }).positive('Period must be positive').optional(),
  amount: z.number({ message: 'Amount must be a valid number' }).positive('Amount must be positive').optional(),
  interest: z.number({ message: 'Interest must be a valid number' }).min(0, 'Interest cannot be negative').optional(),
  startDate: dateStringSchema.optional(),
}).strict();

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema: paramsIdSchema,
  querySchema: undefined,
};
