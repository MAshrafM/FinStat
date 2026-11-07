// backend/validationSchemas/userSchemas.js
const { z } = require('zod');

const emptyToNull = (val) => (val === '' ? null : val);

const updateProfileSchema = z.object({
  fullName: z.preprocess(emptyToNull, z.string().trim().max(150, 'Full name too long').optional().nullable()),
  dateOfBirth: z.preprocess(
    (arg) => (arg === '' || arg === null ? null : typeof arg === 'string' ? new Date(arg) : arg),
    z.date().optional().nullable()
  ),
  nationalId: z.preprocess(emptyToNull, z.string().trim().max(50, 'National ID too long').optional().nullable()),
  phone: z.preprocess(emptyToNull, z.string().trim().max(30, 'Phone too long').optional().nullable()),
  address: z.preprocess(emptyToNull, z.string().trim().max(300, 'Address too long').optional().nullable()),
  title: z.preprocess(emptyToNull, z.string().trim().max(100, 'Title too long').optional().nullable()),
  company: z.preprocess(emptyToNull, z.string().trim().max(100, 'Company too long').optional().nullable()),
  department: z.preprocess(emptyToNull, z.string().trim().max(100, 'Department too long').optional().nullable()),
  employeeId: z.preprocess(emptyToNull, z.string().trim().max(50, 'Employee ID too long').optional().nullable()),
  email: z.preprocess(emptyToNull, z.string().email('Invalid email address').trim().toLowerCase().optional().nullable()),
  username: z.string().min(3, 'Username must be at least 3 characters').trim().optional(),
  costBasisMethod: z.enum(['fifo', 'lifo', 'average'], {
    message: 'Cost basis method must be one of: fifo, lifo, average',
  }).optional(),
}).strict();

const userParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});

const switchAccountSchema = z.object({
  targetUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target user ID'),
}).strict();

const createDelegationSchema = z.object({
  targetUsername: z.string().trim().min(3, 'Target username must be at least 3 characters'),
  relationship: z.enum(['dependent', 'spouse', 'child', 'parent', 'client', 'accountant', 'other']).optional(),
  permissions: z.enum(['view_only', 'full_access']).optional(),
  notes: z.string().trim().max(200, 'Notes too long').optional(),
}).strict();

const updateDelegationSchema = z.object({
  status: z.enum(['active', 'pending', 'revoked']).optional(),
  permissions: z.enum(['view_only', 'full_access']).optional(),
  notes: z.string().trim().max(200, 'Notes too long').optional(),
}).strict();

const delegationParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid delegation ID'),
});

module.exports = {
  updateProfileSchema,
  userParamsSchema,
  switchAccountSchema,
  createDelegationSchema,
  updateDelegationSchema,
  delegationParamsSchema,
};
