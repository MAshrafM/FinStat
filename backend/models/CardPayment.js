// backend/models/CardPayment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardPaymentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  card: { type: Schema.Types.ObjectId, ref: 'CreditCard', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('CardPayment', CardPaymentSchema);
