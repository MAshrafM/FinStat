// backend/validationSchemas/budgetSchemas.js
const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema } = require('./commonSchemas');

const ALLOWED_PERIODS = ['monthly', 'quarterly', 'yearly'];

const createBudgetSchema = z
  .object({
    category: z.string({ message: 'Category is required' }).trim().min(1, 'Category cannot be empty'),
    period: z.enum(ALLOWED_PERIODS, {
      message: `Period must be one of: ${ALLOWED_PERIODS.join(', ')}`,
    }),
    year: z.coerce.number({ message: 'Year must be a valid number' }).int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12).optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    amount: z.coerce
      .number({ message: 'Budget amount is required and must be a number' })
      .positive('Budget amount must be greater than 0'),
    alertThreshold: z.coerce
      .number({ message: 'Alert threshold must be a number' })
      .min(0)
      .max(100)
      .default(80),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.period === 'monthly') {
      if (data.month === undefined || data.month === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Month is required for monthly budgets',
          path: ['month'],
        });
      }
      if (data.quarter != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Quarter must not be set for monthly budgets',
          path: ['quarter'],
        });
      }
    }
    if (data.period === 'quarterly') {
      if (data.quarter === undefined || data.quarter === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Quarter is required for quarterly budgets',
          path: ['quarter'],
        });
      }
      if (data.month != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Month must not be set for quarterly budgets',
          path: ['month'],
        });
      }
    }
    if (data.period === 'yearly') {
      if (data.month != null || data.quarter != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Month and quarter must not be set for yearly budgets',
          path: ['month'],
        });
      }
    }
  });

const updateBudgetSchema = z
  .object({
    category: z.string().trim().min(1).optional(),
    period: z.any().optional(),
    year: z.any().optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    amount: z.coerce.number().positive().optional(),
    alertThreshold: z.coerce.number().min(0).max(100).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.period !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Period and year cannot be modified. Delete and recreate the budget.',
        path: ['period'],
      });
    }
    if (data.year !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Period and year cannot be modified. Delete and recreate the budget.',
        path: ['year'],
      });
    }
  });

const progressQuerySchema = z
  .object({
    period: z.enum(ALLOWED_PERIODS).optional(),
    year: z.coerce.number().int().optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    category: z.string().trim().optional(),
  })
  .strict();

const queryBudgetSchema = paginationQuerySchema.extend({
  period: z.enum(ALLOWED_PERIODS).optional(),
  year: z.coerce.number().int().optional(),
  category: z.string().trim().optional(),
});

module.exports = {
  createBudgetSchema,
  updateBudgetSchema,
  progressQuerySchema,
  queryBudgetSchema,
  paramsSchema: paramsIdSchema,
};
