// backend/models/Budget.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const BudgetSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    period: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },
    quarter: {
      type: Number,
      min: 1,
      max: 4,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    alertThreshold: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

BudgetSchema.plugin(softDeletePlugin);

// Disable automatic index creation to prevent boot-time E11000 race conditions on pre-existing duplicates
BudgetSchema.set('autoIndex', false);

BudgetSchema.index(
  { user: 1, category: 1, period: 1, year: 1, month: 1, quarter: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
BudgetSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Budget', BudgetSchema);
