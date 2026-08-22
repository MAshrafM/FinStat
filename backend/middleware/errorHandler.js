const { AppError } = require('../utils/errors');

/**
 * 4-parameter centralized Express error handling middleware.
 * Formats all operational and unexpected errors into a consistent response envelope.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // 1. Convert Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid ID format for field '${err.path}'`;
    error = new AppError(message, 400, [
      { field: err.path || 'id', message, location: 'params' },
    ]);
  }

  // 2. Convert MongoDB Duplicate Key Error (E11000)
  else if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    const message = `A record with ${field} '${value}' already exists`;
    error = new AppError(message, 409, [
      { field, message, location: 'body' },
    ]);
  }

  // 3. Convert Mongoose Schema Validation Error
  else if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path || 'general',
      message: e.message,
      location: 'body',
    }));
    const message = errors[0]?.message || 'Database validation failed';
    error = new AppError(message, 400, errors);
  }

  // 4. Convert JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token', 401);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token has expired', 401);
  }

  // 5. Fallback for unhandled programming/runtime errors
  else if (!(error instanceof AppError)) {
    // Log unexpected errors to console (captured by Vercel Functions Logs)
    console.error('Unhandled Exception:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction ? 'Internal Server Error' : err.message || 'Internal Server Error';
    error = new AppError(message, 500);
    error.isOperational = false;
  }

  const statusCode = error.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  const responseBody = {
    success: false,
    message: error.message,
    msg: error.message, // Dual compatibility with legacy frontend checks
    errors: error.errors || [{ field: 'general', message: error.message }],
    statusCode,
  };

  if (isDev && error.stack) {
    responseBody.stack = error.stack;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;
