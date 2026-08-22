const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../middleware/auth');

describe('Auth Middleware (Unit Tests)', () => {
  const secret = 'testsecret123';
  process.env.JWT_SECRET = secret;

  const validPayload = { user: { id: '507f1f77bcf86cd799439011' } };
  const validToken = jwt.sign(validPayload, secret);

  it('should authenticate with x-auth-token header', () => {
    const req = {
      header: jest.fn().mockImplementation((name) => {
        if (name === 'x-auth-token') return validToken;
        return null;
      }),
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(validPayload.user);
  });

  it('should authenticate with Authorization: Bearer <token> header', () => {
    const req = {
      header: jest.fn().mockImplementation((name) => {
        if (name === 'authorization') return `Bearer ${validToken}`;
        return null;
      }),
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(validPayload.user);
  });

  it('should reject requests with missing token', () => {
    const req = { header: jest.fn().mockReturnValue(null) };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'No token, authorization denied' });
    expect(next).not.toHaveBeenCalled();
  });
});
