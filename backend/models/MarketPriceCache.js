// backend/models/MarketPriceCache.js
const mongoose = require('mongoose');

const MarketPriceCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true, // e.g. 'stocks', 'gold', 'currency', 'funds_AZO'
    trim: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  source: {
    type: String,
    default: 'live',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MarketPriceCache', MarketPriceCacheSchema);
