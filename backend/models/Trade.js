// backend/models/Trade.js
const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  broker: {
    type: String,
    required: true,
    enum: ['Thndr', 'EFG'], // Easily expandable
  },
  stockCode: {
    type: String,
    // Not required for cash transactions like TopUp/Withdraw
    required: function() { return ['Buy', 'Sell', 'Dividend'].includes(this.type); }
  },
  type: {
    type: String,
    required: true,
    enum: ['Buy', 'Sell', 'TopUp', 'Dividend', 'Withdraw'],
  },
  price: { // Price per share
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
  // This is the total cash value of the transaction
  totalValue: {
    type: Number,
    required: true,
  },
  iteration: {
    type: Number,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Trade', TradeSchema);
