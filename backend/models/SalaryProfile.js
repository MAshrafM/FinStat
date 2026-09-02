// backend/models/SalaryProfile.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const SalaryComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed',
  },
  value: {
    type: Number,
    required: true,
    default: 0,
  },
  calculationBasis: {
    type: String,
    enum: ['gross', 'basic'],
    default: 'gross',
  },
  category: {
    type: String,
    enum: ['basic', 'allowance', 'bonus', 'deduction', 'other'],
    required: true,
    default: 'basic',
  },
  isTaxable: {
    type: Boolean,
    default: true,
  },
  isInsurable: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { _id: true });

// This sub-schema defines the salary components for a specific period (legacy and history records)
const SalaryDetailSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  effectiveDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  basicSalary: { type: Number, default: 0 },
  basicSalaryInPiastres: { type: Number, default: 0 },
  basicProduction: { type: Number, default: 0 },
  basicProductionInPiastres: { type: Number, default: 0 },
  prepaid: { type: Number, default: 0 },
  prepaidInPiastres: { type: Number, default: 0 },
  variables: { type: Number, default: 0 },
  variablesInPiastres: { type: Number, default: 0 },
  environment: { type: Number, default: 0 },
  environmentInPiastres: { type: Number, default: 0 },
  meal: { type: Number, default: 0 },
  mealInPiastres: { type: Number, default: 0 },
  shift: { type: Number, default: 0 },
  shiftInPiastres: { type: Number, default: 0 },
  supervising: { type: Number, default: 0 },
  supervisingInPiastres: { type: Number, default: 0 },
  others: { type: Number, default: 0 },
  othersInPiastres: { type: Number, default: 0 },
  bonds: { type: Number, default: 0 },
  bondsInPiastres: { type: Number, default: 0 },
});

// Main schema for salary profile
const SalaryProfileSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Default Profile',
  },
  components: [SalaryComponentSchema],
  isDefault: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  effectiveDate: {
    type: Date,
    default: Date.now,
  },
  // Legacy fields preserved for backward compatibility
  title: {
    type: String,
    trim: true,
  },
  position: {
    type: String,
    trim: true,
  },
  year: {
    type: Number,
  },
  salaryHistory: [SalaryDetailSchema],
}, {
  timestamps: true,
});

SalaryProfileSchema.plugin(softDeletePlugin);

// Helper to get the most recent salary details
SalaryProfileSchema.methods.getCurrentSalary = function () {
  if (!this.salaryHistory || this.salaryHistory.length === 0) {
    return null;
  }
  return this.salaryHistory.slice().sort((a, b) => new Date(b.effectiveDate || 0) - new Date(a.effectiveDate || 0))[0];
};

// Helper to get total gross estimate
SalaryProfileSchema.methods.getMonthlyGrossEstimate = function () {
  if (this.components && this.components.length > 0) {
    const basicSum = this.components
      .filter(c => c.category === 'basic' && c.isActive !== false)
      .reduce((sum, c) => sum + (c.value || 0), 0);

    let gross = basicSum;
    for (const comp of this.components) {
      if (comp.category !== 'deduction' && comp.category !== 'basic' && comp.isActive !== false) {
        if (comp.type === 'fixed') {
          gross += (comp.value || 0);
        }
      }
    }
    for (const comp of this.components) {
      if (comp.category !== 'deduction' && comp.category !== 'basic' && comp.isActive !== false) {
        if (comp.type === 'percentage') {
          const basis = comp.calculationBasis === 'basic' ? basicSum : gross;
          gross += (basis * (comp.value || 0)) / 100;
        }
      }
    }
    return gross;
  }

  const cs = this.getCurrentSalary();
  if (cs) {
    return (
      (cs.basicSalary || 0) +
      (cs.basicProduction || 0) +
      (cs.variables || 0) +
      (cs.environment || 0) +
      (cs.meal || 0) +
      (cs.shift || 0) +
      (cs.supervising || 0) +
      (cs.others || 0)
    );
  }
  return 0;
};

SalaryProfileSchema.index({ user: 1, isDefault: 1 });
SalaryProfileSchema.index({ user: 1, active: 1 });
SalaryProfileSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('SalaryProfile', SalaryProfileSchema);
