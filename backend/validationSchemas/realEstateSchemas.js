// backend/validationSchemas/realEstateSchemas.js
const { z } = require('zod');
const { paramsIdSchema, dateStringSchema, optionalString } = require('./commonSchemas');

const propertyTypeEnum = z.enum(['Residential', 'Commercial', 'Land', 'Villa', 'Other']);
const statusEnum = z.enum(['Owned', 'Sold']);

const createSchema = z.object({
  name: z.string({ message: 'Property name is required' }).trim().min(1, 'Property name cannot be empty'),
  type: propertyTypeEnum.default('Residential'),
  area: z.coerce.number().min(0, 'Area must be non-negative').default(0),
  location: z.string().trim().optional().default(''),
  purchasePrice: z.coerce.number({ message: 'Purchase price is required' }).positive('Purchase price must be positive'),
  currentValuation: z.coerce.number({ message: 'Current valuation is required' }).min(0, 'Current valuation cannot be negative'),
  purchaseDate: dateStringSchema,
  status: statusEnum.default('Owned'),
  sellingPrice: z.coerce.number().min(0).optional().default(0),
  sellingDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  notes: z.string().trim().optional().default(''),
}).strict();

const updateSchema = z.object({
  name: optionalString('Property name'),
  type: propertyTypeEnum.optional(),
  area: z.coerce.number().min(0).optional(),
  location: optionalString('Location'),
  purchasePrice: z.coerce.number().positive().optional(),
  currentValuation: z.coerce.number().min(0).optional(),
  purchaseDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  status: statusEnum.optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  sellingDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    dateStringSchema.optional()
  ),
  notes: optionalString('Notes'),
}).strict();

const querySchema = z.object({
  status: z.enum(['all', 'Owned', 'Sold']).optional().default('all'),
  type: z.string().optional(),
  search: z.string().optional(),
}).strict();

module.exports = {
  createSchema,
  updateSchema,
  paramsSchema: paramsIdSchema,
  querySchema,
};
