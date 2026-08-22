const { z } = require('zod');
const { mongoIdSchema, paramsIdSchema, dateStringSchema, optionalString } = require('./commonSchemas');

const ALLOWED_TX_TYPES = ['Purchase', 'Installment'];
const ALLOWED_TX_STATUS = ['Due', 'Paid', 'Partial'];

const createCardSchema = z.object({
  name: z.string({ message: 'Card name is required' }).trim().min(1, 'Card name cannot be empty'),
  bank: z.string({ message: 'Bank is required' }).trim().min(1, 'Bank cannot be empty'),
  limit: z.number({ message: 'Limit is required and must be a valid number' }).positive('Limit must be positive'),
  billingCycleDay: z
    .number({ message: 'Billing cycle day is required' })
    .int('Billing cycle day must be an integer')
    .min(1, 'Billing cycle day must be between 1 and 31')
    .max(31, 'Billing cycle day must be between 1 and 31'),
}).strict();

const updateCardSchema = z.object({
  name: optionalString('Card name'),
  bank: optionalString('Bank'),
  limit: z.number({ message: 'Limit must be a valid number' }).positive('Limit must be positive').optional(),
  billingCycleDay: z
    .number({ message: 'Billing cycle day must be a number' })
    .int('Billing cycle day must be an integer')
    .min(1, 'Billing cycle day must be between 1 and 31')
    .max(31, 'Billing cycle day must be between 1 and 31')
    .optional(),
}).strict();

const createTransactionSchema = z.object({
  card: mongoIdSchema,
  description: z.string({ message: 'Description is required' }).trim().min(1, 'Description cannot be empty'),
  amount: z.number({ message: 'Amount is required and must be a valid number' }).positive('Amount must be positive'),
  date: dateStringSchema,
  type: z.enum(ALLOWED_TX_TYPES, {
    message: `Type must be one of: ${ALLOWED_TX_TYPES.join(', ')}`,
  }),
  installmentDetails: z
    .object({
      months: z.number({ message: 'Months must be an integer' }).int().positive().optional(),
      monthlyPrincipal: z.number({ message: 'Monthly principal must be a number' }).positive().optional(),
      interest: z.number({ message: 'Interest must be a number' }).min(0).default(0),
    })
    .strict()
    .optional(),
  status: z.enum(ALLOWED_TX_STATUS).optional(),
  paidAmount: z.number().min(0).optional(),
}).strict();

const updateTransactionSchema = z.object({
  description: optionalString('Description'),
  amount: z.number({ message: 'Amount must be a valid number' }).positive('Amount must be positive').optional(),
  date: dateStringSchema.optional(),
  type: z.enum(ALLOWED_TX_TYPES).optional(),
  installmentDetails: z
    .object({
      months: z.number().int().positive().optional(),
      monthlyPrincipal: z.number().positive().optional(),
      interest: z.number().min(0).optional(),
    })
    .strict()
    .optional(),
  status: z.enum(ALLOWED_TX_STATUS).optional(),
  paidAmount: z.number().min(0).optional(),
}).strict();

const createPaymentSchema = z.object({
  card: mongoIdSchema,
  amount: z.number({ message: 'Amount is required and must be a valid number' }).positive('Amount must be positive'),
  date: dateStringSchema,
}).strict();

const updatePaymentSchema = z.object({
  amount: z.number({ message: 'Amount must be a valid number' }).positive('Amount must be positive').optional(),
  date: dateStringSchema.optional(),
}).strict();

const payInFullSchema = z.object({
  transactionId: mongoIdSchema,
}).strict();

const cardIdParamsSchema = z.object({
  cardId: mongoIdSchema,
}).strict();

module.exports = {
  createCardSchema,
  updateCardSchema,
  createTransactionSchema,
  updateTransactionSchema,
  createPaymentSchema,
  updatePaymentSchema,
  payInFullSchema,
  cardIdParamsSchema,
  paramsSchema: paramsIdSchema,
  querySchema: undefined,
  createSchema: createCardSchema,
  updateSchema: updateCardSchema,
};
