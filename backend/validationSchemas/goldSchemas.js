const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema, dateStringSchema, sanitizeQueryParam, optionalString } = require('./commonSchemas');

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
  karat: z.coerce.number({ message: 'Karat is required and must be a valid number' }),
  weight: z.coerce.number({ message: 'Weight is required and must be a valid number' }).positive('Weight must be positive'),
  price: z.coerce.number({ message: 'Price is required and must be a valid number' }).positive('Price must be positive'),
  paid: z.coerce.number({ message: 'Paid amount is required and must be a valid number' }).positive('Paid amount must be positive'),
  seller: optionalString('Seller'),
  status: z.enum(ALLOWED_GOLD_STATUS, {
    message: `Status must be one of: ${ALLOWED_GOLD_STATUS.join(', ')}`,
  }).default('hold'),
  sellingPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number({ message: 'Selling price must be a valid number' }).positive('Selling price must be positive').optional()
  ),
  sellingDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  destinationAccount: z.enum(['Bank', 'Cash', 'Prepaid']).optional(),
})
  .strict()
  .refine(
    (data) => {
      if (data.status === 'sold') {
        return data.sellingDate != null && data.sellingPrice != null;
      }
      return true;
    },
    {
      message: 'Selling date and selling price are required when status is sold',
      path: ['sellingDate'],
    }
  )
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
  karat: z.coerce.number({ message: 'Karat must be a valid number' }).optional(),
  weight: z.coerce.number({ message: 'Weight must be a valid number' }).positive('Weight must be positive').optional(),
  price: z.coerce.number({ message: 'Price must be a valid number' }).positive('Price must be positive').optional(),
  paid: z.coerce.number({ message: 'Paid amount must be a valid number' }).positive('Paid amount must be positive').optional(),
  seller: optionalString('Seller'),
  status: z.enum(ALLOWED_GOLD_STATUS, {
    message: `Status must be one of: ${ALLOWED_GOLD_STATUS.join(', ')}`,
  }).optional(),
  sellingPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number({ message: 'Selling price must be a valid number' }).positive('Selling price must be positive').optional()
  ),
  sellingDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  destinationAccount: z.enum(['Bank', 'Cash', 'Prepaid']).optional(),
}).strict()
  .refine(
    (data) => {
      if (data.status === 'sold') {
        return data.sellingDate != null && data.sellingPrice != null;
      }
      return true;
    },
    {
      message: 'Selling date and selling price are required when status is sold',
      path: ['sellingDate'],
    }
  )
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
 * Schema for gold query parameters (list and metrics)
 */
const querySchema = paginationQuerySchema.extend({
  status: z.preprocess(
    sanitizeQueryParam,
    z.enum(ALLOWED_GOLD_STATUS, {
      message: `Status must be one of: ${ALLOWED_GOLD_STATUS.join(', ')}`,
    }).optional()
  ),
  karat: z.preprocess(
    (val) => {
      const sanitized = sanitizeQueryParam(val);
      return sanitized !== undefined ? Number(sanitized) : undefined;
    },
    z.number({ message: 'Karat must be a valid number' }).optional()
  ),
  search: z.preprocess(
    sanitizeQueryParam,
    z.string().trim().optional()
  ),
}).strict();

module.exports = {
  createSchema,
  updateSchema,
  querySchema,
  paramsIdSchema,
  ALLOWED_GOLD_STATUS,
};
