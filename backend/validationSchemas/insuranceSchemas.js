const { z } = require('zod');

const createSchema = z.object({
  year: z
    .number({ message: 'Year is required and must be an integer' })
    .int('Year must be an integer')
    .min(1900, 'Year must be after 1900')
    .max(2100, 'Year must be before 2100'),
  registeredIncome: z
    .number({ message: 'Registered income is required and must be a valid number' })
    .min(0, 'Registered income cannot be negative'),
}).strict();

module.exports = {
  createSchema,
  updateSchema: createSchema,
  paramsSchema: undefined,
  querySchema: undefined,
};
