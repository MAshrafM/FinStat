// backend/models/Expenditure.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const ExpenditureSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  bank: {
    type: Number,
    required: true,
    default: 0,
  },
  bankInPiastres: {
    type: Number,
    default: 0,
  },
  cash: {
    type: Number,
    required: true,
    default: 0,
  },
  cashInPiastres: {
    type: Number,
    default: 0,
  },
  prepaid: {
    type: Number,
    required: true,
    default: 0,
  },
  prepaidInPiastres: {
    type: Number,
    default: 0,
  },
  transactionValue: {
    type: Number,
    required: true,
    default: 0,
  },
  transactionValueInPiastres: {
    type: Number,
    default: 0,
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['W', 'T', 'S', 'na'], // Withdraw, Top-up, Saving, Log / Transfer
  },
  description: {
    type: String,
    trim: true,
  },
  categories: {
    type: [String],
    default: ['Other'],
  },
  paymentMethod: {
    type: String, // 'Bank', 'Cash', 'Prepaid', etc.
    default: 'Bank',
  },
  logBankOp: {
    type: String,
    enum: ['+', '-', 'none', null],
    default: null,
  },
  logCashOp: {
    type: String,
    enum: ['+', '-', 'none', null],
    default: null,
  },
  logPrepaidOp: {
    type: String,
    enum: ['+', '-', 'none', null],
    default: null,
  },
  fromAccount: {
    type: String,
    default: null,
  },
  toAccount: {
    type: String,
    default: null,
  },
  runningBalances: {
    bank: {
      type: Number,
      default: 0,
    },
    cash: {
      type: Number,
      default: 0,
    },
    prepaid: {
      type: Number,
      default: 0,
    },
  },
  runningBalancesInPiastres: {
    bank: {
      type: Number,
      default: 0,
    },
    cash: {
      type: Number,
      default: 0,
    },
    prepaid: {
      type: Number,
      default: 0,
    },
  },
  isRecurring: {
    type: Boolean,
    default: false,
    index: true,
  },
  recurringId: {
    type: Schema.Types.ObjectId,
    ref: 'RecurringSuggestion',
    default: null,
  },
  splits: [
    {
      category: {
        type: String,
        required: true,
        trim: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        trim: true,
        default: '',
      },
    },
  ],
}, {
  timestamps: true,
});

ExpenditureSchema.plugin(softDeletePlugin);

// Compound indexes for query performance and tie-breakers
ExpenditureSchema.index({ user: 1, date: -1, _id: 1 });
ExpenditureSchema.index({ user: 1, date: 1, _id: 1 });
ExpenditureSchema.index({ user: 1, paymentMethod: 1, date: -1 });
ExpenditureSchema.index({ user: 1, isRecurring: 1 });
ExpenditureSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Expenditure', ExpenditureSchema);
