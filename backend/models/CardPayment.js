// backend/models/CardPayment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const CardPaymentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  card: { type: Schema.Types.ObjectId, ref: 'CreditCard', required: true },
  amount: { type: Number, required: true },
  amountInPiastres: { type: Number, default: 0 },
  date: { type: Date, required: true },
}, { timestamps: true });

CardPaymentSchema.plugin(softDeletePlugin);

CardPaymentSchema.index({ user: 1, card: 1, date: -1 });
CardPaymentSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('CardPayment', CardPaymentSchema);
