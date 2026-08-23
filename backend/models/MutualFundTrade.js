// backend/models/MutualFundTrade.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const MutualFundTradeSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  name: { // e.g., "AZ-Opportunity MF"
    type: String,
    required: true,
  },
  code: { // e.g., "AZO"
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Buy', 'Sell', 'Coupon'],
  },
  units: { // Number of units/shares
    type: Number,
    default: 0,
  },
  price: { // Price per unit
    type: Number,
    default: 0,
  },
  priceInPiastres: {
    type: Number,
    default: 0,
  },
  fees: {
    type: Number,
    default: 0,
  },
  feesInPiastres: {
    type: Number,
    default: 0,
  },
  totalValue: { // Total cash value (EGP)
    type: Number,
    required: true,
  },
  totalValueInPiastres: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

MutualFundTradeSchema.plugin(softDeletePlugin);

MutualFundTradeSchema.index({ user: 1, date: -1 });
MutualFundTradeSchema.index({ user: 1, code: 1 });
MutualFundTradeSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('MutualFundTrade', MutualFundTradeSchema);
