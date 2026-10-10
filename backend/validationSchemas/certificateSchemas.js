const { z } = require('zod');
const { paramsIdSchema, dateStringSchema, optionalString } = require('./commonSchemas');

const createSchema = z.object({
  name: z.string({ message: 'Certificate name is required' }).trim().min(1, 'Certificate name cannot be empty'),
  period: z.coerce.number({ message: 'Period in months is required and must be a valid number' }).positive('Period must be positive'),
  amount: z.coerce.number({ message: 'Amount is required and must be a valid number' }).positive('Amount must be positive'),
  interest: z.coerce.number({ message: 'Interest rate is required and must be a valid number' }).min(0, 'Interest cannot be negative'),
  startDate: dateStringSchema,
  payoutInterval: z.enum(['monthly', 'quarterly', 'annually']).optional(),
  lastPayoutDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  status: z.enum(['active', 'matured', 'withdrawn']).optional(),
  maturityDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
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
  payoutInterval: z.enum(['monthly', 'quarterly', 'annually']).optional(),
  lastPayoutDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  status: z.enum(['active', 'matured', 'withdrawn']).optional(),
  totalInterestPaidInPiastres: z.coerce.number().min(0).optional(),
  maturityDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  withdrawalDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  withdrawalReason: optionalString('Withdrawal reason'),
}).strict();

const withdrawSchema = z.object({
  withdrawalDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  withdrawalReason: optionalString('Withdrawal reason'),
  confirmWithdrawal: z.boolean().optional(),
}).strict();

const listQuerySchema = z.object({
  status: z.enum(['active', 'matured', 'withdrawn', 'maturing_soon', 'future']).optional(),
}).passthrough();

module.exports = {
  createSchema,
  updateSchema,
  withdrawSchema,
  listQuerySchema,
  paramsSchema: paramsIdSchema,
  querySchema: listQuerySchema,
};

