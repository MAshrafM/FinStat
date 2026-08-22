const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} = require('../../../utils/errors');

describe('Custom Error Classes (Unit Tests)', () => {
  it('should instantiate AppError with defaults and custom message', () => {
    const error = new AppError('Something went wrong', 418);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(418);
    expect(error.message).toBe('Something went wrong');
    expect(error.isOperational).toBe(true);
    expect(error.errors).toEqual([{ field: 'general', message: 'Something went wrong' }]);
  });

  it('should instantiate BadRequestError with status 400', () => {
    const error = new BadRequestError('Invalid input provided');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('BadRequestError');
    expect(error.isOperational).toBe(true);
  });

  it('should instantiate UnauthorizedError with status 401', () => {
    const error = new UnauthorizedError('Token missing');
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('UnauthorizedError');
  });

  it('should instantiate ForbiddenError with status 403', () => {
    const error = new ForbiddenError('Access denied');
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe('ForbiddenError');
  });

  it('should instantiate NotFoundError with status 404', () => {
    const error = new NotFoundError('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('NotFoundError');
  });

  it('should instantiate ConflictError with status 409', () => {
    const error = new ConflictError('Duplicate key error');
    expect(error.statusCode).toBe(409);
    expect(error.name).toBe('ConflictError');
  });

  it('should instantiate InternalServerError with status 500 and isOperational=false', () => {
    const error = new InternalServerError('Server failed');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('InternalServerError');
    expect(error.isOperational).toBe(false);
  });
});
