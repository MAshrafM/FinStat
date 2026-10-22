// backend/models/DebtPayoffPlan.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const DebtPayoffPlanSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  strategy: {
    type: String,
    enum: ['snowball', 'avalanche', 'custom'],
    required: true,
  },
  monthlyBudget: { type: Number, required: true },
  monthlyBudgetInPiastres: { type: Number, required: true },
  cards: [{
    cardId: { type: Schema.Types.ObjectId, ref: 'CreditCard', required: true },
    balanceInPiastres: { type: Number, required: true },
    minimumPaymentInPiastres: { type: Number, required: true },
    apr: { type: Number, default: 0 },
  }],
  projectedPayoffDate: { type: Date },
  totalInterestPaidInPiastres: { type: Number, default: 0 },
  totalInterestSavedInPiastres: { type: Number, default: 0 },
  schedule: [{
    month: { type: Number },
    cardId: { type: Schema.Types.ObjectId, ref: 'CreditCard' },
    paymentInPiastres: { type: Number },
    interestChargedInPiastres: { type: Number },
    remainingBalanceInPiastres: { type: Number },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

DebtPayoffPlanSchema.plugin(softDeletePlugin);
DebtPayoffPlanSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true, deletedAt: null },
    name: 'unique_active_plan_per_user',
  }
);
DebtPayoffPlanSchema.index({ user: 1, isActive: 1, deletedAt: 1 });

module.exports = mongoose.model('DebtPayoffPlan', DebtPayoffPlanSchema);
