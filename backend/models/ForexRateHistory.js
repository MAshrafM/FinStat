// backend/models/ForexRateHistory.js
const mongoose = require('mongoose');

const ForexRateHistorySchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    default: 'EGP',
    trim: true,
  },
  rates: {
    type: Map,
    of: Number,
    required: true,
  },
  source: {
    type: String,
    default: 'CIB',
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

ForexRateHistorySchema.index({ date: -1 });
ForexRateHistorySchema.index({ baseCurrency: 1, date: -1 });

module.exports = mongoose.model('ForexRateHistory', ForexRateHistorySchema);
