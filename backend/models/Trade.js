// backend/models/Trade.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const TradeSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  broker: {
    type: String,
    required: true,
    enum: ['Thndr', 'EFG', 'Telda'], // Expandable
  },
  stockCode: {
    type: String,
    // Not required for cash transactions like TopUp/Withdraw
    required: function () { return ['Buy', 'Sell', 'Dividend'].includes(this.type); },
  },
  type: {
    type: String,
    required: true,
    enum: ['Buy', 'Sell', 'TopUp', 'Dividend', 'Withdraw'],
  },
  price: { // Price per share (EGP)
    type: Number,
    default: 0,
  },
  priceInPiastres: {
    type: Number,
    default: 0,
  },
  shares: {
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
  iteration: {
    type: Number,
  },
}, {
  timestamps: true,
});

TradeSchema.plugin(softDeletePlugin);

TradeSchema.index({ user: 1, date: -1 });
TradeSchema.index({ user: 1, broker: 1, stockCode: 1 });
TradeSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Trade', TradeSchema);
