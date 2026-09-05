// backend/models/CategorizationRule.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const CategorizationRuleSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    field: {
      type: String,
      enum: ['description', 'paymentMethod', 'merchant'],
      default: 'description',
    },
    operator: {
      type: String,
      enum: ['contains', 'equals', 'startsWith', 'endsWith', 'regex'],
      required: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CategorizationRuleSchema.plugin(softDeletePlugin);

CategorizationRuleSchema.index({ user: 1, isActive: 1, priority: -1 });
CategorizationRuleSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('CategorizationRule', CategorizationRuleSchema);
