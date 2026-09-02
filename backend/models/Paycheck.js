// backend/models/Paycheck.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const PaycheckComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['basic', 'allowance', 'bonus', 'deduction', 'other'],
    required: true,
  },
  isTaxable: {
    type: Boolean,
    default: true,
  },
  isInsurable: {
    type: Boolean,
    default: true,
  },
}, { _id: true });

const PaycheckSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  salaryProfile: {
    type: Schema.Types.ObjectId,
    ref: 'SalaryProfile',
    default: null,
  },
  period: {
    type: String,
    required: true, // e.g., 'January 2025' or '2025-01'
    trim: true,
  },
  payDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  components: [PaycheckComponentSchema],

  // Summary figures
  grossSalary: {
    type: Number,
    required: true,
    default: 0,
  },
  grossSalaryInPiastres: {
    type: Number,
    default: 0,
  },
  totalDeductions: {
    type: Number,
    default: 0,
  },
  totalDeductionsInPiastres: {
    type: Number,
    default: 0,
  },
  netPay: {
    type: Number,
    required: true,
    default: 0,
  },
  netPayInPiastres: {
    type: Number,
    default: 0,
  },

  // Calculated vs Actual Tax & Insurance Details
  taxDetails: {
    taxableIncome: { type: Number, default: 0 },
    expectedTax: { type: Number, default: 0 },
    actualTax: { type: Number, default: 0 },
    taxBracketApplied: { type: String, default: '' },
    trancheDescription: { type: String, default: '' },
  },
  insuranceDetails: {
    insurableIncome: { type: Number, default: 0 },
    expectedEmployeeShare: { type: Number, default: 0 },
    actualEmployeeShare: { type: Number, default: 0 },
    expectedEmployerShare: { type: Number, default: 0 },
    actualEmployerShare: { type: Number, default: 0 },
  },
  martyrsFund: {
    type: Number,
    default: 0,
  },
  martyrsFundInPiastres: {
    type: Number,
    default: 0,
  },

  disbursementType: {
    type: String,
    enum: [
      'Regular',
      'Basic Months',
      'Basic Production',
      'Sector Bonus',
      'Individual Bonus',
      'Surplus',
      'Bond Distribution',
      'End of Year Bonus',
      'Prepaid',
      'Other',
    ],
    default: 'Regular',
  },
  multiplier: {
    type: Number,
    default: 1,
  },
  unitRate: {
    type: Number,
    default: 0,
  },
  priorYtdGross: {
    type: Number,
    default: 0,
  },
  cumulativeYtdGross: {
    type: Number,
    default: 0,
  },
  appliedTaxRate: {
    type: Number,
    default: 0,
  },
  includeTax: {
    type: Boolean,
    default: true,
  },
  includeInsurance: {
    type: Boolean,
    default: true,
  },
  includeMartyrsFund: {
    type: Boolean,
    default: true,
  },
  notes: {
    type: String,
    trim: true,
  },

  // Legacy field support
  month: {
    type: String,
  },
  type: {
    type: String,
    enum: ['Cash', 'Prepaid', 'Direct Deposit', 'Other'],
    default: 'Direct Deposit',
  },
  amount: {
    type: Number,
  },
  amountInPiastres: {
    type: Number,
  },
  grossAmount: {
    type: Number,
  },
  grossAmountInPiastres: {
    type: Number,
  },
  insuranceDeduction: {
    type: Number,
  },
  insuranceDeductionInPiastres: {
    type: Number,
  },
  taxDeduction: {
    type: Number,
  },
  taxDeductionInPiastres: {
    type: Number,
  },
  date: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Middleware to sync legacy fields before saving
PaycheckSchema.pre('save', function (next) {
  if (!this.month && this.period) {
    this.month = this.period;
  }
  if (!this.period && this.month) {
    this.period = this.month;
  }
  if (!this.date && this.payDate) {
    this.date = this.payDate;
  }
  if (!this.payDate && this.date) {
    this.payDate = this.date;
  }
  if (this.netPay !== undefined && this.amount === undefined) {
    this.amount = this.netPay;
  }
  if (this.amount !== undefined && this.netPay === undefined) {
    this.netPay = this.amount;
  }
  if (this.grossSalary !== undefined && this.grossAmount === undefined) {
    this.grossAmount = this.grossSalary;
  }
  if (this.grossAmount !== undefined && this.grossSalary === undefined) {
    this.grossSalary = this.grossAmount;
  }
  next();
});

PaycheckSchema.plugin(softDeletePlugin);

PaycheckSchema.index({ user: 1, period: 1 });
PaycheckSchema.index({ user: 1, payDate: -1 });
PaycheckSchema.index({ user: 1, month: -1 });
PaycheckSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Paycheck', PaycheckSchema);
