const { z } = require('zod');

const bracketLevelSchema = z.object({
  level: z.number({ message: 'Level is required and must be a valid number' }),
  from: z.number({ message: 'From bound must be a non-negative number' }).min(0),
  to: z.number({ message: 'To bound must be a positive number' }).positive(),
  rate: z.number({ message: 'Tax rate must be a valid decimal number between 0 and 1' }).min(0).max(1),
})
  .strict()
  .refine((data) => data.to > data.from, {
    message: 'To amount must be greater than from amount',
    path: ['to'],
  });

const updateSchema = z.object({
  brackets: z
    .array(bracketLevelSchema, { message: 'Brackets must be an array of bracket levels' })
    .min(1, 'At least one tax bracket level is required'),
}).strict();

const simulateSalarySchema = z.object({
  grossSalary: z.number({ required_error: 'Gross salary is required' }).positive('Gross salary must be greater than zero'),
  year: z.number().int().optional(),
  customPersonalExemption: z.number().min(0).max(1000000).optional(),
  includeInsurance: z.boolean().optional(),
  includeMartyrsFund: z.boolean().optional(),
}).strict();

module.exports = {
  createSchema: updateSchema,
  updateSchema,
  simulateSalarySchema,
  paramsSchema: undefined,
  querySchema: undefined,
};
