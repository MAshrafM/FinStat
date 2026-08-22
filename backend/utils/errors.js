/**
 * Base Application Error class for operational (expected) exceptions.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {Array<{field: string, message: string, location?: string}>} [errors=[]] - Detailed errors array
   */
  constructor(message = 'Internal Server Error', statusCode = 500, errors = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors.length > 0 ? errors : [{ field: 'general', message }];

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request Error (business logic violations, invalid parameters)
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errors = []) {
    super(message, 400, errors);
  }
}

/**
 * 401 Unauthorized Error (missing or invalid authentication)
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', errors = []) {
    super(message, 401, errors);
  }
}

/**
 * 403 Forbidden Error (authenticated user lacking access permissions)
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', errors = []) {
    super(message, 403, errors);
  }
}

/**
 * 404 Not Found Error (requested resource or endpoint does not exist)
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found', errors = []) {
    super(message, 404, errors);
  }
}

/**
 * 409 Conflict Error (duplicate resource, unique index conflict, state collision)
 */
class ConflictError extends AppError {
  constructor(message = 'Conflict with existing resource', errors = []) {
    super(message, 409, errors);
  }
}

/**
 * 500 Internal Server Error
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', errors = []) {
    super(message, 500, errors);
    this.isOperational = false;
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
};
