const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Category = require('../../models/Category');
const Expenditure = require('../../models/Expenditure');
const categoriesRouter = require('../../routes/categories');

jest.setTimeout(60000);

describe('Step 4D.2: [MF-DEF-008] Categories API & Deletion Guard Tests', () => {
  let managerUser;
  let managerToken;
  let viewerUser;
  let viewerToken;

  beforeAll(async () => {
    await connectDB();

    // Seed system categories
    await categoriesRouter.seedSystemCategories();

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const uniqueSuffix = Date.now();

    managerUser = await User.create({
      username: `cat_mgr_${uniqueSuffix}`,
      email: `cat_mgr_${uniqueSuffix}@finstat.io`,
      password: hashedPassword,
      role: 'manager',
    });

    viewerUser = await User.create({
      username: `cat_vwr_${uniqueSuffix}`,
      email: `cat_vwr_${uniqueSuffix}@finstat.io`,
      password: hashedPassword,
      role: 'viewer',
      managedBy: managerUser._id,
    });

    managerToken = jwt.sign(
      { user: { id: managerUser._id.toString(), role: managerUser.role } },
      process.env.JWT_SECRET || 'testsecret1234567890123456789012',
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      { user: { id: viewerUser._id.toString(), role: viewerUser.role, managedBy: managerUser._id.toString() } },
      process.env.JWT_SECRET || 'testsecret1234567890123456789012',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (managerUser) {
      await Category.deleteMany({ user: managerUser._id });
      await Expenditure.deleteMany({ user: managerUser._id });
      await User.deleteOne({ _id: managerUser._id });
    }
    if (viewerUser) {
      await User.deleteOne({ _id: viewerUser._id });
    }
    await mongoose.connection.close();
  });

  test('GET /api/categories returns system categories for all authenticated users including viewers', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('x-auth-token', viewerToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(12);

    const systemCategory = res.body.data.find((c) => c.name === 'Food & Dining');
    expect(systemCategory).toBeTruthy();
    expect(systemCategory.isSystem).toBe(true);
  });

  test('DELETE /api/categories/:id rejects deleting system categories with HTTP 400 Bad Request', async () => {
    const systemCategory = await Category.findOne({ isSystem: true, deletedAt: null });
    expect(systemCategory).toBeTruthy();

    const res = await request(app)
      .delete(`/api/categories/${systemCategory._id}`)
      .set('x-auth-token', managerToken);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/System categories cannot be deleted/i);

    // Verify system category was not deleted
    const checkCat = await Category.findById(systemCategory._id);
    expect(checkCat.deletedAt).toBeNull();
  });

  test('POST /api/categories creates custom category and DELETE /api/categories/:id soft-deletes it', async () => {
    // 1. Create custom category
    const createRes = await request(app)
      .post('/api/categories')
      .set('x-auth-token', managerToken)
      .send({
        name: 'Pet Care',
        color: '#A855F7',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.name).toBe('Pet Care');
    expect(createRes.body.data.isSystem).toBe(false);
    expect(createRes.body.data.user.toString()).toBe(managerUser._id.toString());

    const createdId = createRes.body.data._id;

    // 2. Soft delete custom category
    const deleteRes = await request(app)
      .delete(`/api/categories/${createdId}`)
      .set('x-auth-token', managerToken);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.message).toMatch(/deleted successfully/i);

    // Verify soft-deleted
    const deletedCat = await Category.findById(createdId);
    expect(deletedCat.deletedAt).toBeTruthy();

    // Verify it no longer appears in GET /api/categories
    const listRes = await request(app)
      .get('/api/categories')
      .set('x-auth-token', managerToken);

    expect(listRes.body.data.some((c) => c._id === createdId)).toBe(false);
  });

  test('POST /api/categories rejects duplicate category name with HTTP 409 Conflict', async () => {
    // Attempt to create a category that matches an existing system category
    const dupSystemRes = await request(app)
      .post('/api/categories')
      .set('x-auth-token', managerToken)
      .send({
        name: 'groceries', // case-insensitive match for system 'Groceries'
      });

    expect(dupSystemRes.status).toBe(409);
    expect(dupSystemRes.body.success).toBe(false);
    expect(dupSystemRes.body.message).toMatch(/already exists/i);

    // Create unique custom category
    const firstRes = await request(app)
      .post('/api/categories')
      .set('x-auth-token', managerToken)
      .send({
        name: 'Home Gardening',
        color: '#22C55E',
      });
    expect(firstRes.status).toBe(201);

    // Attempt duplicate of the custom category
    const dupCustomRes = await request(app)
      .post('/api/categories')
      .set('x-auth-token', managerToken)
      .send({
        name: 'home gardening',
      });

    expect(dupCustomRes.status).toBe(409);
    expect(dupCustomRes.body.success).toBe(false);
    expect(dupCustomRes.body.message).toMatch(/already exists/i);
  });

  test('POST and DELETE /api/categories reject viewer role with HTTP 403 Forbidden', async () => {
    const postRes = await request(app)
      .post('/api/categories')
      .set('x-auth-token', viewerToken)
      .send({
        name: 'Viewer Category',
      });

    expect(postRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/categories/507f1f77bcf86cd799439011`)
      .set('x-auth-token', viewerToken);

    expect(deleteRes.status).toBe(403);
  });

  test('Expenditure model maintains [String] categories array compatibility without breaking errors', async () => {
    const expenditure = await Expenditure.create({
      user: managerUser._id,
      date: new Date(),
      transactionType: 'W',
      transactionValue: 250,
      bank: 250,
      description: 'Test Groceries',
      categories: ['Groceries', 'Food & Dining'],
      paymentMethod: 'Bank',
    });

    expect(expenditure._id).toBeTruthy();
    expect(Array.isArray(expenditure.categories)).toBe(true);
    expect(expenditure.categories).toEqual(['Groceries', 'Food & Dining']);

    const queried = await Expenditure.findById(expenditure._id);
    expect(queried.categories).toContain('Groceries');
  });
});
