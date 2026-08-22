const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema, dateStringSchema, sanitizeQueryParam } = require('./commonSchemas');

const ALLOWED_GOLD_STATUS = ['hold', 'sold'];

/**
 * Schema for creating a Gold holding record
 */
const createSchema = z.object({
  date: dateStringSchema,
  item: z
    .string({ message: 'Item name is required' })
    .trim()
    .min(1, 'Item name cannot be empty'),
  karat: z.number({ message: 'Karat is required and must be a valid number' }),
  weight: z.number({ message: 'Weight is required and must be a valid number' }).positive('Weight must be positive'),
  price: z.number({ message: 'Price is required and must be a valid number' }).positive('Price must be positive'),
  paid: z.number({ message: 'Paid amount is required and must be a valid number' }).positive('Paid amount must be positive'),
  seller: z.string({ message: 'Seller must be a string' }).trim().min(1, 'Seller cannot be empty').optional(),
  status: z.enum(ALLOWED_GOLD_STATUS, {
    message: `Status must be one of: ${ALLOWED_GOLD_STATUS.join(', ')}`,
  }).default('hold'),
  sellingPrice: z.number({ message: 'Selling price must be a valid number' }).optional(),
  sellingDate: dateStringSchema.optional(),
})
  .strict()
  .refine(
    (data) => {
      if (data.sellingDate && data.date) {
        return new Date(data.sellingDate) >= new Date(data.date);
      }
      return true;
    },
    {
      message: 'Selling date must be on or after the purchase date',
      path: ['sellingDate'],
    }
  );

/**
 * Schema for updating a Gold holding record
 */
const updateSchema = z.object({
  date: dateStringSchema.optional(),
  item: z.string({ message: 'Item must be a string' }).trim().min(1, 'Item cannot be empty').optional(),
  karat: z.number({ message: 'Karat must be a valid number' }).optional(),
  weight: z.number({ message: 'Weight must be a valid number' }).positive('Weight must be positive').optional(),
  price: z.number({ message: 'Price must be a valid number' }).positive('Price must be positive').optional(),
  paid: z.number({ message: 'Paid amount must be a valid number' }).positive('Paid amount must be positive').optional(),
  seller: z.string({ message: 'Seller must be a string' }).trim().min(1, 'Seller cannot be empty').optional(),
  status: z.enum(ALLOWED_GOLD_STATUS, {
    message: `Status must be one of: ${ALLOWED_GOLD_STATUS.join(', ')}`,
  }).optional(),
  sellingPrice: z.number({ message: 'Selling price must be a valid number' }).optional(),
  sellingDate: dateStringSchema.optional(),
}).strict();

const paramsSchema = paramsIdSchema;

const querySchema = paginationQuerySchema.extend({
  status: sanitizeQueryParam(z.string({ message: 'Status filter must be a string' }).trim().optional()),
  sortBy: sanitizeQueryParam(z.string({ message: 'SortBy must be a string' }).trim().optional()),
  sortOrder: sanitizeQueryParam(z.enum(['asc', 'desc'], { message: 'SortOrder must be asc or desc' }).optional()),
});

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
};
