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
    get: function (val) {
      return val || this._doc?.month;
    },
  },
  payDate: {
    type: Date,
    required: true,
    default: Date.now,
    get: function (val) {
      return this._doc?.date || val;
    },
  },
  components: [PaycheckComponentSchema],

  // Summary figures
  grossSalary: {
    type: Number,
    required: true,
    default: 0,
    get: function (val) {
      if (val !== undefined && val !== null && val !== 0) return val;
      return (this._doc?.grossAmount !== undefined && this._doc?.grossAmount !== null && this._doc?.grossAmount !== 0)
        ? this._doc.grossAmount
        : (val ?? 0);
    },
  },
  grossSalaryInPiastres: {
    type: Number,
    default: 0,
    get: function (val) {
      if (val !== undefined && val !== null && val !== 0) return val;
      if (this._doc?.grossAmountInPiastres !== undefined && this._doc?.grossAmountInPiastres !== null && this._doc?.grossAmountInPiastres !== 0) {
        return this._doc.grossAmountInPiastres;
      }
      const gross = this.grossSalary || this._doc?.grossAmount;
      return gross ? Math.round(gross * 100) : (val ?? 0);
    },
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
    get: function (val) {
      if (val !== undefined && val !== null && val !== 0) return val;
      return (this._doc?.amount !== undefined && this._doc?.amount !== null && this._doc?.amount !== 0)
        ? this._doc.amount
        : (val ?? 0);
    },
  },
  netPayInPiastres: {
    type: Number,
    default: 0,
    get: function (val) {
      if (val !== undefined && val !== null && val !== 0) return val;
      if (this._doc?.amountInPiastres !== undefined && this._doc?.amountInPiastres !== null && this._doc?.amountInPiastres !== 0) {
        return this._doc.amountInPiastres;
      }
      const net = this.netPay || this._doc?.amount;
      return net ? Math.round(net * 100) : (val ?? 0);
    },
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
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true },
});

// Virtual accessors for legacy schema field backward compatibility (SIMP-008, AUD-ARCH-003)
PaycheckSchema.virtual('month')
  .get(function () { return this.period || this._doc?.month; })
  .set(function (val) { this.period = val; });

PaycheckSchema.virtual('date')
  .get(function () { return this.payDate || this._doc?.date; })
  .set(function (val) { this.payDate = val; });

PaycheckSchema.virtual('amount')
  .get(function () {
    if (this.netPay !== undefined && this.netPay !== null && this.netPay !== 0) return this.netPay;
    return (this._doc?.amount !== undefined && this._doc?.amount !== null && this._doc?.amount !== 0)
      ? this._doc.amount
      : (this.netPay ?? 0);
  })
  .set(function (val) {
    this.netPay = val;
    if (this.netPayInPiastres === undefined || this.netPayInPiastres === 0) {
      this.netPayInPiastres = typeof val === 'number' ? Math.round(val * 100) : 0;
    }
  });

PaycheckSchema.virtual('amountInPiastres')
  .get(function () {
    if (this.netPayInPiastres !== undefined && this.netPayInPiastres !== null && this.netPayInPiastres !== 0) {
      return this.netPayInPiastres;
    }
    if (this._doc?.amountInPiastres !== undefined && this._doc?.amountInPiastres !== null && this._doc?.amountInPiastres !== 0) {
      return this._doc.amountInPiastres;
    }
    const amt = this.amount;
    return amt ? Math.round(amt * 100) : 0;
  })
  .set(function (val) {
    this.netPayInPiastres = val;
    if (this.netPay === undefined || this.netPay === 0) {
      this.netPay = typeof val === 'number' ? val / 100 : 0;
    }
  });

PaycheckSchema.virtual('grossAmount')
  .get(function () {
    if (this.grossSalary !== undefined && this.grossSalary !== null && this.grossSalary !== 0) return this.grossSalary;
    return (this._doc?.grossAmount !== undefined && this._doc?.grossAmount !== null && this._doc?.grossAmount !== 0)
      ? this._doc.grossAmount
      : (this.grossSalary ?? 0);
  })
  .set(function (val) {
    this.grossSalary = val;
    if (this.grossSalaryInPiastres === undefined || this.grossSalaryInPiastres === 0) {
      this.grossSalaryInPiastres = typeof val === 'number' ? Math.round(val * 100) : 0;
    }
  });

PaycheckSchema.virtual('grossAmountInPiastres')
  .get(function () {
    if (this.grossSalaryInPiastres !== undefined && this.grossSalaryInPiastres !== null && this.grossSalaryInPiastres !== 0) {
      return this.grossSalaryInPiastres;
    }
    if (this._doc?.grossAmountInPiastres !== undefined && this._doc?.grossAmountInPiastres !== null && this._doc?.grossAmountInPiastres !== 0) {
      return this._doc.grossAmountInPiastres;
    }
    const gross = this.grossAmount;
    return gross ? Math.round(gross * 100) : 0;
  })
  .set(function (val) {
    this.grossSalaryInPiastres = val;
    if (this.grossSalary === undefined || this.grossSalary === 0) {
      this.grossSalary = typeof val === 'number' ? val / 100 : 0;
    }
  });

PaycheckSchema.virtual('insuranceDeduction')
  .get(function () {
    const share = this.insuranceDetails?.actualEmployeeShare;
    if (share !== undefined && share !== null && share !== 0) return share;
    return (this._doc?.insuranceDeduction !== undefined && this._doc?.insuranceDeduction !== null)
      ? this._doc.insuranceDeduction
      : (share ?? 0);
  })
  .set(function (val) {
    if (!this.insuranceDetails) this.insuranceDetails = {};
    this.insuranceDetails.actualEmployeeShare = val;
  });

PaycheckSchema.virtual('insuranceDeductionInPiastres')
  .get(function () {
    if (this._doc?.insuranceDeductionInPiastres !== undefined && this._doc?.insuranceDeductionInPiastres !== null) {
      return this._doc.insuranceDeductionInPiastres;
    }
    const share = this.insuranceDeduction || 0;
    return Math.round(share * 100);
  })
  .set(function (val) {
    if (!this.insuranceDetails) this.insuranceDetails = {};
    this.insuranceDetails.actualEmployeeShare = typeof val === 'number' ? val / 100 : 0;
  });

PaycheckSchema.virtual('taxDeduction')
  .get(function () {
    const tax = this.taxDetails?.actualTax;
    if (tax !== undefined && tax !== null && tax !== 0) return tax;
    return (this._doc?.taxDeduction !== undefined && this._doc?.taxDeduction !== null)
      ? this._doc.taxDeduction
      : (tax ?? 0);
  })
  .set(function (val) {
    if (!this.taxDetails) this.taxDetails = {};
    this.taxDetails.actualTax = val;
  });

PaycheckSchema.virtual('taxDeductionInPiastres')
  .get(function () {
    if (this._doc?.taxDeductionInPiastres !== undefined && this._doc?.taxDeductionInPiastres !== null) {
      return this._doc.taxDeductionInPiastres;
    }
    const tax = this.taxDeduction || 0;
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
