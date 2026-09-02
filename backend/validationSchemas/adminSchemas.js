// backend/validationSchemas/adminSchemas.js
const { z } = require('zod');
const { paginationQuerySchema, paramsIdSchema, optionalString } = require('./commonSchemas');

/**
 * Query schema for paginated and searchable user list
 */
const listUsersQuerySchema = paginationQuerySchema.extend({
  search: optionalString('Search'),
}).strict();

/**
 * Schema for creating a new user from the admin dashboard
 */
const createUserSchema = z.object({
  username: z
    .string({ message: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters'),
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'manager', 'viewer'], {
    message: "Role must be 'admin', 'manager', or 'viewer'",
  }),
  parentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Parent ID format')
    .optional()
    .nullable(),
}).strict();

/**
 * Schema for deleting a user by id
 */
const deleteUserParamsSchema = paramsIdSchema;

/**
 * Bracket level validation
 */
const taxBracketItemSchema = z.object({
  level: z.number().optional(),
  from: z.number({ message: 'From must be a number' }).min(0, 'From must be non-negative'),
  to: z.number({ message: 'To must be a number' }).min(0, 'To must be non-negative'),
  rate: z.number({ message: 'Rate must be a number' }).min(0, 'Rate must be non-negative'),
}).refine(data => data.to > data.from, {
  message: "'To' value must be strictly greater than 'From' value in each bracket",
  path: ['to'],
});

/**
 * Validates sequential, non-overlapping tax brackets
 */
const validateSequentialBrackets = (brackets) => {
  if (!Array.isArray(brackets) || brackets.length === 0) return true;
  const sorted = [...brackets].sort((a, b) => a.from - b.from);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].from < sorted[i - 1].to) {
      return false; // Overlapping
    }
  }
  return true;
};

const createTaxBracketConfigSchema = z.object({
  country: z.string().trim().default('Egypt'),
  year: z.number({ message: 'Year is required' }).int('Year must be an integer').min(2000).max(2100),
  personalExemption: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  brackets: z.array(taxBracketItemSchema).min(1, 'At least one bracket is required'),
}).refine(data => validateSequentialBrackets(data.brackets), {
  message: 'Tax brackets must be sequential and non-overlapping',
  path: ['brackets'],
});

const updateTaxBracketConfigSchema = z.object({
  country: z.string().trim().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  personalExemption: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  brackets: z.array(taxBracketItemSchema).optional(),
}).refine(data => !data.brackets || validateSequentialBrackets(data.brackets), {
  message: 'Tax brackets must be sequential and non-overlapping',
  path: ['brackets'],
});

const createSocialInsuranceConfigSchema = z.object({
  country: z.string().trim().default('Egypt'),
  year: z.number({ message: 'Year is required' }).int('Year must be an integer').min(2000).max(2100),
  employeeShare: z.number({ message: 'Employee share is required' }).min(0).max(100),
  employerShare: z.number({ message: 'Employer share is required' }).min(0).max(100),
  maxInsurableIncome: z.number({ message: 'Max insurable income is required' }).min(0),
  minInsurableIncome: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
}).refine(data => data.maxInsurableIncome >= (data.minInsurableIncome || 0), {
  message: 'Max insurable income must be greater than or equal to min insurable income',
  path: ['maxInsurableIncome'],
});

const updateSocialInsuranceConfigSchema = z.object({
  country: z.string().trim().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  employeeShare: z.number().min(0).max(100).optional(),
  employerShare: z.number().min(0).max(100).optional(),
  maxInsurableIncome: z.number().min(0).optional(),
  minInsurableIncome: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  listUsersQuerySchema,
  createUserSchema,
  deleteUserParamsSchema,
  adminIdParamsSchema: paramsIdSchema,
  createTaxBracketConfigSchema,
  updateTaxBracketConfigSchema,
  createSocialInsuranceConfigSchema,
  updateSocialInsuranceConfigSchema,
};
