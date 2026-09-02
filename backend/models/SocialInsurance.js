// backend/models/SocialInsurance.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const SocialInsuranceSchema = new mongoose.Schema({
  country: {
    type: String,
    default: 'Egypt',
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  employeeShare: {
    type: Number,
    required: true, // e.g. 11 for 11%
    default: 11,
  },
  employerShare: {
    type: Number,
    required: true, // e.g. 12 or 18.75% for 18.75%
    default: 18.75,
  },
  maxInsurableIncome: {
    type: Number,
    required: true, // e.g. 10000 or 12600 EGP
    default: 12600,
  },
  minInsurableIncome: {
    type: Number,
    default: 2000,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  // Per-user legacy tracking (optional)
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  registeredIncome: {
    type: Number,
    default: 0,
  },
  registeredIncomeInPiastres: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

SocialInsuranceSchema.virtual('yearlyIncome').get(function () {
  return (this.registeredIncome || 0) * 12;
});

SocialInsuranceSchema.virtual('individualShare').get(function () {
  return (this.employeeShare || 11) / 100;
});

SocialInsuranceSchema.virtual('burden').get(function () {
  return this.yearlyIncome * this.individualShare;
});

SocialInsuranceSchema.set('toJSON', { virtuals: true });
SocialInsuranceSchema.set('toObject', { virtuals: true });

SocialInsuranceSchema.plugin(softDeletePlugin);

SocialInsuranceSchema.index({ year: 1, isActive: 1 });
SocialInsuranceSchema.index({ user: 1, year: 1 });
SocialInsuranceSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('SocialInsurance', SocialInsuranceSchema);
