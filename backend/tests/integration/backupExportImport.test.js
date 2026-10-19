// backend/tests/integration/backupExportImport.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { EJSON } = require('bson');

const errorHandler = require('../../middleware/errorHandler');

const adminUserId = '507f1f77bcf86cd799439001';
const managerUserId = '507f1f77bcf86cd799439002';
let mockCurrentRole = 'admin';
let mockCurrentUserId = adminUserId;

// Mock auth middleware dynamic to mockCurrentRole
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: mockCurrentUserId, role: mockCurrentRole };
  req.effectiveUserId = mockCurrentUserId;
  req.canModify = true;
  next();
});

const backupRouter = require('../../routes/backup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/backup', backupRouter);
  app.use(errorHandler);
  return app;
};

describe('Backup Export & Import Integration Tests [MF-SEC-006]', () => {
  let app;
  let mockCollections = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentRole = 'admin';
    mockCurrentUserId = adminUserId;
    delete process.env.VERCEL;
    process.env.NODE_ENV = 'test';

    // Mock MongoDB driver methods on mongoose.connection.db
    mockCollections = {
      expenditures: [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          user: new mongoose.Types.ObjectId(adminUserId),
          description: 'Groceries',
          date: new Date('2026-10-18T10:00:00.000Z'),
          transactionValue: 500,
        },
      ],
      trades: [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
          user: new mongoose.Types.ObjectId(adminUserId),
          stockCode: 'COMI',
          quantity: 100,
          date: new Date('2026-10-17T12:00:00.000Z'),
        },
      ],
      users: [
        {
          _id: new mongoose.Types.ObjectId(adminUserId),
          username: 'adminuser',
          role: 'admin',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      refreshtokens: [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439033'),
          tokenHash: 'secret_hash_value',
        },
      ],
      loginaudits: [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439044'),
          action: 'login',
        },
      ],
    };

    mongoose.connection.db = {
      collection: jest.fn((name) => {
        const lowerName = name.toLowerCase();
        if (!mockCollections[lowerName]) {
          mockCollections[lowerName] = [];
        }
        return {
          countDocuments: jest.fn().mockImplementation(() => Promise.resolve(mockCollections[lowerName].length)),
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockImplementation(() => Promise.resolve([...mockCollections[lowerName]])),
          }),
          deleteMany: jest.fn().mockImplementation(() => {
            mockCollections[lowerName] = [];
            return Promise.resolve({ acknowledged: true, deletedCount: 1 });
          }),
          insertMany: jest.fn().mockImplementation((docs) => {
            mockCollections[lowerName].push(...docs);
            return Promise.resolve({ acknowledged: true, insertedCount: docs.length });
          }),
          indexes: jest.fn().mockResolvedValue([
            { name: '_id_', key: { _id: 1 } },
            { name: 'user_1_date_-1', key: { user: 1, date: -1 } },
          ]),
          createIndex: jest.fn().mockResolvedValue('user_1_date_-1'),
          rename: jest.fn().mockResolvedValue(true),
          drop: jest.fn().mockResolvedValue(true),
        };
      }),
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { name: 'expenditures' },
          { name: 'trades' },
        ]),
      }),
      admin: jest.fn().mockReturnValue({
        command: jest.fn().mockResolvedValue({ hello: 1, setName: 'rs0' }),
      }),
    };

    mongoose.startSession = jest.fn().mockResolvedValue({
      withTransaction: jest.fn().mockImplementation(async (cb) => {
        return await cb();
      }),
      endSession: jest.fn().mockResolvedValue(true),
    });

    app = createTestApp();
  });

  describe('GET /api/admin/backup/status', () => {
    it('returns importAvailable: true in non-production environment', async () => {
      const res = await request(app).get('/api/admin/backup/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.importAvailable).toBe(true);
    });

    it('returns 403 Forbidden for non-admin role', async () => {
      mockCurrentRole = 'manager';
      const res = await request(app).get('/api/admin/backup/status');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/backup/export', () => {
    it('exports EJSON backup with whitelisted collections and excludes refreshtokens and loginaudits', async () => {
      const res = await request(app).get('/api/admin/backup/export?format=json');
      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('application/json');
      expect(res.header['content-disposition']).toContain('attachment; filename="finstat-backup-');

      const parsed = EJSON.parse(res.text);
      expect(parsed.version).toBe(1);
      expect(parsed.data).toBeDefined();
      expect(parsed.data.expenditures).toBeDefined();
      expect(parsed.data.trades).toBeDefined();
      expect(parsed.data.users).toBeDefined();

      // Blocked collections must never appear in export
      expect(parsed.data.refreshtokens).toBeUndefined();
      expect(parsed.data.loginaudits).toBeUndefined();
    });

    it('exports XLSX multi-sheet buffer when format=xlsx is requested', async () => {
      const res = await request(app).get('/api/admin/backup/export?format=xlsx');
      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('spreadsheetml.sheet');
      expect(res.header['content-disposition']).toContain('.xlsx');
      expect(res.body).toBeDefined();
    });

    it('blocks non-admin users with 403 Forbidden', async () => {
      mockCurrentRole = 'manager';
      const res = await request(app).get('/api/admin/backup/export');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/backup/import', () => {
    it('returns 501 Not Implemented in production environment', async () => {
      process.env.NODE_ENV = 'production';
      const validPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { expenditures: [] },
      };

      const res = await request(app)
        .post('/api/admin/backup/import')
        .attach('backup', Buffer.from(JSON.stringify(validPayload)), 'backup.json');

      expect(res.status).toBe(501);
      expect(res.body.message).toContain('development only');
    });

    it('returns 501 Not Implemented if VERCEL env var is set', async () => {
      process.env.VERCEL = '1';
      const validPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { expenditures: [] },
      };

      const res = await request(app)
        .post('/api/admin/backup/import')
        .attach('backup', Buffer.from(JSON.stringify(validPayload)), 'backup.json');

      expect(res.status).toBe(501);
    });

    it('rejects non-EJSON files (e.g. uploaded XLSX binary) with helpful 400 error', async () => {
      const fakeXlsxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK zip header

      const res = await request(app)
        .post('/api/admin/backup/import')
        .attach('backup', fakeXlsxBuffer, 'backup.xlsx');

      expect(res.status).toBe(400);
      expect(res.body.msg || res.body.message).toContain('Import requires EJSON format');
    });

    it('rejects backup files containing blocked collections (refreshtokens)', async () => {
      const maliciousPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          expenditures: [],
          refreshtokens: [{ tokenHash: 'evil' }],
        },
      };

      const res = await request(app)
        .post('/api/admin/backup/import')
        .attach('backup', Buffer.from(JSON.stringify(maliciousPayload)), 'backup.json');

      expect(res.status).toBe(400);
      expect(res.body.msg || res.body.message).toContain('blocked collection: "refreshtokens"');
    });

    it('rejects backup files containing unknown collections', async () => {
      const unknownPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          unknown_custom_collection: [{ foo: 'bar' }],
        },
      };

      const res = await request(app)
        .post('/api/admin/backup/import')
        .attach('backup', Buffer.from(JSON.stringify(unknownPayload)), 'backup.json');

      expect(res.status).toBe(400);
      expect(res.body.msg || res.body.message).toContain('Unknown collection in backup');
    });

    it('normalizes uppercase collection names and writes strictly to lowercase collections', async () => {
      const casingPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          Expenditures: [
            {
              _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439055'),
              description: 'Normalized spend',
            },
          ],
        },
      };

      const res = await request(app)
        .post('/api/admin/backup/import')
        .attach('backup', Buffer.from(EJSON.stringify(casingPayload, { relaxed: false })), 'backup.json');

      expect(res.status).toBe(200);
      expect(res.body.collections.expenditures).toBeDefined();
      expect(mongoose.connection.db.collection).toHaveBeenCalledWith('expenditures');
      expect(mongoose.connection.db.collection).not.toHaveBeenCalledWith('Expenditures');
    });

    it('supports dry-run mode reporting willDelete and willInsert without modifying DB', async () => {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          expenditures: [{ _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439066'), transactionValue: 100 }],
        },
      };

      const res = await request(app)
        .post('/api/admin/backup/import?dryRun=true')
        .attach('backup', Buffer.from(EJSON.stringify(payload, { relaxed: false })), 'backup.json');

      expect(res.status).toBe(200);
      expect(res.body.dryRun).toBe(true);
      expect(res.body.collections.expenditures).toEqual({
        willDelete: 1,
        willInsert: 1,
      });
      // In dry-run, startSession/withTransaction is not invoked
      expect(mongoose.startSession).not.toHaveBeenCalled();
    });

    it('skips users collection when allowUsers is not set to true', async () => {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          users: [{ _id: new mongoose.Types.ObjectId(adminUserId), username: 'restored' }],
          expenditures: [{ _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439077') }],
        },
      };

      const res = await request(app)
        .post('/api/admin/backup/import')
        .attach('backup', Buffer.from(EJSON.stringify(payload, { relaxed: false })), 'backup.json');

      expect(res.status).toBe(200);
      expect(res.body.collections.users).toBeUndefined();
      expect(res.body.collections.expenditures).toBeDefined();
    });

    it('restores users collection when allowUsers=true is explicitly set', async () => {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          users: [{ _id: new mongoose.Types.ObjectId(adminUserId), username: 'restored' }],
        },
      };

      const res = await request(app)
        .post('/api/admin/backup/import?allowUsers=true')
        .attach('backup', Buffer.from(EJSON.stringify(payload, { relaxed: false })), 'backup.json');

      expect(res.status).toBe(200);
      expect(res.body.collections.users).toBeDefined();
    });

    it('round-trip: export -> import restores exact BSON types (ObjectIds, Dates)', async () => {
      const originalDoc = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439088'),
        user: new mongoose.Types.ObjectId(adminUserId),
        description: 'Round-trip test',
        date: new Date('2026-10-18T14:30:00.000Z'),
        amount: 1250.75,
        isActive: true,
      };

      mockCollections.expenditures = [originalDoc];

      // 1. Export
      const exportRes = await request(app).get('/api/admin/backup/export?format=json');
      expect(exportRes.status).toBe(200);
      const exportedEjson = exportRes.text;

      // 2. Clear collection
      mockCollections.expenditures = [];

      // 3. Import
      const importRes = await request(app)
        .post('/api/admin/backup/import')
        .attach('backup', Buffer.from(exportedEjson), 'backup.json');

      expect(importRes.status).toBe(200);

      // 4. Assert round-trip data equality using EJSON string comparison
      const restoredDocs = mockCollections.expenditures;
      expect(restoredDocs.length).toBe(1);

      const normalizedOriginal = EJSON.stringify(originalDoc, { relaxed: false });
      const normalizedRestored = EJSON.stringify(restoredDocs[0], { relaxed: false });

      expect(normalizedRestored).toBe(normalizedOriginal);
      expect(restoredDocs[0]._id instanceof mongoose.Types.ObjectId).toBe(true);
      expect(restoredDocs[0].date instanceof Date).toBe(true);
    });
  });
});
