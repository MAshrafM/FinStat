// backend/tests/integration/dataIntegrityAndSoftDelete.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Certificate = require('../../models/Certificate');
const CreditCard = require('../../models/CreditCard');
const Expenditure = require('../../models/Expenditure');
const Gold = require('../../models/Gold');
const Paycheck = require('../../models/Paycheck');
const MutualFundTrade = require('../../models/MutualFundTrade');
const Trade = require('../../models/Trade');
const Currency = require('../../models/Currency');
const SocialInsurance = require('../../models/SocialInsurance');
const SalaryProfile = require('../../models/SalaryProfile');

jest.setTimeout(60000);

describe('Data Integrity, Piastre Conversions & Soft Delete System (Integration Tests)', () => {
  let managerUser, viewerUser;
  let managerToken, viewerToken;

  beforeAll(async () => {
    await connectDB();

    // Drop any legacy global index on year in SocialInsurance if present
    try {
      await SocialInsurance.collection.dropIndex('year_1');
    } catch (e) {
      // index might not exist
    }

    const testUsernames = ['integrity_test_mgr', 'integrity_test_vwr'];
    const existingUsers = await User.find({ username: { $in: testUsernames } });
    const existingIds = existingUsers.map((u) => u._id);
    if (existingIds.length > 0) {
      await Promise.all([
        Certificate.deleteMany({ user: { $in: existingIds } }),
        CreditCard.deleteMany({ user: { $in: existingIds } }),
        Expenditure.deleteMany({ user: { $in: existingIds } }),
        Gold.deleteMany({ user: { $in: existingIds } }),
        Paycheck.deleteMany({ user: { $in: existingIds } }),
        MutualFundTrade.deleteMany({ user: { $in: existingIds } }),
        Trade.deleteMany({ user: { $in: existingIds } }),
        Currency.deleteMany({ user: { $in: existingIds } }),
        SocialInsurance.deleteMany({ user: { $in: existingIds } }),
        SalaryProfile.deleteMany({ user: { $in: existingIds } }),
        User.deleteMany({ _id: { $in: existingIds } }),
      ]);
    }

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    managerUser = await User.create({
      username: 'integrity_test_mgr',
      email: 'integrity_mgr@finstat.io',
      password: hashedPassword,
      role: 'manager',
      managedBy: null,
    });

    viewerUser = await User.create({
      username: 'integrity_test_vwr',
      email: 'integrity_vwr@finstat.io',
      password: hashedPassword,
      role: 'viewer',
      managedBy: managerUser._id,
    });

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    managerToken = jwt.sign(
      {
        user: {
          id: managerUser._id.toString(),
          role: managerUser.role,
          effectiveUserId: managerUser._id.toString(),
          canModify: true,
        },
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      {
        user: {
          id: viewerUser._id.toString(),
          role: viewerUser.role,
          effectiveUserId: managerUser._id.toString(),
          canModify: false,
        },
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (managerUser?._id) {
      const userIds = [managerUser._id, viewerUser._id];
      await Promise.all([
        Certificate.deleteMany({ user: { $in: userIds } }),
        CreditCard.deleteMany({ user: { $in: userIds } }),
        Expenditure.deleteMany({ user: { $in: userIds } }),
        Gold.deleteMany({ user: { $in: userIds } }),
        Paycheck.deleteMany({ user: { $in: userIds } }),
        MutualFundTrade.deleteMany({ user: { $in: userIds } }),
        Trade.deleteMany({ user: { $in: userIds } }),
        Currency.deleteMany({ user: { $in: userIds } }),
        SocialInsurance.deleteMany({ user: { $in: userIds } }),
        SalaryProfile.deleteMany({ user: { $in: userIds } }),
        User.deleteMany({ _id: { $in: userIds } }),
      ]);
    }
    await mongoose.connection.close();
  });

  // 1. Certificate Module
  describe('Certificate: Piastres & Soft Delete Lifecycle', () => {
    let certId;

    it('should create certificate and store amountInPiastres correctly', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'NBE Platinum 3Y',
          amount: 50000.75,
          interest: 21.5,
          period: 36,
          startDate: '2026-01-01',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.amount).toBe(50000.75);
      expect(res.body.amountInPiastres).toBe(5000075);
      certId = res.body._id;

      const doc = await Certificate.findById(certId);
      expect(doc.amountInPiastres).toBe(5000075);
      expect(doc.deletedAt).toBeNull();
    });

    it('should prevent viewer from deleting certificate', async () => {
      const res = await request(app)
        .delete(`/api/certificates/${certId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('should soft delete certificate and exclude from active list', async () => {
      const delRes = await request(app)
        .delete(`/api/certificates/${certId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      // Verify not returned in active list
      const listRes = await request(app)
        .get('/api/certificates')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.some((c) => c._id === certId)).toBe(false);

      // Verify DB record still exists with deletedAt set
      const doc = await Certificate.findById(certId);
      expect(doc).not.toBeNull();
      expect(doc.deletedAt).not.toBeNull();
    });

    it('should prevent viewer from restoring certificate', async () => {
      const res = await request(app)
        .post(`/api/certificates/${certId}/restore`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('should restore certificate and include back in active list', async () => {
      const restoreRes = await request(app)
        .post(`/api/certificates/${certId}/restore`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/certificates')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.some((c) => c._id === certId)).toBe(true);

      const doc = await Certificate.findById(certId);
      expect(doc.deletedAt).toBeNull();
    });
  });

  // 2. Credit Card Module
  describe('CreditCard: Piastres & Soft Delete Lifecycle', () => {
    let cardId;

    it('should create credit card and store limitInPiastres correctly', async () => {
      const res = await request(app)
        .post('/api/credit-cards/cards')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'CIB Titanium Card',
          bank: 'CIB',
          limit: 35000.5,
          billingCycleDay: 15,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.limit).toBe(35000.5);
      expect(res.body.limitInPiastres).toBe(3500050);
      cardId = res.body._id;
    });

    it('should soft delete credit card and exclude from active list', async () => {
      const delRes = await request(app)
        .delete(`/api/credit-cards/cards/${cardId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/credit-cards/cards')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.some((c) => c._id === cardId)).toBe(false);
    });

    it('should restore credit card successfully', async () => {
      const restoreRes = await request(app)
        .post(`/api/credit-cards/cards/${cardId}/restore`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/credit-cards/cards')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.some((c) => c._id === cardId)).toBe(true);
    });
  });

  // 3. Gold Asset Module
  describe('Gold: Piastres & Soft Delete Lifecycle', () => {
    let goldId;

    it('should create gold asset and store priceInPiastres and paidInPiastres', async () => {
      const res = await request(app)
        .post('/api/golds')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2026-08-01',
          item: 'Gold Ingot 24K',
          karat: 24,
          weight: 10,
          price: 3250.25,
          paid: 32502.5,
          status: 'hold',
          seller: 'BTC Egypt',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.priceInPiastres).toBe(325025);
      expect(res.body.paidInPiastres).toBe(3250250);
      goldId = res.body._id;
    });

    it('should soft delete gold asset and exclude from active list', async () => {
      const delRes = await request(app)
        .delete(`/api/golds/${goldId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/golds')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.data.some((g) => g._id === goldId)).toBe(false);
    });

    it('should restore gold asset successfully', async () => {
      const restoreRes = await request(app)
        .post(`/api/golds/${goldId}/restore`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/golds')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.data.some((g) => g._id === goldId)).toBe(true);
    });
  });

  // 4. Paycheck Module
  describe('Paycheck: Piastres & Soft Delete Lifecycle', () => {
    let paycheckId;

    it('should create paycheck and store all deduction and gross piastres', async () => {
      const res = await request(app)
        .post('/api/paychecks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          month: '2026-08',
          type: 'Cash',
          date: '2026-08-25',
          grossAmount: 40000.5,
          insuranceDeduction: 2000.25,
          taxDeduction: 3000.25,
          amount: 35000,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.amountInPiastres).toBe(3500000);
      expect(res.body.grossAmountInPiastres).toBe(4000050);
      expect(res.body.insuranceDeductionInPiastres).toBe(200025);
      expect(res.body.taxDeductionInPiastres).toBe(300025);
      paycheckId = res.body._id;
    });

    it('should soft delete and restore paycheck', async () => {
      const delRes = await request(app)
        .delete(`/api/paychecks/${paycheckId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/paychecks')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.data.some((p) => p._id === paycheckId)).toBe(false);

      const restoreRes = await request(app)
        .post(`/api/paychecks/${paycheckId}/restore`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listAfterRes = await request(app)
        .get('/api/paychecks')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listAfterRes.body.data.some((p) => p._id === paycheckId)).toBe(true);
    });
  });

  // 5. Stock Trade Module
  describe('Stock Trade: Piastres & Soft Delete Lifecycle', () => {
    let tradeId;

    it('should create stock trade with priceInPiastres and feesInPiastres', async () => {
      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          stockCode: 'COMI',
          broker: 'Thndr',
          type: 'Buy',
          shares: 100,
          price: 85.5,
          fees: 25.5,
          totalValue: 8575.5,
          date: '2026-08-10',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.priceInPiastres).toBe(8550);
      expect(res.body.feesInPiastres).toBe(2550);
      expect(res.body.totalValueInPiastres).toBe(857550);
      tradeId = res.body._id;
    });

    it('should soft delete and restore stock trade', async () => {
      const delRes = await request(app)
        .delete(`/api/trades/${tradeId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.data.some((t) => t._id === tradeId)).toBe(false);

      const restoreRes = await request(app)
        .post(`/api/trades/${tradeId}/restore`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listAfterRes = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listAfterRes.body.data.some((t) => t._id === tradeId)).toBe(true);
    });
  });

  // 6. Mutual Fund Module
  describe('Mutual Fund Trade: Piastres & Soft Delete Lifecycle', () => {
    let mfTradeId;

    it('should create mutual fund trade and store piastre fields', async () => {
      const res = await request(app)
        .post('/api/mutual-funds')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Misr Equity Fund',
          code: 'MEF',
          type: 'Buy',
          units: 50,
          price: 120.4,
          fees: 15.2,
          totalValue: 6035.2,
          date: '2026-08-12',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.priceInPiastres).toBe(12040);
      expect(res.body.feesInPiastres).toBe(1520);
      expect(res.body.totalValueInPiastres).toBe(603520);
      mfTradeId = res.body._id;
    });

    it('should soft delete and restore mutual fund trade', async () => {
      const delRes = await request(app)
        .delete(`/api/mutual-funds/${mfTradeId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/mutual-funds')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.data.some((m) => m._id === mfTradeId)).toBe(false);

      const restoreRes = await request(app)
        .post(`/api/mutual-funds/${mfTradeId}/restore`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listAfterRes = await request(app)
        .get('/api/mutual-funds')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listAfterRes.body.data.some((m) => m._id === mfTradeId)).toBe(true);
    });
  });

  // 7. Currency Module
  describe('Currency: Piastres & Soft Delete Lifecycle', () => {
    let currencyId;

    it('should create currency record with priceInPiastres', async () => {
      const res = await request(app)
        .post('/api/currency')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'USD',
          amount: 500,
          price: 48.75,
          date: '2026-08-15',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.priceInPiastres).toBe(4875);
      currencyId = res.body._id;
    });

    it('should soft delete and restore currency record', async () => {
      const delRes = await request(app)
        .delete(`/api/currency/${currencyId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/currency')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.some((c) => c._id === currencyId)).toBe(false);

      const restoreRes = await request(app)
        .post(`/api/currency/${currencyId}/restore`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listAfterRes = await request(app)
        .get('/api/currency')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listAfterRes.body.some((c) => c._id === currencyId)).toBe(true);
    });
  });

  // 8. Social Insurance Module
  describe('Social Insurance: Piastres & Soft Delete Lifecycle', () => {
    it('should create social insurance record and store registeredIncomeInPiastres', async () => {
      const res = await request(app)
        .post('/api/social-insurance')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          year: 2026,
          registeredIncome: 14500.5,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.registeredIncomeInPiastres).toBe(1450050);
    });

    it('should soft delete and restore social insurance record', async () => {
      const delRes = await request(app)
        .delete('/api/social-insurance/2026')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/social-insurance')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.some((s) => s.year === 2026)).toBe(false);

      const restoreRes = await request(app)
        .post('/api/social-insurance/2026/restore')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listAfterRes = await request(app)
        .get('/api/social-insurance')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listAfterRes.body.some((s) => s.year === 2026)).toBe(true);
    });
  });

  // 9. Salary Profile Module
  describe('Salary Profile: Piastres & Soft Delete Lifecycle', () => {
    it('should create salary profile with piastres in salaryHistory', async () => {
      const res = await request(app)
        .post('/api/salary-profile')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Engineer Profile',
          title: 'Senior Dev',
          position: 'Tech Lead',
          year: 2026,
          salaryDetails: {
            basicSalary: 30000.5,
            basicProduction: 5000,
            meal: 1200.75,
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.salaryHistory[0].basicSalaryInPiastres).toBe(3000050);
      expect(res.body.salaryHistory[0].mealInPiastres).toBe(120075);
    });

    it('should soft delete and restore salary profile', async () => {
      const delRes = await request(app)
        .delete('/api/salary-profile')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/salary-profile')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body).toBeNull();

      const restoreRes = await request(app)
        .post('/api/salary-profile/restore')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listAfterRes = await request(app)
        .get('/api/salary-profile')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listAfterRes.body).not.toBeNull();
    });
  });

  // 10. Expenditure Soft Delete & Restore with Running Balances
  describe('Expenditure: Soft Delete & Restore with Balances', () => {
    let expId;

    it('should create expenditure and store transactionValueInPiastres', async () => {
      const res = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2026-08-20T10:00:00.000Z',
          transactionValue: 750.5,
          transactionType: 'T',
          paymentMethod: 'Bank',
          description: 'Salary topup',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.transactionValueInPiastres).toBe(75050);
      expId = res.body._id;
    });

    it('should soft delete expenditure and exclude from active list', async () => {
      const delRes = await request(app)
        .delete(`/api/expenditures/${expId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(delRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/expenditures')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.data.some((e) => e._id === expId)).toBe(false);
    });

    it('should restore expenditure successfully', async () => {
      const restoreRes = await request(app)
        .post(`/api/expenditures/${expId}/restore`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(restoreRes.statusCode).toBe(200);

      const listRes = await request(app)
        .get('/api/expenditures')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(listRes.body.data.some((e) => e._id === expId)).toBe(true);
    });
  });
});
