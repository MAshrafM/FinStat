// backend/validationSchemas/recurringSuggestionSchemas.js
const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema } = require('./commonSchemas');

const ALLOWED_FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

const acceptSuggestionSchema = z
  .object({
    category: z.string().trim().min(1).optional(),
    amount: z.number().positive().optional(),
    frequency: z.enum(ALLOWED_FREQUENCIES).optional(),
  })
  .strict();

const querySuggestionSchema = paginationQuerySchema.extend({
  isAccepted: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  isRejected: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
});

module.exports = {
  acceptSuggestionSchema,
  querySuggestionSchema,
  paramsSchema: paramsIdSchema,
};
