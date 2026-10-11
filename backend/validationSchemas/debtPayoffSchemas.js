// backend/validationSchemas/debtPayoffSchemas.js
const { z } = require('zod');
const { mongoIdSchema, paramsIdSchema } = require('./commonSchemas');

const STRATEGIES = ['snowball', 'avalanche', 'custom'];

const calculatePayoffSchema = z.object({
  strategy: z.enum(STRATEGIES, {
    message: `Strategy must be one of: ${STRATEGIES.join(', ')}`,
  }),
  monthlyBudget: z.number({ message: 'Monthly budget is required' }).positive('Monthly budget must be positive'),
  cardIds: z.array(mongoIdSchema).optional(),
  customOrder: z.array(mongoIdSchema).optional(),
}).strict();

const cardPlanItemSchema = z.object({
  cardId: mongoIdSchema,
  balanceInPiastres: z.number().min(0),
  minimumPaymentInPiastres: z.number().min(0),
  apr: z.number().min(0).default(0),
}).strict();

const savePlanSchema = z.object({
  strategy: z.enum(STRATEGIES),
  monthlyBudget: z.number().positive(),
  cards: z.array(cardPlanItemSchema).min(1, 'At least one card is required in the plan'),
  projectedPayoffDate: z.string().optional(),
  totalInterestPaidInPiastres: z.number().min(0).optional(),
  totalInterestSavedInPiastres: z.number().min(0).optional(),
  schedule: z.array(z.object({
    month: z.number(),
    cardId: mongoIdSchema.optional(),
    paymentInPiastres: z.number().optional(),
    interestChargedInPiastres: z.number().optional(),
    remainingBalanceInPiastres: z.number().optional(),
  })).optional(),
}).strict();

module.exports = {
  calculatePayoffSchema,
  savePlanSchema,
  paramsSchema: paramsIdSchema,
};
