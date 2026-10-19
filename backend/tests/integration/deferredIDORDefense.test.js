// backend/tests/integration/deferredIDORDefense.test.js
const request = require('supertest');
const express = require('express');

const RealEstate = require('../../models/RealEstate');
const CreditCard = require('../../models/CreditCard');
const CardTransaction = require('../../models/CardTransaction');
const CardPayment = require('../../models/CardPayment');
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

jest.mock('../../models/RealEstate');
jest.mock('../../models/CreditCard');
jest.mock('../../models/CardTransaction');
jest.mock('../../models/CardPayment');
jest.mock('../../utils/portfolioService', () => ({
  invalidatePortfolioCache: jest.fn(),
}));
jest.mock('../../utils/cardPaymentBridge', () => ({
  createExpenditureFromCardTransaction: jest.fn().mockResolvedValue(true),
  createExpenditureFromCardPayment: jest.fn().mockResolvedValue(true),
  unlinkExpenditure: jest.fn().mockResolvedValue(true),
}));

const realEstateRouter = require('../../routes/realEstates');
const creditCardRouter = require('../../routes/creditCards');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/real-estates', realEstateRouter);
  app.use('/api/credit-cards', creditCardRouter);
  app.use(errorHandler);
  return app;
};

describe('Deferred IDOR Defense Tests [MF-SEC-002]', () => {
  let app;
  const targetId = '507f1f77bcf86cd799439099';

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUserId = userBId; // Default to User B
    app = createTestApp();
  });

  describe('Real Estate Routes (PUT /:id, DELETE /:id)', () => {
    it('returns 404 (not 403) when User B updates User A real estate', async () => {
      // Mock findOne: when querying with user: userBId, document is not found
      RealEstate.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        // If un-scoped query without user (legacy bug), return user A's doc
        return Promise.resolve({
          _id: targetId,
          user: userAId,
          name: 'Apartment A',
        });
      });

      const res = await request(app)
        .put(`/api/real-estates/${targetId}`)
        .send({ name: 'Hacked Apartment' });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Property not found');
    });

    it('returns 404 (not 403) when User B deletes User A real estate', async () => {
      RealEstate.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          _id: targetId,
          user: userAId,
          softDelete: jest.fn(),
        });
      });

      const res = await request(app).delete(`/api/real-estates/${targetId}`);

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Property not found');
    });
  });

  describe('Credit Card Management (PUT /cards/:id, DELETE /cards/:id)', () => {
    it('returns 404 (not 403) when User B updates User A credit card', async () => {
      CreditCard.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          _id: targetId,
          user: userAId,
          cardName: 'Gold Card',
        });
      });

      const res = await request(app)
        .put(`/api/credit-cards/cards/${targetId}`)
        .send({ name: 'Renamed Card' });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Card not found');
    });

    it('returns 404 (not 403) when User B deletes User A credit card', async () => {
      CreditCard.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          _id: targetId,
          user: userAId,
          softDelete: jest.fn(),
        });
      });

      const res = await request(app).delete(`/api/credit-cards/cards/${targetId}`);

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Card not found');
    });
  });

  describe('Card Transactions & Payments Tenant Scoping', () => {
    it('returns 404 when User B creates transaction on User A credit card', async () => {
      CreditCard.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ _id: targetId, user: userAId });
      });

      const res = await request(app)
        .post('/api/credit-cards/transactions')
        .send({
          card: targetId,
          amount: 500,
          description: 'Lunch',
          date: '2026-10-18',
          type: 'Purchase',
        });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Card not found');
    });

    it('returns 404 (not 403) when User B updates User A transaction', async () => {
      CardTransaction.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ _id: targetId, user: userAId });
      });

      const res = await request(app)
        .put(`/api/credit-cards/transactions/${targetId}`)
        .send({ description: 'Changed description' });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Transaction not found');
    });

    it('returns 404 (not 403) when User B deletes User A transaction', async () => {
      CardTransaction.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ _id: targetId, user: userAId, softDelete: jest.fn() });
      });

      const res = await request(app).delete(`/api/credit-cards/transactions/${targetId}`);

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Transaction not found');
    });

    it('returns 404 when User B logs payment on User A credit card', async () => {
      CreditCard.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ _id: targetId, user: userAId });
      });

      const res = await request(app)
        .post('/api/credit-cards/payments')
        .send({
          card: targetId,
          amount: 1000,
          date: '2026-10-18',
          paymentSource: 'Bank',
        });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Card not found');
    });

    it('returns 404 (not 403) when User B pays User A transaction in full', async () => {
      CardTransaction.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ _id: targetId, user: userAId });
      });

      const res = await request(app)
        .post('/api/credit-cards/payments/full')
        .send({ transactionId: targetId });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Transaction not found');
    });

    it('returns 404 (not 403) when User B makes partial payment on User A transaction', async () => {
      CardTransaction.findOne.mockImplementation((query) => {
        if (query.user && query.user.toString() === userBId) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ _id: targetId, user: userAId });
      });

      const res = await request(app)
        .post('/api/credit-cards/payments/partial')
        .send({ transactionId: targetId, amount: 200 });

      expect(res.status).toBe(404);
      expect(res.body.msg || res.body.message).toContain('Transaction not found');
    });
  });
});
