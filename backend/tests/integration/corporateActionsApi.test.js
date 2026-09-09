// backend/tests/integration/corporateActionsApi.test.js
const express = require('express');
const request = require('supertest');

const mockUserId = '507f1f77bcf86cd799439011';

jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: mockUserId, role: 'manager' };
  req.effectiveUserId = mockUserId;
  req.canModify = true;
  next();
});

jest.mock('../../models/CorporateAction', () => {
  const MockCorporateAction = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  });
  MockCorporateAction.find = jest.fn();
  MockCorporateAction.findOne = jest.fn();
  MockCorporateAction.countDocuments = jest.fn();
  return MockCorporateAction;
});
jest.mock('../../models/Trade');
jest.mock('../../utils/portfolioService');

const CorporateAction = require('../../models/CorporateAction');
const corporateActionsRouter = require('../../routes/corporateActions');
const tradeRouter = require('../../routes/trade');
const { invalidatePortfolioCache } = require('../../utils/portfolioService');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/corporate-actions', corporateActionsRouter);
  app.use('/api/trades', tradeRouter);
  return app;
};

describe('Corporate Actions API Integration Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/corporate-actions', () => {
    it('should list corporate actions for the authenticated user', async () => {
      const mockActions = [
        {
          _id: 'ca_1',
          user: mockUserId,
          stockCode: 'COMI',
          broker: 'Thndr',
          type: 'split',
          ratio: 2,
          effectiveDate: new Date('2024-01-01'),
        },
      ];

      CorporateAction.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockActions),
      });
      CorporateAction.countDocuments.mockResolvedValue(1);

      const res = await request(app).get('/api/corporate-actions');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].stockCode).toBe('COMI');
      expect(res.body.totalCount).toBe(1);
    });
  });

  describe('POST /api/corporate-actions', () => {
    it('should create a corporate action and invalidate cache', async () => {
      const payload = {
        stockCode: 'COMI',
        broker: 'Thndr',
        type: 'split',
        ratio: 2,
        effectiveDate: '2024-01-01',
        notes: '2 for 1 stock split',
      };

      const res = await request(app)
        .post('/api/corporate-actions')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.stockCode).toBe('COMI');
      expect(res.body.ratio).toBe(2);
      expect(invalidatePortfolioCache).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('DELETE /api/corporate-actions/:id', () => {
    it('should soft delete action and invalidate cache', async () => {
      const mockAction = {
        _id: '507f1f77bcf86cd799439012',
        user: mockUserId,
        softDelete: jest.fn().mockResolvedValue(true),
      };

      CorporateAction.findOne.mockResolvedValue(mockAction);

      const res = await request(app).delete('/api/corporate-actions/507f1f77bcf86cd799439012');

      expect(res.status).toBe(200);
      expect(res.body.msg).toContain('deleted successfully');
      expect(mockAction.softDelete).toHaveBeenCalled();
      expect(invalidatePortfolioCache).toHaveBeenCalledWith(mockUserId);
    });
  });
});
