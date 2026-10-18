// backend/tests/integration/assetLiquidationIDOR.test.js
const request = require('supertest');
const express = require('express');

const Certificate = require('../../models/Certificate');
const Gold = require('../../models/Gold');
const Trade = require('../../models/Trade');
const errorHandler = require('../../middleware/errorHandler');

const userAId = '507f1f77bcf86cd799439001';
const userBId = '507f1f77bcf86cd799439002';
let mockCurrentUserId = userBId; // Default to User B (attacker / cross-tenant)

// Mock auth middleware dynamic to mockCurrentUserId
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: mockCurrentUserId, role: 'manager' };
  req.effectiveUserId = mockCurrentUserId;
  req.canModify = true;
  next();
});

jest.mock('../../models/Certificate');
jest.mock('../../models/Gold');
jest.mock('../../models/Trade');
jest.mock('../../utils/portfolioService', () => ({
  invalidatePortfolioCache: jest.fn(),
}));

const certificateRouter = require('../../routes/certificates');
const goldRouter = require('../../routes/golds');
const tradeRouter = require('../../routes/trade');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/certificates', certificateRouter);
  app.use('/api/golds', goldRouter);
  app.use('/api/trades', tradeRouter);
  app.use(errorHandler);
  return app;
};

describe('Asset Liquidation & Mutation IDOR Defense Tests [MF-SEC-002]', () => {
  let app;
  const assetAId = '507f1f77bcf86cd799439099';

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUserId = userBId; // Default to User B
    app = createTestApp();
  });

  describe('Certificate Routes (POST /:id/withdraw, PUT /:id, DELETE /:id)', () => {
    it('returns HTTP 404 Not Found when User B attempts to withdraw User A certificate', async () => {
      // Mock findOne: when querying with user: userBId, document is not found
      Certificate.findOne.mockImplementation(({ _id, user }) => {
        if (user === userAId) {
          return Promise.resolve({
            _id: assetAId,
            user: userAId,
            status: 'active',
            amount: 100000,
            interest: 20,
            duration: 12,
            startDate: new Date(),
            save: jest.fn().mockResolvedValue(true),
          });
        }
        return Promise.resolve(null); // Tenant scoping returns null
      });

      const res = await request(app)
        .post(`/api/certificates/${assetAId}/withdraw`)
        .send({ withdrawalReason: 'Unauthorized test liquidation' });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Certificate not found');
    });

    it('returns HTTP 404 Not Found when User B attempts to update User A certificate', async () => {
      Certificate.findOne.mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/certificates/${assetAId}`)
        .send({ amount: 50000 });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Certificate not found');
    });

    it('returns HTTP 404 Not Found when User B attempts to delete User A certificate', async () => {
      Certificate.findOne.mockResolvedValue(null);

      const res = await request(app).delete(`/api/certificates/${assetAId}`);

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Certificate not found');
    });

    it('allows rightful owner (User A) to withdraw their own certificate', async () => {
      mockCurrentUserId = userAId; // Switch to User A
      const mockCert = {
        _id: assetAId,
        user: userAId,
        status: 'active',
        amount: 100000,
        amountInPiastres: 10000000,
        interest: 20,
        duration: 12,
        issueDate: new Date('2025-01-01'),
        startDate: new Date('2025-01-01'),
        payoutFrequency: 'monthly',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: assetAId,
          amount: 100000,
          interest: 20,
          status: 'withdrawn',
        }),
      };
      Certificate.findOne.mockResolvedValue(mockCert);

      const res = await request(app)
        .post(`/api/certificates/${assetAId}/withdraw`)
        .send({ withdrawalReason: 'Legitimate owner withdrawal' });

      expect(res.status).toBe(200);
      expect(res.body.msg).toContain('Certificate marked as withdrawn');
    });
  });

  describe('Gold Routes (PUT /:id, DELETE /:id)', () => {
    it('returns HTTP 404 Not Found when User B attempts to liquidate User A gold log', async () => {
      Gold.findOne.mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/golds/${assetAId}`)
        .send({ sellingPrice: 5000, sellingDate: '2026-05-01' });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Gold log not found');
    });

    it('returns HTTP 404 Not Found when User B attempts to delete User A gold log', async () => {
      Gold.findOne.mockResolvedValue(null);

      const res = await request(app).delete(`/api/golds/${assetAId}`);

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Gold log not found');
    });
  });

  describe('Trade Routes (PUT /:id, DELETE /:id)', () => {
    it('returns HTTP 404 Not Found when User B attempts to update User A trade', async () => {
      Trade.findOne.mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/trades/${assetAId}`)
        .send({ price: 150 });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Trade not found');
    });

    it('returns HTTP 404 Not Found when User B attempts to delete User A trade', async () => {
      Trade.findOne.mockResolvedValue(null);

      const res = await request(app).delete(`/api/trades/${assetAId}`);

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Trade not found');
    });
  });
});
