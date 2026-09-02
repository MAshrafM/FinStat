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
}).passthrough();

const userParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});

module.exports = {
  updateProfileSchema,
  userParamsSchema,
};
