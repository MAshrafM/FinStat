const request = require('supertest');
const mongoose = require('mongoose');
const http = require('http');
const testDb = require('../helpers/testDb');
const app = require('../../server');
const packageJson = require('../../package.json');

jest.setTimeout(60000);

describe('Step 5A.1: [AUD-OPS-003] Health Check & Graceful Shutdown', () => {
  beforeAll(async () => {
    await testDb.connect();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('GET /api/health', () => {
    it('returns HTTP 200 with status UP and db connected when MongoDB is active', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'UP',
        db: 'connected',
        version: packageJson.version,
      });
      expect(typeof res.body.uptime).toBe('number');
      expect(typeof res.body.timestamp).toBe('string');
      expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('is accessible without any authentication tokens', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('returns HTTP 503 with status DOWN when database is disconnected', async () => {
      // Disconnect mongoose temporarily
      await mongoose.disconnect();

      try {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(503);
        expect(res.body).toMatchObject({
          status: 'DOWN',
          db: 'disconnected',
        });
      } finally {
        // Reconnect test database for subsequent tests
        await testDb.connect();
      }
    });
  });

  describe('gracefulShutdown', () => {
    it('gracefully closes the HTTP server and Mongoose connection without hanging', async () => {
      expect(typeof app.gracefulShutdown).toBe('function');

      // Create an ephemeral test HTTP server
      const testServer = http.createServer(app);
      await new Promise((resolve) => testServer.listen(0, resolve));
      expect(testServer.listening).toBe(true);

      // Invoke graceful shutdown with exitProcess: false to test in-process
      await app.gracefulShutdown('SIGTERM', {
        server: testServer,
        mongooseInstance: mongoose,
        timeoutMs: 3000,
        exitProcess: false,
      });

      expect(testServer.listening).toBe(false);
      expect(mongoose.connection.readyState).toBe(0);

      // Reconnect test DB for subsequent teardown
      await testDb.connect();
    });

    it('triggers timeout handling when an operation hangs during shutdown', async () => {
      expect(typeof app.gracefulShutdown).toBe('function');

      // Mock server whose close callback never resolves
      const hangingServer = {
        close: jest.fn(() => {
          // Never invoke callback to simulate hanging in-flight connection
        }),
      };

      const onTimeoutMock = jest.fn();

      await app.gracefulShutdown('SIGINT', {
        server: hangingServer,
        mongooseInstance: mongoose,
        timeoutMs: 150,
        exitProcess: false,
        onTimeout: onTimeoutMock,
      });

      // Wait a moment for the unref timeout to execute
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onTimeoutMock).toHaveBeenCalledTimes(1);

      // Ensure test DB is connected
      if (mongoose.connection.readyState === 0) {
        await testDb.connect();
      }
    });
  });
});
