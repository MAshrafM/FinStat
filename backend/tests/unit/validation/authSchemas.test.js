const { createSchema } = require('../../../validationSchemas/authSchemas');

describe('Auth Validation Schemas (Unit Tests)', () => {
  it('should validate valid login credentials', () => {
    const valid = { username: 'testuser', password: 'securepassword123' };
    const result = createSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(valid);
  });

  it('should trim username and reject empty values', () => {
    const result = createSchema.safeParse({ username: '   ', password: 'password' });
    expect(result.success).toBe(false);
  });

  it('should reject missing password', () => {
    const result = createSchema.safeParse({ username: 'testuser' });
    expect(result.success).toBe(false);
  });

  it('should reject unrecognized keys due to strict()', () => {
    const result = createSchema.safeParse({ username: 'testuser', password: '123', extra: 'bad' });
    expect(result.success).toBe(false);
  });
});
