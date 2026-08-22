const express = require('express');
const request = require('supertest');
const validate = require('../../middleware/validate');
const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../../validationSchemas/expenditureSchemas');
const { getValidated } = require('../../utils/requestHelpers');

// Create test router simulating routes/expenditures.js pipeline
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  const mockAuth = (req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011' };
    next();
  };

  // POST endpoint
  app.post(
    '/api/expenditures',
    mockAuth,
    validate({ body: createSchema }),
    (req, res) => {
      const data = getValidated(req, 'body');
      res.status(201).json({ success: true, data });
    }
  );

  // PUT endpoint with params & body validation
  app.put(
    '/api/expenditures/:id',
    mockAuth,
    validate({ params: paramsSchema, body: updateSchema }),
    (req, res) => {
      const params = getValidated(req, 'params');
      const body = getValidated(req, 'body');
      res.json({ success: true, id: params.id, data: body });
    }
  );

  // GET list endpoint with query validation
  app.get(
    '/api/expenditures',
    mockAuth,
    validate({ query: querySchema }),
    (req, res) => {
      const query = getValidated(req, 'query');
      res.json({ success: true, query });
    }
  );

  return app;
};

describe('Expenditure API Integration Tests (HTTP & Middleware Pipeline)', () => {
  const app = createTestApp();

  describe('POST /api/expenditures', () => {
    it('should return 201 when payload is valid', async () => {
      const validPayload = {
        date: '2026-08-22',
        transactionValue: 250,
        transactionType: 'W',
        description: 'Groceries store',
      };

      const res = await request(app)
        .post('/api/expenditures')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transactionValue).toBe(250);
      expect(res.body.data.bank).toBe(0); // default applied
    });

    it('should return 400 with aggregated error details when multiple fields are invalid', async () => {
      const invalidPayload = {
        date: 'invalid-date',
        // missing transactionValue
        transactionType: 'WRONG_ENUM',
        description: '   ', // empty after trim
      };

      const res = await request(app)
        .post('/api/expenditures')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        msg: 'Validation failed',
        message: 'Validation failed',
      });
      expect(Array.isArray(res.body.errors)).toBe(true);

      const fieldNames = res.body.errors.map((e) => e.field);
      expect(fieldNames).toContain('date');
      expect(fieldNames).toContain('transactionValue');
      expect(fieldNames).toContain('transactionType');
      expect(fieldNames).toContain('description');

      // Assert that location is present on every error item
      res.body.errors.forEach((e) => {
        expect(e.location).toBe('body');
      });
    });

    it('should return 400 when extra unknown fields are sent on strict create', async () => {
      const payloadWithExtra = {
        date: '2026-08-22',
        transactionValue: 100,
        transactionType: 'W',
        maliciousField: 'exploit',
      };

      const res = await request(app)
        .post('/api/expenditures')
        .send(payloadWithExtra);

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.message.includes('unrecognized_keys') || e.message.includes('maliciousField') || e.message.includes('Unrecognized'))).toBe(true);
    });
  });

  describe('PUT /api/expenditures/:id', () => {
    it('should return 400 when :id is not a valid MongoDB ObjectId', async () => {
      const res = await request(app)
        .put('/api/expenditures/invalid-mongo-id')
        .send({ transactionValue: 50 });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: 'Invalid ID format',
            location: 'params',
          }),
        ])
      );
    });

    it('should aggregate errors from BOTH params and body into single response', async () => {
      const res = await request(app)
        .put('/api/expenditures/not-a-valid-id')
        .send({ transactionValue: 'not-a-number' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'id', location: 'params' }),
          expect.objectContaining({ field: 'transactionValue', location: 'body' }),
        ])
      );
    });

    it('should return 200 when both valid params and valid partial body are sent', async () => {
      const res = await request(app)
        .put('/api/expenditures/507f1f77bcf86cd799439011')
        .send({ transactionValue: 180 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transactionValue).toBe(180);
    });
  });

  describe('GET /api/expenditures', () => {
    it('should apply defaults and coerce query params', async () => {
      const res = await request(app).get('/api/expenditures?page=2&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.query).toEqual({
        page: 2,
        limit: 10,
        type: undefined,
      });
    });

    it('should return 400 when invalid query parameters are supplied', async () => {
      const res = await request(app).get('/api/expenditures?page=0&limit=999');

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'page', location: 'query' }),
          expect.objectContaining({ field: 'limit', location: 'query' }),
        ])
      );
    });
  });
});
