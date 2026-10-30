// backend/tests/integration/exportStreamingBehavior.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const testUserId = '507f1f77bcf86cd799439001';
let mockCurrentUser = { id: testUserId, role: 'viewer' };
let mockIsAuthenticated = true;
let mockCountDocumentsOverride = null;

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

// Mock Expenditure & Trade models with cursor streaming
const mockExpenditures = [
  {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    user: new mongoose.Types.ObjectId(testUserId),
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
    user: new mongoose.Types.ObjectId(testUserId),
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

async function* mockCreateAsyncCursor(docs) {
  for (const doc of docs) {
    yield doc;
  }
}

jest.mock('../../models/Expenditure', () => ({
  countDocuments: jest.fn(async (query) => {
    if (mockCountDocumentsOverride !== null) return mockCountDocumentsOverride;
    return mockExpenditures.length;
  }),
  find: jest.fn(() => ({
    sort: () => ({
      lean: () => ({
        cursor: () => mockCreateAsyncCursor(mockExpenditures),
      }),
    }),
  })),
}));

jest.mock('../../models/Trade', () => ({
  countDocuments: jest.fn(async () => {
    if (mockCountDocumentsOverride !== null) return mockCountDocumentsOverride;
    return 0;
  }),
  find: jest.fn(() => ({
    sort: () => ({
      lean: () => ({
        cursor: () => mockCreateAsyncCursor([]),
      }),
    }),
  })),
}));

const exportRouter = require('../../routes/export');
const errorHandler = require('../../middleware/errorHandler');

describe('Bulk Export Streaming Behavior Tests [AUD-PERF-004]', () => {
  let app;
  let writeCalls = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = { id: testUserId, role: 'viewer' };
    mockIsAuthenticated = true;
    mockCountDocumentsOverride = null;
    writeCalls = 0;

    app = express();
    app.use(express.json());
    // Interpose spy middleware before route handler to intercept chunked streaming
    app.use((req, res, next) => {
      const origWrite = res.write.bind(res);
      res.write = (chunk, ...args) => {
        writeCalls++;
        return origWrite(chunk, ...args);
      };
      next();
    });
    app.use('/api/export', exportRouter);
    app.use(errorHandler);
  });

  test('streams CSV export chunk-by-chunk using cursor and res.write without buffering', async () => {
    const res = await request(app).get('/api/export/expenditures?format=csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    // Header row + 2 data rows = at least 3 write calls
    expect(writeCalls).toBeGreaterThanOrEqual(3);
    expect(res.text).toContain('Weekly grocery run');
    expect(res.text).toContain('Headphones');
  });

  test('rejects export requests exceeding MAX_EXPORT_ROWS (10,000) with HTTP 400 Bad Request', async () => {
    mockCountDocumentsOverride = 10001;

    const res = await request(app).get('/api/export/expenditures');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Export exceeds maximum limit of 10000 rows (found 10001)');
  });
});

