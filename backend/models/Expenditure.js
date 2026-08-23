// backend/models/Expenditure.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenditureSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // This creates a reference to the User model
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
  cash: {
    type: Number,
    required: true,
    default: 0,
  },
  prepaid: {
    type: Number,
    required: true,
    default: 0,
  },
  transactionValue: {
    type: Number,
    required: true,
    default: 0,
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['W', 'T', 'S', 'na'], // Withdraw, Top-up, Saving, log
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
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Index for balance propagation and chronological queries
ExpenditureSchema.index({ user: 1, date: 1, _id: 1 });

module.exports = mongoose.model('Expenditure', ExpenditureSchema);

