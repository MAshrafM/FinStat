// backend/models/RecurringSuggestion.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const RecurringSuggestionSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: true,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    detectedFrom: {
      type: Date,
      required: true,
    },
    detectedTo: {
      type: Date,
      required: true,
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
    isRejected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

RecurringSuggestionSchema.plugin(softDeletePlugin);

RecurringSuggestionSchema.index({ user: 1, isAccepted: 1, isRejected: 1 });
RecurringSuggestionSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('RecurringSuggestion', RecurringSuggestionSchema);
