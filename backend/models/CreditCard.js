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
}, { timestamps: true });

CreditCardSchema.plugin(softDeletePlugin);

CreditCardSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('CreditCard', CreditCardSchema);
