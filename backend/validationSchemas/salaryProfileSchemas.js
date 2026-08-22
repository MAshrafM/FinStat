const { z } = require('zod');
const { mongoIdSchema, dateStringSchema } = require('./commonSchemas');

const salaryDetailSchema = z.object({
  effectiveDate: dateStringSchema.optional(),
  basicSalary: z.number({ message: 'Basic salary must be a valid number' }).default(0),
  basicProduction: z.number({ message: 'Basic production must be a valid number' }).default(0),
  prepaid: z.number({ message: 'Prepaid must be a valid number' }).default(0),
  variables: z.number({ message: 'Variables must be a valid number' }).default(0),
  environment: z.number({ message: 'Environment allowance must be a valid number' }).default(0),
  meal: z.number({ message: 'Meal allowance must be a valid number' }).default(0),
  shift: z.number({ message: 'Shift allowance must be a valid number' }).default(0),
  supervising: z.number({ message: 'Supervising allowance must be a valid number' }).default(0),
  others: z.number({ message: 'Others must be a valid number' }).default(0),
  bonds: z.number({ message: 'Bonds must be a valid number' }).default(0),
}).strict();

const createSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(1, 'Name cannot be empty'),
  title: z
    .string({ message: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty'),
  position: z
    .string({ message: 'Position must be a string' })
    .trim()
    .min(1, 'Position cannot be empty')
    .optional(),
  year: z
    .number({ message: 'Year is required and must be an integer' })
    .int('Year must be an integer'),
  salaryDetails: salaryDetailSchema.optional(),
}).strict();

const updateSchema = z.object({
  name: z.string({ message: 'Name must be a string' }).trim().min(1, 'Name cannot be empty').optional(),
  title: z.string({ message: 'Title must be a string' }).trim().min(1, 'Title cannot be empty').optional(),
  position: z.string({ message: 'Position must be a string' }).trim().min(1, 'Position cannot be empty').optional(),
  year: z.number({ message: 'Year must be an integer' }).int().optional(),
}).strict();

const historyParamsSchema = z.object({
  historyId: mongoIdSchema,
}).strict();

const updateHistorySchema = z.object({
  effectiveDate: dateStringSchema.optional(),
  basicSalary: z.number({ message: 'Basic salary must be a valid number' }).optional(),
  basicProduction: z.number({ message: 'Basic production must be a valid number' }).optional(),
  prepaid: z.number({ message: 'Prepaid must be a valid number' }).optional(),
  variables: z.number({ message: 'Variables must be a valid number' }).optional(),
  environment: z.number({ message: 'Environment allowance must be a valid number' }).optional(),
  meal: z.number({ message: 'Meal allowance must be a valid number' }).optional(),
  shift: z.number({ message: 'Shift allowance must be a valid number' }).optional(),
  supervising: z.number({ message: 'Supervising allowance must be a valid number' }).optional(),
  others: z.number({ message: 'Others must be a valid number' }).optional(),
  bonds: z.number({ message: 'Bonds must be a valid number' }).optional(),
}).strict();

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema: undefined,
  querySchema: undefined,
  historyParamsSchema,
  updateHistorySchema,
  salaryDetailSchema,
};
