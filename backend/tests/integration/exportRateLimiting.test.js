// backend/tests/integration/exportRateLimiting.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const userAId = '507f1f77bcf86cd799439001';
const userBId = '507f1f77bcf86cd799439002';
let mockCurrentUser = { id: userAId, role: 'viewer' };
let mockIsAuthenticated = true;

// Mock auth middleware dynamic to test context
jest.mock('../../middleware/auth', () => (req, res, next) => {
  if (!mockIsAuthenticated) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  req.user = mockCurrentUser;
  req.effectiveUserId = mockCurrentUser.id;
  req.canModify = true;
  next();
});

// Mock Expenditure & Trade models
const mockExpenditureDocs = [
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    user: new mongoose.Types.ObjectId(userAId),
    date: new Date('2026-10-18T10:00:00.000Z'),
    category: 'Groceries',
    transactionValue: 500,
    transactionType: 'W',
    description: 'Weekly grocery run',
    bank: 500,
    cash: 0,
    prepaid: 0,
  },
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
    user: new mongoose.Types.ObjectId(userBId),
    date: new Date('2026-10-18T11:00:00.000Z'),
    category: 'Electronics',
    transactionValue: 3000,
    transactionType: 'W',
    description: 'Headphones',
    bank: 3000,
    cash: 0,
    prepaid: 0,
  },
];

const mockTradeDocs = [
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439021'),
    user: new mongoose.Types.ObjectId(userAId),
    date: new Date('2026-10-17T09:30:00.000Z'),
    broker: 'Thndr',
    stockCode: 'COMI',
    type: 'Buy',
    quantity: 100,
    price: 85.5,
    totalCost: 8550,
    splitRatio: null,
  },
];

async function* mockCreateAsyncCursor(docs) {
  for (const doc of docs) {
    yield doc;
  }
}

let mockCountDocumentsOverride = null;

jest.mock('../../models/Expenditure', () => ({
  countDocuments: jest.fn(async (query) => {
    if (mockCountDocumentsOverride !== null) return mockCountDocumentsOverride;
    const userId = query.user ? query.user.toString() : null;
    return mockExpenditureDocs.filter((d) => d.user.toString() === userId).length;
  }),
  find: jest.fn((query) => {
    const userId = query.user ? query.user.toString() : null;
    const matched = mockExpenditureDocs.filter((d) => d.user.toString() === userId);
    return {
      sort: () => ({
        lean: () => ({
          cursor: () => mockCreateAsyncCursor(matched),
        }),
      }),
    };
  }),
}));

jest.mock('../../models/Trade', () => ({
  countDocuments: jest.fn(async (query) => {
    if (mockCountDocumentsOverride !== null) return mockCountDocumentsOverride;
    const userId = query.user ? query.user.toString() : null;
    return mockTradeDocs.filter((d) => d.user.toString() === userId).length;
  }),
  find: jest.fn((query) => {
    const userId = query.user ? query.user.toString() : null;
    const matched = mockTradeDocs.filter((d) => d.user.toString() === userId);
    return {
      sort: () => ({
        lean: () => ({
          cursor: () => mockCreateAsyncCursor(matched),
        }),
      }),
    };
  }),
}));

const exportRouter = require('../../routes/export');
const errorHandler = require('../../middleware/errorHandler');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/export', exportRouter);
  app.use(errorHandler);
  return app;
};

describe('Bulk Export Rate Limiting & Row Cap Tests [MF-SEC-008]', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = { id: userAId, role: 'viewer' };
    mockIsAuthenticated = true;
    mockCountDocumentsOverride = null;
    delete process.env.DISABLE_RATE_LIMIT;
    app = createTestApp();
  });

  test('requires authentication (returns 401 when unauthenticated)', async () => {
    mockIsAuthenticated = false;
    const res = await request(app).get('/api/export/expenditures');
    expect(res.status).toBe(401);
  });

  test('exports expenditures in JSON streaming format scoped to authenticated user', async () => {
    const res = await request(app).get('/api/export/expenditures?format=json');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['content-disposition']).toBe('attachment; filename="expenditures-export.json"');

    const data = JSON.parse(res.text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].category).toBe('Groceries');
    // Verify IDOR protection: User B's record is NOT present
    expect(data.some((d) => d.category === 'Electronics')).toBe(false);
  });

  test('exports expenditures in CSV streaming format with correct headers and escaping', async () => {
    const res = await request(app).get('/api/export/expenditures?format=csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toBe('attachment; filename="expenditures-export.csv"');

    const lines = res.text.trim().split('\n');
    expect(lines[0]).toBe('id,date,category,transactionValue,transactionType,description,bank,cash,prepaid');
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('Groceries');
    expect(lines[1]).toContain('500');
  });

  test('exports trades in JSON streaming format', async () => {
    const res = await request(app).get('/api/export/trades');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['content-disposition']).toBe('attachment; filename="trades-export.json"');

    const data = JSON.parse(res.text);
    expect(data.length).toBe(1);
    expect(data[0].stockCode).toBe('COMI');
    expect(data[0].broker).toBe('Thndr');
  });

  test('exports trades in CSV streaming format', async () => {
    const res = await request(app).get('/api/export/trades?format=csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toBe('attachment; filename="trades-export.csv"');

    const lines = res.text.trim().split('\n');
    expect(lines[0]).toBe('id,date,broker,stockCode,type,quantity,price,totalCost,splitRatio');
    expect(lines[1]).toContain('COMI');
  });

  test('rejects queries exceeding 5,000 rows with 400 Bad Request [MF-SEC-008]', async () => {
    mockCountDocumentsOverride = 5001;

    const res = await request(app).get('/api/export/expenditures');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Export exceeds maximum limit of 5000 rows (found 5001)');
  });

  test('enforces rate limiting: 6th request within window returns 429 Too Many Requests', async () => {
    // Generate a fresh user ID so previous tests don't consume bucket quota
    const rateLimitedUserId = '507f1f77bcf86cd799439999';
    mockCurrentUser = { id: rateLimitedUserId, role: 'viewer' };

    // Requests 1 through 5 should succeed (status 200)
    for (let i = 1; i <= 5; i++) {
      const res = await request(app).get('/api/export/expenditures');
      expect(res.status).toBe(200);
    }

    // 6th request must trigger 429 Too Many Requests
    const res6 = await request(app).get('/api/export/expenditures');
    expect(res6.status).toBe(429);
    expect(res6.body.error).toContain('Too many export requests');
  });
});
