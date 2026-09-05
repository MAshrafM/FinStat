// backend/tests/integration/categorizationRulesApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const CategorizationRule = require('../../models/CategorizationRule');

jest.setTimeout(60000);

describe('Categorization Rules API Integration Tests', () => {
  let testUser, viewerUser;
  let userToken, viewerToken;

  beforeAll(async () => {
    await connectDB();

    const usernames = ['rules_test_user', 'rules_test_viewer'];
    const existingUsers = await User.find({ username: { $in: usernames } });
    const userIds = existingUsers.map((u) => u._id);
    if (userIds.length > 0) {
      await CategorizationRule.deleteMany({ user: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
    }

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testUser = await User.create({
      username: 'rules_test_user',
      email: 'rules_user@finstat.io',
      password: hashedPassword,
      role: 'manager',
      managedBy: null,
    });

    viewerUser = await User.create({
      username: 'rules_test_viewer',
      email: 'rules_viewer@finstat.io',
      password: hashedPassword,
      role: 'viewer',
      managedBy: testUser._id,
    });

    userToken = jwt.sign(
      { user: { id: testUser._id.toString(), role: testUser.role } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      {
        user: {
          id: viewerUser._id.toString(),
          role: viewerUser.role,
          managedBy: testUser._id.toString(),
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (testUser) {
      await CategorizationRule.deleteMany({ user: testUser._id });
      await User.deleteMany({ _id: { $in: [testUser._id, viewerUser._id] } });
    }
    await mongoose.connection.close();
  });

  test('POST /api/categorization-rules/test evaluates sample text against rule spec', async () => {
    const res = await request(app)
      .post('/api/categorization-rules/test')
      .set('x-auth-token', userToken)
      .send({
        operator: 'contains',
        value: 'amazon',
        category: 'Shopping & Leisure',
        sampleText: 'Payment for Amazon order',
      });

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(true);
    expect(res.body.category).toBe('Shopping & Leisure');
  });

  test('POST /api/categorization-rules creates rule, denies viewer modification', async () => {
    // Viewer should be blocked
    const viewerRes = await request(app)
      .post('/api/categorization-rules')
      .set('x-auth-token', viewerToken)
      .send({
        name: 'Amazon Rule',
        field: 'description',
        operator: 'contains',
        value: 'amazon',
        category: 'Shopping & Leisure',
        priority: 5,
      });
    expect(viewerRes.status).toBe(403);

    // Manager succeeds
    const res = await request(app)
      .post('/api/categorization-rules')
      .set('x-auth-token', userToken)
      .send({
        name: 'Amazon Rule',
        field: 'description',
        operator: 'contains',
        value: 'amazon',
        category: 'Shopping & Leisure',
        priority: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Amazon Rule');
    expect(res.body.priority).toBe(5);
  });

  test('GET /api/categorization-rules lists rules sorted by priority', async () => {
    // Add another rule with higher priority
    await request(app)
      .post('/api/categorization-rules')
      .set('x-auth-token', userToken)
      .send({
        name: 'High Priority Rule',
        field: 'description',
        operator: 'startsWith',
        value: 'Netflix',
        category: 'Shopping & Leisure',
        priority: 10,
      });

    const res = await request(app)
      .get('/api/categorization-rules')
      .set('x-auth-token', userToken);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].priority).toBe(10);
    expect(res.body.data[1].priority).toBe(5);
  });

  test('PUT and DELETE /api/categorization-rules/:id works with soft delete', async () => {
    const listRes = await request(app)
      .get('/api/categorization-rules')
      .set('x-auth-token', userToken);
    const ruleId = listRes.body.data[0]._id;

    // PUT
    const putRes = await request(app)
      .put(`/api/categorization-rules/${ruleId}`)
      .set('x-auth-token', userToken)
      .send({ priority: 20 });
    expect(putRes.status).toBe(200);
    expect(putRes.body.priority).toBe(20);

    // DELETE
    const delRes = await request(app)
      .delete(`/api/categorization-rules/${ruleId}`)
      .set('x-auth-token', userToken);
    expect(delRes.status).toBe(200);

    // Verify soft deleted
    const verifyRes = await request(app)
      .get(`/api/categorization-rules/${ruleId}`)
      .set('x-auth-token', userToken);
    expect(verifyRes.status).toBe(404);
  });
});
