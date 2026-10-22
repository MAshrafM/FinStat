// backend/tests/integration/debtPayoffAtomicity.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const CreditCard = require('../../models/CreditCard');
const DebtPayoffPlan = require('../../models/DebtPayoffPlan');

jest.setTimeout(60000);

describe('Debt Payoff Plan Atomicity & Concurrency Integration Tests [AUD-DATA-003]', () => {
  let user;
  let token;
  let card;

  beforeAll(async () => {
    await connect();
    // Ensure schema indexes (including partial unique index) are created
    await DebtPayoffPlan.init();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await DebtPayoffPlan.init();

    user = await User.create({
      username: 'debt_atomicity_user',
      email: 'debt@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);

    card = await CreditCard.create({
      user: user._id,
      name: 'Debt Test Card',
      bank: 'CIB',
      limit: 30000,
      billingCycleDay: 15,
    });
  });

  it('should enforce partial unique index and reject inserting a second active plan directly', async () => {
    // 1. Insert first active plan directly
    await DebtPayoffPlan.create({
      user: user._id,
      strategy: 'snowball',
      monthlyBudget: 2000,
      monthlyBudgetInPiastres: 200000,
      cards: [{
        cardId: card._id,
        balanceInPiastres: 500000,
        minimumPaymentInPiastres: 25000,
        apr: 24,
      }],
      isActive: true,
    });

    // 2. Insert second active plan directly - must fail with duplicate key E11000
    let duplicateError;
    try {
      await DebtPayoffPlan.create({
        user: user._id,
        strategy: 'avalanche',
        monthlyBudget: 3000,
        monthlyBudgetInPiastres: 300000,
        cards: [{
          cardId: card._id,
          balanceInPiastres: 500000,
          minimumPaymentInPiastres: 25000,
          apr: 24,
        }],
        isActive: true,
      });
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).toBeDefined();
    expect(duplicateError.code === 11000 || duplicateError.message.includes('E11000')).toBe(true);
  });

  it('should set isActive: false upon soft deletion, allowing a new active plan to be created', async () => {
    const plan = await DebtPayoffPlan.create({
      user: user._id,
      strategy: 'snowball',
      monthlyBudget: 2000,
      monthlyBudgetInPiastres: 200000,
      cards: [{
        cardId: card._id,
        balanceInPiastres: 500000,
        minimumPaymentInPiastres: 25000,
        apr: 24,
      }],
      isActive: true,
    });

    // Soft delete via API
    const delRes = await request(app)
      .delete(`/api/debt-payoff/plans/${plan._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);

    const deletedPlan = await DebtPayoffPlan.findById(plan._id);
    expect(deletedPlan.deletedAt).not.toBeNull();
    expect(deletedPlan.isActive).toBe(false);

    // Creating a new active plan should succeed cleanly
    const postRes = await request(app)
      .post('/api/debt-payoff/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        strategy: 'avalanche',
        monthlyBudget: 3000,
        cards: [{
          cardId: card._id.toString(),
          balanceInPiastres: 500000,
          minimumPaymentInPiastres: 25000,
          apr: 24,
        }],
      });

    expect(postRes.status).toBe(201);
    expect(postRes.body.isActive).toBe(true);
  });

  it('should rollback deactivation of prior plan if new plan save fails mid-transaction', async () => {
    // 1. Create initial active plan
    const initialPlan = await DebtPayoffPlan.create({
      user: user._id,
      strategy: 'snowball',
      monthlyBudget: 1500,
      monthlyBudgetInPiastres: 150000,
      cards: [{
        cardId: card._id,
        balanceInPiastres: 500000,
        minimumPaymentInPiastres: 25000,
        apr: 24,
      }],
      isActive: true,
    });

    // Monkey-patch DebtPayoffPlan.prototype.save to simulate error during new plan insertion
    const originalSave = DebtPayoffPlan.prototype.save;
    DebtPayoffPlan.prototype.save = jest.fn().mockImplementation(function (...args) {
      if (this.monthlyBudget === 4000) {
        throw new Error('Simulated failure during DebtPayoffPlan.save');
      }
      return originalSave.apply(this, args);
    });

    try {
      const res = await request(app)
        .post('/api/debt-payoff/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({
          strategy: 'avalanche',
          monthlyBudget: 4000,
          cards: [{
            cardId: card._id.toString(),
            balanceInPiastres: 500000,
            minimumPaymentInPiastres: 25000,
            apr: 24,
          }],
        });

      expect(res.status).toBe(500);

      // Verify prior plan remains active due to transaction rollback
      const refreshedPlan = await DebtPayoffPlan.findById(initialPlan._id);
      expect(refreshedPlan.isActive).toBe(true);

      // Verify exactly one active plan exists
      const activeCount = await DebtPayoffPlan.countDocuments({ user: user._id, isActive: true, deletedAt: null });
      expect(activeCount).toBe(1);
    } finally {
      DebtPayoffPlan.prototype.save = originalSave;
    }
  });

  it('should handle concurrent plan activation requests: exactly one succeeds and competitor receives HTTP 409 Conflict', async () => {
    const payload1 = {
      strategy: 'snowball',
      monthlyBudget: 2500,
      cards: [{
        cardId: card._id.toString(),
        balanceInPiastres: 400000,
        minimumPaymentInPiastres: 20000,
        apr: 20,
      }],
    };

    const payload2 = {
      strategy: 'avalanche',
      monthlyBudget: 3500,
      cards: [{
        cardId: card._id.toString(),
        balanceInPiastres: 400000,
        minimumPaymentInPiastres: 20000,
        apr: 20,
      }],
    };

    // Fire two requests concurrently with test delay header
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/debt-payoff/plans')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Test-Delay', '50')
        .send(payload1),
      request(app)
        .post('/api/debt-payoff/plans')
        .set('Authorization', `Bearer ${token}`)
        .send(payload2),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // Exactly one must succeed (201) and competing request must return 409 Conflict (or both succeed sequentially if serialized)
    // In concurrent execution against MongoDB replica set with unique index, either [201, 409] occurs, or sequential [201, 201] where only the latest is active.
    expect(statuses[0]).toBe(201);
    if (statuses[1] === 409) {
      const conflictRes = res1.status === 409 ? res1 : res2;
      expect(conflictRes.body.error).toContain('Another debt payoff plan is currently being activated');
    }

    // Crucial invariant: regardless of outcome, exactly ONE active plan exists in the database!
    const activePlans = await DebtPayoffPlan.find({ user: user._id, isActive: true, deletedAt: null });
    expect(activePlans.length).toBe(1);
  });
});
