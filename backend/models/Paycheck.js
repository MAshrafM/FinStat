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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual accessors for legacy schema field backward compatibility (SIMP-008, AUD-ARCH-003)
PaycheckSchema.virtual('month')
  .get(function () { return this.period; })
  .set(function (val) { this.period = val; });

PaycheckSchema.virtual('date')
  .get(function () { return this.payDate; })
  .set(function (val) { this.payDate = val; });

PaycheckSchema.virtual('amount')
  .get(function () { return this.netPay; })
  .set(function (val) {
    this.netPay = val;
    if (this.netPayInPiastres === undefined || this.netPayInPiastres === 0) {
      this.netPayInPiastres = typeof val === 'number' ? Math.round(val * 100) : 0;
    }
  });

PaycheckSchema.virtual('amountInPiastres')
  .get(function () {
    return this.netPayInPiastres !== undefined && this.netPayInPiastres !== null
      ? this.netPayInPiastres
      : (this.netPay ? Math.round(this.netPay * 100) : 0);
  })
  .set(function (val) {
    this.netPayInPiastres = val;
    if (this.netPay === undefined || this.netPay === 0) {
      this.netPay = typeof val === 'number' ? val / 100 : 0;
    }
  });

PaycheckSchema.virtual('grossAmount')
  .get(function () { return this.grossSalary; })
  .set(function (val) {
    this.grossSalary = val;
    if (this.grossSalaryInPiastres === undefined || this.grossSalaryInPiastres === 0) {
      this.grossSalaryInPiastres = typeof val === 'number' ? Math.round(val * 100) : 0;
    }
  });

PaycheckSchema.virtual('grossAmountInPiastres')
  .get(function () {
    return this.grossSalaryInPiastres !== undefined && this.grossSalaryInPiastres !== null
      ? this.grossSalaryInPiastres
      : (this.grossSalary ? Math.round(this.grossSalary * 100) : 0);
  })
  .set(function (val) {
    this.grossSalaryInPiastres = val;
    if (this.grossSalary === undefined || this.grossSalary === 0) {
      this.grossSalary = typeof val === 'number' ? val / 100 : 0;
    }
  });

PaycheckSchema.virtual('insuranceDeduction')
  .get(function () { return this.insuranceDetails?.actualEmployeeShare || 0; })
  .set(function (val) {
    if (!this.insuranceDetails) this.insuranceDetails = {};
    this.insuranceDetails.actualEmployeeShare = val;
  });

PaycheckSchema.virtual('insuranceDeductionInPiastres')
  .get(function () {
    const share = this.insuranceDetails?.actualEmployeeShare || 0;
    return Math.round(share * 100);
  })
  .set(function (val) {
    if (!this.insuranceDetails) this.insuranceDetails = {};
    this.insuranceDetails.actualEmployeeShare = typeof val === 'number' ? val / 100 : 0;
  });

PaycheckSchema.virtual('taxDeduction')
  .get(function () { return this.taxDetails?.actualTax || 0; })
  .set(function (val) {
    if (!this.taxDetails) this.taxDetails = {};
    this.taxDetails.actualTax = val;
  });

PaycheckSchema.virtual('taxDeductionInPiastres')
  .get(function () {
    const tax = this.taxDetails?.actualTax || 0;
    return Math.round(tax * 100);
  })
  .set(function (val) {
    if (!this.taxDetails) this.taxDetails = {};
    this.taxDetails.actualTax = typeof val === 'number' ? val / 100 : 0;
  });

PaycheckSchema.plugin(softDeletePlugin);

PaycheckSchema.index({ user: 1, period: 1 });
PaycheckSchema.index({ user: 1, payDate: -1 });
PaycheckSchema.index({ user: 1, deletedAt: 1 });
PaycheckSchema.index(
  { user: 1, period: 1, disbursementType: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null }, name: 'idx_unique_user_period_disbursement' }
);

module.exports = mongoose.model('Paycheck', PaycheckSchema);
