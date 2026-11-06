// backend/models/RecurringBill.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const RecurringBillSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    amountInPiastres: {
      type: Number,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly',
      required: true,
    },
    dueDay: {
      type: Number,
      min: 1,
      max: 31,
      required: true,
    },
    nextDueDate: {
      type: Date,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Bank', 'Cash', 'Prepaid'],
      default: 'Bank',
      required: true,
    },
    reminderDaysBefore: {
      type: Number,
      min: 1,
      max: 30,
      default: 3,
      // Reserved for future notification system (email/SMS reminders before nextDueDate);
      // currently unused by GET /bills/upcoming (which uses ?days= query param)
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastPaidDate: {
      type: Date,
      default: null,
    },
    lastExpenditureId: {
      type: Schema.Types.ObjectId,
      ref: 'Expenditure',
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

RecurringBillSchema.plugin(softDeletePlugin);
RecurringBillSchema.index({ user: 1, nextDueDate: 1, isActive: 1, deletedAt: 1 });
RecurringBillSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('RecurringBill', RecurringBillSchema);

