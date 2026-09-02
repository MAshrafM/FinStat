// backend/validationSchemas/paycheckSchemas.js
const { z } = require('zod');
const { paramsIdSchema, paginationQuerySchema } = require('./commonSchemas');

const ALLOWED_PAYCHECK_TYPES = ['Cash', 'Prepaid', 'Direct Deposit', 'Other'];
const DISBURSEMENT_TYPES = [
  'Regular',
  'Basic Months',
  'Basic Production',
  'Sector Bonus',
  'Individual Bonus',
  'Surplus',
  'Bond Distribution',
  'End of Year Bonus',
  'Prepaid',
  'Other',
];

const preprocessNumeric = (fallback = 0) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return fallback;
    const n = Number(val);
    return isNaN(n) ? fallback : n;
  }, z.number().default(fallback));

const paycheckComponentSchema = z.object({
  _id: z.string().optional(),
  name: z.string().trim().min(1, 'Name cannot be empty'),
  value: preprocessNumeric(0),
  type: z.enum(['fixed', 'percentage']).optional().default('fixed'),
  calculationBasis: z.enum(['gross', 'basic']).optional().default('gross'),
  category: z.enum(['basic', 'allowance', 'bonus', 'deduction', 'other']).default('basic'),
  isTaxable: z.boolean().default(true),
  isInsurable: z.boolean().default(true),
}).passthrough();

const previewSchema = z.object({
  period: z.string().trim().optional(),
  year: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().optional()),
  paycheckId: z.string().optional().nullable(),
  salaryProfile: z.string().optional().nullable(),
  disbursementType: z.enum(DISBURSEMENT_TYPES).optional().default('Regular'),
  multiplier: preprocessNumeric(1),
  unitRate: preprocessNumeric(0),
  priorYtdGross: preprocessNumeric(0).optional(),
  components: z.array(paycheckComponentSchema).default([]),
  taxConfig: z.record(z.any()).optional(),
  insuranceConfig: z.record(z.any()).optional(),
  includeTax: z.boolean().optional(),
  includeInsurance: z.boolean().optional(),
  includeMartyrsFund: z.boolean().optional(),
}).passthrough();

const createPaycheckSchema = z.object({
  month: z.string().trim().optional(),
  period: z.string().trim().optional(),
  type: z.enum(ALLOWED_PAYCHECK_TYPES, {
    message: `Type must be one of: ${ALLOWED_PAYCHECK_TYPES.join(', ')}`,
  }).optional(),
  disbursementType: z.enum(DISBURSEMENT_TYPES).optional(),
  multiplier: preprocessNumeric(1).optional(),
  unitRate: preprocessNumeric(0).optional(),
  priorYtdGross: preprocessNumeric(0).optional(),
  cumulativeYtdGross: preprocessNumeric(0).optional(),
  appliedTaxRate: preprocessNumeric(0).optional(),
  includeTax: z.boolean().optional(),
  includeInsurance: z.boolean().optional(),
  includeMartyrsFund: z.boolean().optional(),
  amount: preprocessNumeric(0).optional(),
  netPay: preprocessNumeric(0).optional(),
  note: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  insuranceDeduction: preprocessNumeric(0).optional(),
  grossAmount: preprocessNumeric(0).optional(),
  grossSalary: preprocessNumeric(0).optional(),
  taxDeduction: preprocessNumeric(0).optional(),
  martyrsFund: preprocessNumeric(0).optional(),
  totalDeductions: preprocessNumeric(0).optional(),
  date: z.preprocess((arg) => (typeof arg === 'string' && arg ? arg : undefined), z.string().optional()),
  payDate: z.preprocess(
    (arg) => (typeof arg === 'string' && arg ? new Date(arg) : arg),
    z.date().optional()
  ),
  salaryProfile: z.preprocess((arg) => (arg === '' ? undefined : arg), z.string().optional().nullable()),
  components: z.array(paycheckComponentSchema).optional(),
  taxDetails: z.record(z.any()).optional(),
  insuranceDetails: z.record(z.any()).optional(),
}).passthrough().superRefine((data, ctx) => {
  if (!data.month && !data.period) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Month or Period is required', path: ['month'] });
  }
});

const updatePaycheckSchema = z.object({
  month: z.string().trim().optional(),
  period: z.string().trim().optional(),
  type: z.enum(ALLOWED_PAYCHECK_TYPES, {
    message: `Type must be one of: ${ALLOWED_PAYCHECK_TYPES.join(', ')}`,
  }).optional(),
  disbursementType: z.enum(DISBURSEMENT_TYPES).optional(),
  multiplier: preprocessNumeric(1).optional(),
  unitRate: preprocessNumeric(0).optional(),
  priorYtdGross: preprocessNumeric(0).optional(),
  cumulativeYtdGross: preprocessNumeric(0).optional(),
  appliedTaxRate: preprocessNumeric(0).optional(),
  includeTax: z.boolean().optional(),
  includeInsurance: z.boolean().optional(),
  includeMartyrsFund: z.boolean().optional(),
  amount: preprocessNumeric(0).optional(),
  netPay: preprocessNumeric(0).optional(),
  note: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  insuranceDeduction: preprocessNumeric(0).optional(),
  grossAmount: preprocessNumeric(0).optional(),
  grossSalary: preprocessNumeric(0).optional(),
  taxDeduction: preprocessNumeric(0).optional(),
  martyrsFund: preprocessNumeric(0).optional(),
  totalDeductions: preprocessNumeric(0).optional(),
  date: z.preprocess((arg) => (typeof arg === 'string' && arg ? arg : undefined), z.string().optional()),
  payDate: z.preprocess(
    (arg) => (typeof arg === 'string' && arg ? new Date(arg) : arg),
    z.date().optional()
  ),
  salaryProfile: z.preprocess((arg) => (arg === '' ? undefined : arg), z.string().optional().nullable()),
  components: z.array(paycheckComponentSchema).optional(),
  taxDetails: z.record(z.any()).optional(),
  insuranceDetails: z.record(z.any()).optional(),
}).passthrough();

const paramsSchema = paramsIdSchema;

const querySchema = paginationQuerySchema.extend({
  year: z.preprocess(
    (val) => {
      if (!val || val === 'all' || val === 'undefined' || val === 'null' || val === '') return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    },
    z.number().int().min(1900).max(2100).optional()
  ),
});

module.exports = {
  previewSchema,
  createPaycheckSchema,
  updatePaycheckSchema,
  paramsSchema,
  querySchema,
  ALLOWED_PAYCHECK_TYPES,
  DISBURSEMENT_TYPES,
};
