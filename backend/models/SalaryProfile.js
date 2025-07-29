// backend/models/SalaryProfile.js
const mongoose = require('mongoose');

// This sub-schema defines the salary components for a specific period.
const SalaryDetailSchema = new mongoose.Schema({
  effectiveDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  basicSalary: { type: Number, default: 0 },
  basicProduction: { type: Number, default: 0 },
  prepaid: { type: Number, default: 0 },
  variables: { type: Number, default: 0 },
  environment: { type: Number, default: 0 },
  meal: { type: Number, default: 0 },
  shift: { type: Number, default: 0 },
  supervising: { type: Number, default: 0 },
  others: { type: Number, default: 0 },
  bonds: { type: Number, default: 0 },
});

// This is the main schema for a salary profile.
const SalaryProfileSchema = new mongoose.Schema({
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
  // We embed an array of salary details. The most recent one is the "current" one.
  salaryHistory: [SalaryDetailSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Helper to get the most recent salary details.
// We use a "virtual" property which is not stored in the DB but calculated on the fly.
SalaryProfileSchema.virtual('currentSalary').get(function() {
  if (this.salaryHistory && this.salaryHistory.length > 0) {
    // Sort history by effectiveDate descending and return the first one.
    return this.salaryHistory.sort((a, b) => b.effectiveDate - a.effectiveDate)[0];
  }
  return null;
});

// Helper to calculate the monthly gross estimate from the current salary.
SalaryProfileSchema.virtual('monthlyGrossEstimate').get(function() {
  const current = this.currentSalary;
  if (!current) return 0;

  // Sum of all fields except 'bonds' and internal fields.
  return (
    current.basicSalary +
    current.basicProduction +
    current.variables +
    current.environment +
    current.meal +
    current.shift +
    current.supervising +
    current.others
  );
});

// Ensure virtuals are included when converting documents to JSON.
SalaryProfileSchema.set('toJSON', { virtuals: true });
SalaryProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SalaryProfile', SalaryProfileSchema);
