const { z } = require('zod');

/**
 * Schema for user login
 */
const createSchema = z.object({
  username: z
    .string({ message: 'Username is required' })
    .trim()
    .min(1, 'Username cannot be empty'),
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password cannot be empty'),
}).strict();

const updateSchema = undefined;
const paramsSchema = undefined;
const querySchema = undefined;

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
  loginSchema: createSchema,
};
