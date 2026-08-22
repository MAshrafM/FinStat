const { formatValidationErrors } = require('../utils/formatValidationErrors');

/**
 * Reusable Express middleware factory for validating request body, query, and params using Zod schemas.
 * 
 * Aggregates all validation errors from body, query, and params into a single 400 response.
 * Upon successful validation, attaches clean parsed data to `req.validatedData`.
 * 
 * @param {Object} schemas
 * @param {import('zod').ZodTypeAny} [schemas.body] - Schema for req.body
 * @param {import('zod').ZodTypeAny} [schemas.query] - Schema for req.query
 * @param {import('zod').ZodTypeAny} [schemas.params] - Schema for req.params
 * @returns {import('express').RequestHandler}
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    const allErrors = [];
    const parsedData = {
      body: undefined,
      query: undefined,
      params: undefined,
    };

    // Validate body if schema provided
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        allErrors.push(...formatValidationErrors(result.error.issues, 'body'));
      } else {
        parsedData.body = result.data;
      }
    }

    // Validate query if schema provided
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        allErrors.push(...formatValidationErrors(result.error.issues, 'query'));
      } else {
        parsedData.query = result.data;
      }
    }

    // Validate params if schema provided
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        allErrors.push(...formatValidationErrors(result.error.issues, 'params'));
      } else {
        parsedData.params = result.data;
      }
    }

    // If any validation errors occurred, return immediate 400 response
    if (allErrors.length > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Validation failed',
        message: 'Validation failed',
        errors: allErrors,
      });
    }

    // Attach validated data to request object
    req.validatedData = parsedData;

    return next();
  };
};

module.exports = validate;
