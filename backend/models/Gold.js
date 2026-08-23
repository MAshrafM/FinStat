// backend/models/Gold.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const GoldSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
  karat: { // e.g., 24, 22, 21, 18
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  priceInPiastres: {
    type: Number,
    default: 0,
  },
  paid: {
    type: Number,
    required: true,
  },
  paidInPiastres: {
    type: Number,
    default: 0,
  },
  seller: {
    type: String,
  },
  status: {
    type: String,
    enum: ['hold', 'sold'],
  },
  sellingPrice: {
    type: Number,
  },
  sellingPriceInPiastres: {
    type: Number,
    default: 0,
  },
  sellingDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

GoldSchema.plugin(softDeletePlugin);

GoldSchema.index({ user: 1, date: -1 });
GoldSchema.index({ user: 1, status: 1 });
GoldSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Gold', GoldSchema);
