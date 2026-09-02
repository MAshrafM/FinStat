// backend/validationSchemas/salaryProfileSchemas.js
const { z } = require('zod');
const { mongoIdSchema, dateStringSchema } = require('./commonSchemas');

const componentSchema = z.object({
  _id: z.string().optional(),
  name: z.string({ message: 'Component name is required' }).trim().min(1, 'Name cannot be empty'),
  type: z.enum(['fixed', 'percentage']).default('fixed'),
  value: z.number({ message: 'Value must be a number' }),
  calculationBasis: z.enum(['gross', 'basic']).default('gross'),
  category: z.enum(['basic', 'allowance', 'bonus', 'deduction', 'other']).default('basic'),
  isTaxable: z.boolean().default(true),
  isInsurable: z.boolean().default(true),
  isActive: z.boolean().default(true),
}).strict();

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

const createSalaryProfileSchema = z.object({
  name: z.string({ message: 'Name is required' }).trim().min(1, 'Name cannot be empty'),
  title: z.string({ message: 'Title is required' }).trim().min(1, 'Title cannot be empty'),
  position: z.string({ message: 'Position must be a string' }).trim().min(1, 'Position cannot be empty').optional(),
  year: z.number({ message: 'Year is required and must be an integer' }).int('Year must be an integer'),
  components: z.array(componentSchema).optional(),
  salaryDetails: salaryDetailSchema.optional(),
  isDefault: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  effectiveDate: z.preprocess(
    (arg) => (typeof arg === 'string' && arg ? new Date(arg) : arg),
    z.date().optional()
  ),
}).strict();

const updateSalaryProfileSchema = z.object({
  name: z.string({ message: 'Name must be a string' }).trim().min(1, 'Name cannot be empty').optional(),
  title: z.string({ message: 'Title must be a string' }).trim().min(1, 'Title cannot be empty').optional(),
  position: z.string({ message: 'Position must be a string' }).trim().min(1, 'Position cannot be empty').optional(),
  year: z.number({ message: 'Year must be an integer' }).int().optional(),
  components: z.array(componentSchema).optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
  effectiveDate: z.preprocess(
    (arg) => (typeof arg === 'string' && arg ? new Date(arg) : arg),
    z.date().optional()
  ),
}).strict();

const profileParamsSchema = z.object({
  id: mongoIdSchema,
}).strict();

const historyParamsSchema = z.object({
  historyId: mongoIdSchema,
}).strict();

const updateHistorySchema = z.object({
  effectiveDate: dateStringSchema.optional(),
  basicSalary: z.number().optional(),
  basicProduction: z.number().optional(),
  prepaid: z.number().optional(),
  variables: z.number().optional(),
  environment: z.number().optional(),
  meal: z.number().optional(),
  shift: z.number().optional(),
  supervising: z.number().optional(),
  others: z.number().optional(),
  bonds: z.number().optional(),
}).strict();

module.exports = {
  componentSchema,
  salaryDetailSchema,
  createSchema: createSalaryProfileSchema,
  updateSchema: updateSalaryProfileSchema,
  createSalaryProfileSchema,
  updateSalaryProfileSchema,
  profileParamsSchema,
  paramsSchema: profileParamsSchema,
  historyParamsSchema,
  updateHistorySchema,
};
