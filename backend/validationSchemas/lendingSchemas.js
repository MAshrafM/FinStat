// backend/validationSchemas/lendingSchemas.js
const { z } = require('zod');
const { mongoIdSchema, paginationQuerySchema } = require('./commonSchemas');

const createPersonSchema = z
  .object({
    name: z.string({ message: 'Name is required' }).trim().min(1, 'Name cannot be empty').max(100),
    note: z.string().trim().max(500).optional().default(''),
  })
  .strict();

const updatePersonSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').max(100).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

const queryPersonSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(['name', 'totalOwed', 'createdAt']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    search: z.string().trim().optional(),
  })
  .strict();

const createLoanSchema = z
  .object({
    person: mongoIdSchema,
    initialAmountInPiastres: z.coerce
      .number({ message: 'Amount in piastres is required' })
      .int()
      .min(1, 'Amount must be at least 1 piastre'),
    date: z.coerce.date({ message: 'Valid date is required' }),
    note: z.string().trim().max(1000).optional().default(''),
  })
  .strict();

const updateLoanSchema = z
  .object({
    notes: z.string().trim().max(1000).optional(),
    status: z.enum(['Active', 'WrittenOff']).optional(),
  })
  .strict();

const addTransactionSchema = z
  .object({
    type: z.enum(['borrow', 'repay'], { message: "Type must be either 'borrow' or 'repay'" }),
    amountInPiastres: z.coerce
      .number({ message: 'Amount in piastres is required' })
      .int()
      .min(1, 'Amount must be at least 1 piastre'),
    date: z.coerce.date({ message: 'Valid date is required' }),
    note: z.string().trim().max(300).optional().default(''),
  })
  .strict();

const queryLoanSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    person: mongoIdSchema.optional(),
    status: z.enum(['Active', 'Repaid', 'WrittenOff', 'All']).default('All'),
    sortBy: z.enum(['date', 'createdAt', 'balance']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

module.exports = {
  createPersonSchema,
  updatePersonSchema,
  queryPersonSchema,
  createLoanSchema,
  updateLoanSchema,
  addTransactionSchema,
  queryLoanSchema,
};
