// backend/tests/integration/searchEscaping.test.js
const request = require('supertest');
const express = require('express');

const Trade = require('../../models/Trade');
const RealEstate = require('../../models/RealEstate');
const errorHandler = require('../../middleware/errorHandler');

// Mock auth middleware to provide deterministic test tenant
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: '507f1f77bcf86cd799439011', role: 'manager' };
  req.effectiveUserId = '507f1f77bcf86cd799439011';
  req.canModify = true;
  next();
});

jest.mock('../../models/Trade');
jest.mock('../../models/RealEstate');
jest.mock('../../utils/portfolioService', () => ({
  invalidatePortfolioCache: jest.fn(),
}));

const tradeRouter = require('../../routes/trade');
const realEstateRouter = require('../../routes/realEstates');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/trades', tradeRouter);
  app.use('/api/real-estates', realEstateRouter);
  app.use(errorHandler);
  return app;
};

describe('Search Query Sanitization & Escaping Tests [AUD-SEC-006]', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/trades?search=...', () => {
    it('escapes unclosed parenthesis without throwing MongoDB regex compilation error', async () => {
      let capturedQuery = null;
      Trade.find.mockImplementationOnce((query) => {
        capturedQuery = query;
        return {
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([]),
        };
      });
      Trade.countDocuments.mockResolvedValueOnce(0);

      const res = await request(app).get('/api/trades?search=(');

      expect(res.status).toBe(200);
      expect(capturedQuery).toBeDefined();
      expect(capturedQuery.stockCode).toEqual({ $regex: '\\(', $options: 'i' });
    });

    it('escapes unclosed character class bracket [ without error', async () => {
      let capturedQuery = null;
      Trade.find.mockImplementationOnce((query) => {
        capturedQuery = query;
        return {
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([]),
        };
      });
      Trade.countDocuments.mockResolvedValueOnce(0);

      const res = await request(app).get('/api/trades?search=[a-z');

      expect(res.status).toBe(200);
      expect(capturedQuery.stockCode).toEqual({ $regex: '\\[a-z', $options: 'i' });
    });

    it('escapes wildcard .* so it performs literal string matching', async () => {
      let capturedQuery = null;
      Trade.find.mockImplementationOnce((query) => {
        capturedQuery = query;
        return {
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([]),
        };
      });
      Trade.countDocuments.mockResolvedValueOnce(0);

      const res = await request(app).get('/api/trades?search=.*');

      expect(res.status).toBe(200);
      expect(capturedQuery.stockCode).toEqual({ $regex: '\\.\\*', $options: 'i' });
    });

    it('truncates search input longer than 100 characters before regex construction', async () => {
      let capturedQuery = null;
      Trade.find.mockImplementationOnce((query) => {
        capturedQuery = query;
        return {
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([]),
        };
      });
      Trade.countDocuments.mockResolvedValueOnce(0);

      const longInput = 'A'.repeat(150);
      const res = await request(app).get(`/api/trades?search=${longInput}`);

      expect(res.status).toBe(200);
      expect(capturedQuery.stockCode.$regex.length).toBe(100);
      expect(capturedQuery.stockCode.$regex).toBe('A'.repeat(100));
    });
  });

  describe('GET /api/real-estates?search=...', () => {
    it('escapes metacharacters in real estate name and location queries', async () => {
      let capturedQuery = null;
      RealEstate.find.mockImplementationOnce((query) => {
        capturedQuery = query;
        return {
          sort: jest.fn().mockResolvedValueOnce([]),
        };
      });

      const res = await request(app).get('/api/real-estates?search=(North)');

      expect(res.status).toBe(200);
      expect(capturedQuery).toBeDefined();
      expect(capturedQuery.$or).toEqual([
        { name: { $regex: '\\(North\\)', $options: 'i' } },
        { location: { $regex: '\\(North\\)', $options: 'i' } },
      ]);
    });

    it('truncates real estate search query longer than 100 characters', async () => {
      let capturedQuery = null;
      RealEstate.find.mockImplementationOnce((query) => {
        capturedQuery = query;
        return {
          sort: jest.fn().mockResolvedValueOnce([]),
        };
      });

      const longInput = 'B'.repeat(120);
      const res = await request(app).get(`/api/real-estates?search=${longInput}`);

      expect(res.status).toBe(200);
      expect(capturedQuery.$or[0].name.$regex.length).toBe(100);
      expect(capturedQuery.$or[0].name.$regex).toBe('B'.repeat(100));
    });
  });
});
