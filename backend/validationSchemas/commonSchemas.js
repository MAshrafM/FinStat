const { z } = require('zod');

// 24-character hexadecimal MongoDB ObjectId pattern
const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates a single MongoDB ObjectId string.
 */
const mongoIdSchema = z
  .string({ message: 'ID must be a string' })
  .trim()
  .regex(MONGO_OBJECT_ID_REGEX, 'Invalid ID format');

/**
 * Standard params schema validating :id as a valid MongoDB ObjectId.
 */
const paramsIdSchema = z.object({
  id: mongoIdSchema,
}).strict();

/**
 * Standard pagination and sorting query schema with automatic coercion and sensible defaults.
 */
const paginationQuerySchema = z.object({
  page: z
    .coerce
    .number({ message: 'Page must be a number' })
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z
    .coerce
    .number({ message: 'Limit must be a number' })
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

/**
 * Validates date strings and ISO date formats.
 */
const dateStringSchema = z
  .string({ message: 'Date must be a string' })
  .trim()
  .min(1, 'Date cannot be empty')
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  });

/**
 * Helper to sanitize query parameters from frontend requests (treats empty string, 'undefined', 'null', 'all' as undefined).
 */
const sanitizeQueryParam = (schema, { allowAll = false } = {}) =>
  z.preprocess((val) => {
    if (val === undefined || val === null || val === '' || val === 'undefined' || val === 'null') {
      return undefined;
    }
    if (!allowAll && (val === 'all' || val === 'ALL')) {
      return undefined;
    }
    return val;
  }, schema);

/**
 * Reusable helper for optional string fields that coerces empty or whitespace-only strings to undefined,
 * enforces non-empty string when provided, and rejects null.
 */
const optionalString = (fieldName = 'Field') =>
  z.preprocess(
    (val) => (val === '' || (typeof val === 'string' && val.trim() === '') ? undefined : val),
    z.string({ message: `${fieldName} must be a string` })
      .trim()
      .min(1, `${fieldName} cannot be empty`)
      .optional()
  );

module.exports = {
  mongoIdSchema,
  paramsIdSchema,
  paginationQuerySchema,
  dateStringSchema,
  sanitizeQueryParam,
  optionalString,
};


