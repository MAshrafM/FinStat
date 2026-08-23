// backend/models/CardTransaction.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const CardTransactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  card: { type: Schema.Types.ObjectId, ref: 'CreditCard', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  amountInPiastres: { type: Number, default: 0 },
  date: { type: Date, required: true },
  type: { type: String, enum: ['Purchase', 'Installment'], required: true },
  installmentDetails: {
    months: { type: Number },
    monthlyPrincipal: { type: Number },
    monthlyPrincipalInPiastres: { type: Number, default: 0 },
    interest: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: ['Due', 'Paid', 'Partial'],
    default: 'Due',
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  paidAmountInPiastres: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

CardTransactionSchema.plugin(softDeletePlugin);

CardTransactionSchema.index({ user: 1, card: 1, date: -1 });
CardTransactionSchema.index({ user: 1, card: 1, type: 1, status: 1 });
CardTransactionSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('CardTransaction', CardTransactionSchema);
