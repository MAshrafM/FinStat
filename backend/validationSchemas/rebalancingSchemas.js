// backend/validationSchemas/rebalancingSchemas.js
const { z } = require('zod');

const ALLOWED_ASSET_TYPES = ['stocks', 'mutualFunds', 'gold', 'cash', 'certificates'];

const targetItemSchema = z.object({
  assetType: z.enum(ALLOWED_ASSET_TYPES, {
    message: `Asset type must be one of: ${ALLOWED_ASSET_TYPES.join(', ')}`,
  }),
  percentage: z.coerce
    .number({ message: 'Percentage must be a number' })
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100'),
});

const updateTargetSchema = z.object({
  name: z.string().trim().max(100).optional().default('Default'),
  targets: z
    .array(targetItemSchema)
    .min(1, 'At least one asset target is required')
    .refine(
      (items) => {
        const sum = items.reduce((acc, item) => acc + item.percentage, 0);
        return Math.abs(sum - 100) < 0.1; // Allow minor rounding within 0.1%
      },
      {
        message: 'Total target allocation percentages must sum to 100%',
        path: ['targets'],
      }
    ),
  excludeRealEstate: z.preprocess(
    (val) => (val === undefined || val === null ? true : val === true || val === 'true'),
    z.boolean().optional().default(true)
  ),
  isActive: z.preprocess(
    (val) => (val === undefined || val === null ? true : val === true || val === 'true'),
    z.boolean().optional().default(true)
  ),
}).strict();

module.exports = {
  updateTargetSchema,
  ALLOWED_ASSET_TYPES,
};
