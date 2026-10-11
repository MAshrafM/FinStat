// backend/models/CreditCard.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const CreditCardSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  bank: { type: String, required: true },
  limit: { type: Number, required: true },
  limitInPiastres: { type: Number, default: 0 },
  billingCycleDay: { type: Number, required: true, min: 1, max: 31 },
  statementCloseDay: { type: Number, min: 1, max: 31, default: 25 },
  paymentDueDay: { type: Number, min: 1, max: 31, default: 15 },
  utilizationAlertThreshold: { type: Number, min: 0, max: 100, default: 30 },
  minimumPaymentPercent: { type: Number, min: 0, max: 100, default: 5 },
  apr: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

CreditCardSchema.plugin(softDeletePlugin);

CreditCardSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('CreditCard', CreditCardSchema);
