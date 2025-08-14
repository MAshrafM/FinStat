// backend/models/CreditCard.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CreditCardSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  bank: { type: String, required: true },
  limit: { type: Number, required: true },
  billingCycleDay: { type: Number, required: true, min: 1, max: 25 },
}, { timestamps: true });

module.exports = mongoose.model('CreditCard', CreditCardSchema);
