const { z } = require('zod');
const { paramsIdSchema, dateStringSchema, optionalString } = require('./commonSchemas');

const createSchema = z.object({
  name: z.string({ message: 'Certificate name is required' }).trim().min(1, 'Certificate name cannot be empty'),
  period: z.coerce.number({ message: 'Period in months is required and must be a valid number' }).positive('Period must be positive'),
  amount: z.coerce.number({ message: 'Amount is required and must be a valid number' }).positive('Amount must be positive'),
  interest: z.coerce.number({ message: 'Interest rate is required and must be a valid number' }).min(0, 'Interest cannot be negative'),
  startDate: dateStringSchema,
}).strict();

const updateSchema = z.object({
  name: optionalString('Certificate name'),
  period: z.coerce.number({ message: 'Period must be a valid number' }).positive('Period must be positive').optional(),
  amount: z.coerce.number({ message: 'Amount must be a valid number' }).positive('Amount must be positive').optional(),
  interest: z.coerce.number({ message: 'Interest must be a valid number' }).min(0, 'Interest cannot be negative').optional(),
  startDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
}).strict();

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema: paramsIdSchema,
  querySchema: undefined,
};

