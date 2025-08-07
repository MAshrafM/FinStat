// backend/models/SocialInsurance.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SocialInsuranceSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // This creates a reference to the User model
    required: true,
  },
  year: {
    type: Number,
    required: true,
    unique: true, // We only want one record per year
  },
  registeredIncome: {
    type: Number,
    required: true,
    default: 0,
  },
});

// --- VIRTUAL PROPERTIES FOR CALCULATIONS ---

// Total Yearly Income
SocialInsuranceSchema.virtual('yearlyIncome').get(function() {
  return this.registeredIncome * 12;
});

// Individual Share (11%)
SocialInsuranceSchema.virtual('individualShare').get(function() {
  return 0.11; // 11%
});

// Total Burden for the year
SocialInsuranceSchema.virtual('burden').get(function() {
  return this.yearlyIncome * this.individualShare;
});

// Ensure virtuals are included when converting to JSON
SocialInsuranceSchema.set('toJSON', { virtuals: true });
SocialInsuranceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SocialInsurance', SocialInsuranceSchema);
