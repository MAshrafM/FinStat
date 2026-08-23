// backend/models/Paycheck.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const PaycheckSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  month: {
    type: String,
    required: true, // e.g., "2024-07"
  },
  type: {
    type: String,
    required: true,
    enum: ['Cash', 'Prepaid'],
  },
  amount: {
    type: Number,
    required: true,
  },
  amountInPiastres: {
    type: Number,
    default: 0,
  },
  note: {
    type: String,
    trim: true,
  },
  insuranceDeduction: {
    type: Number,
    default: 0,
  },
  insuranceDeductionInPiastres: {
    type: Number,
    default: 0,
  },
  grossAmount: {
    type: Number,
    default: 0,
  },
  grossAmountInPiastres: {
    type: Number,
    default: 0,
  },
  taxDeduction: {
    type: Number,
    default: 0,
  },
  taxDeductionInPiastres: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

PaycheckSchema.plugin(softDeletePlugin);

PaycheckSchema.index({ user: 1, date: -1 });
PaycheckSchema.index({ user: 1, month: -1 });
PaycheckSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Paycheck', PaycheckSchema);
