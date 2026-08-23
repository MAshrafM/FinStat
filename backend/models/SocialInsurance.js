// backend/models/SocialInsurance.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const SocialInsuranceSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  registeredIncome: {
    type: Number,
    required: true,
    default: 0,
  },
  registeredIncomeInPiastres: {
    type: Number,
    default: 0,
  },
});

// --- VIRTUAL PROPERTIES FOR CALCULATIONS ---
SocialInsuranceSchema.virtual('yearlyIncome').get(function () {
  return this.registeredIncome * 12;
});

SocialInsuranceSchema.virtual('yearlyIncomeInPiastres').get(function () {
  return (this.registeredIncomeInPiastres || this.registeredIncome * 100) * 12;
});

SocialInsuranceSchema.virtual('individualShare').get(function () {
  return 0.11; // 11%
});

SocialInsuranceSchema.virtual('burden').get(function () {
  return this.yearlyIncome * this.individualShare;
});

SocialInsuranceSchema.set('toJSON', { virtuals: true });
SocialInsuranceSchema.set('toObject', { virtuals: true });

SocialInsuranceSchema.plugin(softDeletePlugin);

SocialInsuranceSchema.index({ user: 1, year: 1 });
SocialInsuranceSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('SocialInsurance', SocialInsuranceSchema);
