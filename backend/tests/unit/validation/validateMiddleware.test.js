const { z } = require('zod');
const validate = require('../../../middleware/validate');
const { formatValidationErrors } = require('../../../utils/formatValidationErrors');
const { mongoIdSchema, paramsIdSchema, paginationQuerySchema, dateStringSchema } = require('../../../validationSchemas/commonSchemas');
const { getValidated } = require('../../../utils/requestHelpers');

describe('Validation Infrastructure & Common Schemas', () => {
  describe('formatValidationErrors', () => {
    it('should format zod issues with field, message, and location', () => {
      const issues = [
        { path: ['amount'], message: 'Amount is required' },
        { path: ['nested', 'field'], message: 'Nested field is invalid' },
      ];
      const formatted = formatValidationErrors(issues, 'body');

      expect(formatted).toEqual([
        { field: 'amount', message: 'Amount is required', location: 'body' },
        { field: 'nested.field', message: 'Nested field is invalid', location: 'body' },
      ]);
    });

    it('should fallback to general when path is empty', () => {
      const issues = [{ path: [], message: 'General custom refinement error' }];
      const formatted = formatValidationErrors(issues, 'body');

      expect(formatted).toEqual([
        { field: 'general', message: 'General custom refinement error', location: 'body' },
      ]);
    });
  });

  describe('getValidated helper', () => {
    it('should return data from req.validatedData if available', () => {
      const req = {
        validatedData: { body: { amount: 500 } },
        body: { amount: '500' },
      };
      expect(getValidated(req, 'body')).toEqual({ amount: 500 });
    });

    it('should fallback to req[location] if req.validatedData[location] is not set', () => {
      const req = {
        body: { rawField: 'raw' },
      };
      expect(getValidated(req, 'body')).toEqual({ rawField: 'raw' });
    });
  });

  describe('commonSchemas', () => {
    it('should validate valid MongoDB ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(mongoIdSchema.safeParse(validId).success).toBe(true);
      expect(paramsIdSchema.safeParse({ id: validId }).success).toBe(true);
    });

    it('should reject invalid MongoDB ObjectId', () => {
      const invalidId = '123-invalid-id';
      const result = mongoIdSchema.safeParse(invalidId);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('Invalid ID format');
    });

    it('should coerce and set defaults for pagination query', () => {
      const result = paginationQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ page: 1, limit: 20 });

      const customResult = paginationQuerySchema.safeParse({ page: '3', limit: '50' });
      expect(customResult.success).toBe(true);
      expect(customResult.data).toEqual({ page: 3, limit: 50 });
    });

    it('should validate valid date string and reject invalid date', () => {
      expect(dateStringSchema.safeParse('2026-08-22').success).toBe(true);
      expect(dateStringSchema.safeParse('invalid-date').success).toBe(false);
    });
  });

  describe('validate middleware', () => {
    const mockResponse = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it('should pass and attach req.validatedData when schemas are valid', () => {
      const bodySchema = z.object({ amount: z.number().positive() }).strict();
      const querySchema = z.object({ page: z.coerce.number().default(1) });
      const middleware = validate({ body: bodySchema, query: querySchema });

      const req = {
        body: { amount: 100 },
        query: { page: '2' },
        params: {},
      };
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(req.validatedData).toEqual({
        body: { amount: 100 },
        query: { page: 2 },
        params: undefined,
      });
    });

    it('should aggregate errors from body, query, and params and return 400', () => {
      const bodySchema = z.object({ amount: z.number({ message: 'Amount is required' }) }).strict();
      const paramsSchema = paramsIdSchema;
      const middleware = validate({ body: bodySchema, params: paramsSchema });

      const req = {
        body: {}, // Missing amount
        params: { id: 'invalid-id' }, // Invalid ObjectId
      };
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Validation failed',
        message: 'Validation failed',
        errors: [
          { field: 'amount', message: 'Amount is required', location: 'body' },
          { field: 'id', message: 'Invalid ID format', location: 'params' },
        ],
      });
    });

    it('should skip omitted schemas and not produce errors', () => {
      const middleware = validate({});
      const req = { body: { any: 'thing' } };
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.validatedData).toEqual({
        body: undefined,
        query: undefined,
        params: undefined,
      });
    });
  });
});
