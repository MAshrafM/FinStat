// backend/models/SalaryProfile.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

// This sub-schema defines the salary components for a specific period.
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
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  salaryHistory: [SalaryDetailSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

SalaryProfileSchema.plugin(softDeletePlugin);

// Helper to get the most recent salary details
SalaryProfileSchema.methods.getCurrentSalary = function () {
  if (!this.salaryHistory || this.salaryHistory.length === 0) {
    return null;
  }
  return this.salaryHistory.slice().sort((a, b) => b.effectiveDate - a.effectiveDate)[0];
};

SalaryProfileSchema.index({ user: 1, year: -1 });
SalaryProfileSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('SalaryProfile', SalaryProfileSchema);
