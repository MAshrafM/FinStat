// backend/validationSchemas/adminSchemas.js
const { z } = require('zod');
const { paginationQuerySchema, paramsIdSchema, optionalString } = require('./commonSchemas');

/**
 * Query schema for paginated and searchable user list
 */
const listUsersQuerySchema = paginationQuerySchema.extend({
  search: optionalString('Search'),
}).strict();

/**
 * Schema for creating a new user from the admin dashboard
 */
const createUserSchema = z.object({
  username: z
    .string({ message: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters'),
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'manager', 'viewer'], {
    message: "Role must be 'admin', 'manager', or 'viewer'",
  }),
  parentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Parent ID format')
    .optional()
    .nullable(),
}).strict();

/**
 * Schema for deleting a user by id
 */
const deleteUserParamsSchema = paramsIdSchema;

module.exports = {
  listUsersQuerySchema,
  createUserSchema,
  deleteUserParamsSchema,
};
