// backend/tests/integration/realEstateApi.test.js
const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: '507f1f77bcf86cd799439011', role: 'manager' };
  req.effectiveUserId = '507f1f77bcf86cd799439011';
  req.canModify = true;
  next();
});

const RealEstate = require('../../models/RealEstate');
const realEstateRouter = require('../../routes/realEstates');

jest.mock('../../models/RealEstate');
jest.mock('../../utils/portfolioService', () => ({
  invalidatePortfolioCache: jest.fn(),
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/real-estates', realEstateRouter);
  return app;
};

describe('RealEstate API Integration Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/real-estates', () => {
    it('should return list of real estate properties', async () => {
      const mockProps = [
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Apartment 1',
          purchasePrice: 500000,
          currentValuation: 800000,
          status: 'Owned',
        },
      ];

      RealEstate.find.mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockProps),
      });

      const res = await request(app).get('/api/real-estates');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Apartment 1');
    });
  });

  describe('POST /api/real-estates', () => {
    it('should create a new real estate record', async () => {
      const mockPayload = {
        name: 'Villa 5 North Coast',
        type: 'Villa',
        area: 350,
        location: 'North Coast',
        purchasePrice: 4500000,
        currentValuation: 6000000,
        purchaseDate: '2023-06-01',
        status: 'Owned',
      };

      const mockInstance = {
        _id: '507f1f77bcf86cd799439013',
        ...mockPayload,
        save: jest.fn().mockResolvedValue(true),
      };

      RealEstate.mockImplementationOnce(() => mockInstance);

      const res = await request(app).post('/api/real-estates').send(mockPayload);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Villa 5 North Coast');
    });
  });

  describe('GET /api/real-estates/summary', () => {
    it('should return aggregated real estate summary', async () => {
      RealEstate.aggregate.mockResolvedValueOnce([
        {
          _id: 'Owned',
          totalPaid: 1000000,
          totalValuation: 1600000,
          totalSoldValue: 0,
          count: 2,
        },
      ]);

      const res = await request(app).get('/api/real-estates/summary');

      expect(res.status).toBe(200);
      expect(res.body.owned.totalPaid).toBe(1000000);
      expect(res.body.owned.totalValuation).toBe(1600000);
      expect(res.body.owned.unrealizedGain).toBe(600000);
    });
  });
});
