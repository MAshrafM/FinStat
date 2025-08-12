// backend/models/CardTransaction.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardTransactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  card: { type: Schema.Types.ObjectId, ref: 'CreditCard', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['Purchase', 'Installment'], required: true },
  installmentDetails: {
    months: { type: Number },
    monthlyPrincipal: { type: Number },
    interest: { type: Number, default: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model('CardTransaction', CardTransactionSchema);
