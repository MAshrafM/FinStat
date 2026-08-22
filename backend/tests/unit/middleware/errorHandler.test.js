const errorHandler = require('../../../middleware/errorHandler');
const { NotFoundError, BadRequestError } = require('../../../utils/errors');

describe('Centralized Error Handler Middleware (Unit Tests)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET', originalUrl: '/api/test' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should handle AppError instances properly', () => {
    const error = new NotFoundError('Item not found');
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Item not found',
        msg: 'Item not found',
        statusCode: 404,
        errors: [{ field: 'general', message: 'Item not found' }],
      })
    );
  });

  it('should format Mongoose CastError into 400 Bad Request', () => {
    const castError = {
      name: 'CastError',
      path: '_id',
      value: 'invalid-id-123',
    };

    errorHandler(castError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        message: expect.stringContaining("Invalid ID format for field '_id'"),
      })
    );
  });

  it('should format MongoServerError code 11000 duplicate key into 409 Conflict', () => {
    const duplicateError = {
      name: 'MongoServerError',
      code: 11000,
      keyValue: { email: 'test@example.com' },
    };

    errorHandler(duplicateError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 409,
        message: "A record with email 'test@example.com' already exists",
      })
    );
  });

  it('should format Mongoose ValidationError into 400 Bad Request', () => {
    const validationError = {
      name: 'ValidationError',
      errors: {
        amount: { path: 'amount', message: 'Amount is required' },
      },
    };

    errorHandler(validationError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        message: 'Amount is required',
      })
    );
  });

  it('should format JWT TokenExpiredError into 401 Unauthorized', () => {
    const jwtError = { name: 'TokenExpiredError' };

    errorHandler(jwtError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 401,
        message: 'Authentication token has expired',
      })
    );
  });

  it('should fallback to 500 for generic runtime exceptions', () => {
    const genericError = new Error('Unexpected database disconnection');

    // Spy on console.error to keep test output clean
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(genericError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: expect.any(String),
      })
    );

    consoleSpy.mockRestore();
  });
});
