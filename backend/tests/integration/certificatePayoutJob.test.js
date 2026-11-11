// backend/tests/integration/certificatePayoutJob.test.js
const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const Certificate = require('../../models/Certificate');
const Expenditure = require('../../models/Expenditure');
const User = require('../../models/User');
const {
  runDailyCertificatePayouts,
  calculatePeriodicInterest,
} = require('../../jobs/certificatePayoutJob');

jest.setTimeout(60000);

describe('Certificate Payout Job Integration Tests', () => {
  let testUser;

  beforeAll(async () => {
    await connectDB();
    testUser = await User.findOne({ role: 'admin' });
    if (!testUser) {
      testUser = await User.create({
        username: 'certpayout_admin',
        email: 'certpayout_admin@test.com',
        password: 'password123',
        role: 'admin',
      });
    }
  });

  afterAll(async () => {
    await Certificate.deleteMany({ user: testUser._id, name: /^Test Payout CD/ });
    await Expenditure.deleteMany({ user: testUser._id, description: /Test Payout CD/ });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Certificate.deleteMany({ user: testUser._id, name: /^Test Payout CD/ });
    await Expenditure.deleteMany({ user: testUser._id, description: /Test Payout CD/ });
  });

  it('correctly calculates periodic interest across monthly, quarterly, annually intervals', () => {
    const monthlyCert = { amount: 12000, interest: 10, payoutInterval: 'monthly' };
    expect(calculatePeriodicInterest(monthlyCert)).toBe(100); // 12000 * 0.10 / 12

    const quarterlyCert = { amount: 20000, interest: 12, payoutInterval: 'quarterly' };
    expect(calculatePeriodicInterest(quarterlyCert)).toBe(600); // 20000 * 0.12 / 4

    const annualCert = { amount: 50000, interest: 15, payoutInterval: 'annually' };
    expect(calculatePeriodicInterest(annualCert)).toBe(7500); // 50000 * 0.15 / 1
  });

  it('processes payout for due certificate and creates linked bank deposit expenditure', async () => {
    const asOfDate = new Date('2026-11-11T02:00:00.000Z');

    // Started 1 month ago on 2026-10-11 -> payout is due on 2026-11-11
    const cert = await Certificate.create({
      user: testUser._id,
      name: 'Test Payout CD 1',
      period: 12,
      amount: 12000,
      amountInPiastres: 1200000,
      interest: 10,
      startDate: new Date('2026-10-11T00:00:00.000Z'),
      payoutInterval: 'monthly',
      status: 'active',
      autoReinvest: false,
    });

    const result = await runDailyCertificatePayouts(asOfDate);

    expect(result.processedCount).toBeGreaterThanOrEqual(1);
    const matchedPayout = result.payouts.find(
      (p) => p.certificateId.toString() === cert._id.toString()
    );
    expect(matchedPayout).toBeDefined();
    expect(matchedPayout.amount).toBe(100);

    // Verify linked expenditure created in DB
    const exp = await Expenditure.findById(matchedPayout.expenditureId);
    expect(exp).toBeDefined();
    expect(exp.transactionType).toBe('T');
    expect(exp.paymentMethod).toBe('Bank');
    expect(exp.bridgeDirection).toBe('inflow');
    expect(exp.transactionValue).toBe(100);
    expect(exp.linkedCertificateId.toString()).toBe(cert._id.toString());

    // Verify certificate document updated
    const updatedCert = await Certificate.findById(cert._id);
    expect(updatedCert.lastPayoutDate).toBeDefined();
    expect(new Date(updatedCert.lastPayoutDate).toISOString().slice(0, 10)).toBe('2026-11-11');
    expect(updatedCert.totalInterestPaidInPiastres).toBe(10000);
  });

  it('skips certificates with autoReinvest: true', async () => {
    const asOfDate = new Date('2026-11-11T02:00:00.000Z');

    const cert = await Certificate.create({
      user: testUser._id,
      name: 'Test Payout CD Reinvest',
      period: 12,
      amount: 12000,
      amountInPiastres: 1200000,
      interest: 10,
      startDate: new Date('2026-10-11T00:00:00.000Z'),
      payoutInterval: 'monthly',
      status: 'active',
      autoReinvest: true,
    });

    const result = await runDailyCertificatePayouts(asOfDate);

    const matchedPayout = result.payouts.find(
      (p) => p.certificateId.toString() === cert._id.toString()
    );
    expect(matchedPayout).toBeUndefined();

    const exp = await Expenditure.findOne({ linkedCertificateId: cert._id });
    expect(exp).toBeNull();
  });

  it('skips certificates whose payout date is in the future', async () => {
    const asOfDate = new Date('2026-11-11T02:00:00.000Z');

    // Started on 2026-11-01 -> next payout is 2026-12-01 (future)
    const cert = await Certificate.create({
      user: testUser._id,
      name: 'Test Payout CD Future',
      period: 12,
      amount: 12000,
      amountInPiastres: 1200000,
      interest: 10,
      startDate: new Date('2026-11-01T00:00:00.000Z'),
      payoutInterval: 'monthly',
      status: 'active',
      autoReinvest: false,
    });

    const result = await runDailyCertificatePayouts(asOfDate);

    const matchedPayout = result.payouts.find(
      (p) => p.certificateId.toString() === cert._id.toString()
    );
    expect(matchedPayout).toBeUndefined();

    const exp = await Expenditure.findOne({ linkedCertificateId: cert._id });
    expect(exp).toBeNull();
  });
});

