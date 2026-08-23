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
}, {
  timestamps: true,
});

CurrencySchema.plugin(softDeletePlugin);

CurrencySchema.index({ user: 1, date: -1 });
CurrencySchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Currency', CurrencySchema);
