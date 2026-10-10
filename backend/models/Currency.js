// backend/models/Currency.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const CurrencySchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: { // The foreign currency amount
    type: Number,
    required: true,
  },
  price: { // EGP price paid
    type: Number,
    required: true,
  },
  priceInPiastres: { // Price in piastres (EGP * 100)
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    required: true,
  },
  currencyCode: {
    type: String,
    uppercase: true,
    trim: true,
  },
  purchaseRate: {
    type: Number,
    default: 0,
  },
  currentRate: {
    type: Number,
    default: 0,
  },
  currentValueInPiastres: {
    type: Number,
    default: 0,
  },
  unrealizedForexGainLossInPiastres: {
    type: Number,
    default: 0,
  },
  lastRevaluationDate: {
    type: Date,
    default: null,
  },
  rateSource: {
    type: String,
    enum: ['CIB', 'fallback', 'manual'],
    default: 'CIB',
  },
  isStale: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

CurrencySchema.pre('save', function (next) {
  if (!this.currencyCode && this.name) {
    const trimmed = this.name.trim();
    const { currencyMap } = require('../utils/currencyMapHelper');
    this.currencyCode = currencyMap[trimmed] || trimmed.toUpperCase();
  }
  if ((!this.purchaseRate || this.purchaseRate === 0) && this.amount > 0 && this.price) {
    this.purchaseRate = Number((this.price / this.amount).toFixed(4));
  }
  next();
});

CurrencySchema.plugin(softDeletePlugin);

CurrencySchema.index({ user: 1, currencyCode: 1, date: -1 });
CurrencySchema.index({ user: 1, date: -1 });
CurrencySchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Currency', CurrencySchema);
