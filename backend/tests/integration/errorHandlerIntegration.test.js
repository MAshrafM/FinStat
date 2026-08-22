const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

describe('Centralized Error Handling (Integration Tests)', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });
  it('should return 200 for root non-API route', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('API Running');
  });

  it('should return structured 404 JSON for unmatched /api/* routes', async () => {
    const res = await request(app).get('/api/completely-unknown-route');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 404,
        message: expect.stringContaining('API endpoint /api/completely-unknown-route not found'),
        msg: expect.stringContaining('API endpoint /api/completely-unknown-route not found'),
        errors: expect.any(Array),
      })
    );
  });

  it('should return 401 when accessing protected API route without token', async () => {
    const res = await request(app).get('/api/paychecks');
    expect(res.statusCode).toBe(401);
    expect(res.body.msg || res.body.message).toBe('No token, authorization denied');
  });
});
