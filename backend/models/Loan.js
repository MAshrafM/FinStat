// backend/models/Loan.js
const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');
const LoanTransactionSchema = require('./LoanTransaction');

const LoanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: [true, 'Person reference is required'],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Loan notes cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Repaid', 'WrittenOff'],
      default: 'Active',
      index: true,
    },
    transactions: [LoanTransactionSchema],
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

LoanSchema.index({ user: 1, person: 1, deletedAt: 1 });
LoanSchema.index({ user: 1, status: 1, deletedAt: 1 });
LoanSchema.index({ user: 1, deletedAt: 1, createdAt: -1 });

LoanSchema.plugin(softDeletePlugin);

// Derived virtuals
LoanSchema.virtual('totalBorrowedInPiastres').get(function () {
  if (!this.transactions || this.transactions.length === 0) return 0;
  return this.transactions
    .filter((t) => t.type === 'borrow')
    .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
});

LoanSchema.virtual('totalRepaidInPiastres').get(function () {
  if (!this.transactions || this.transactions.length === 0) return 0;
  return this.transactions
    .filter((t) => t.type === 'repay')
    .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
});

LoanSchema.virtual('balanceInPiastres').get(function () {
  return this.totalBorrowedInPiastres - this.totalRepaidInPiastres;
});

LoanSchema.virtual('isFullyRepaid').get(function () {
  return this.status !== 'WrittenOff' && this.totalBorrowedInPiastres > 0 && this.balanceInPiastres <= 0;
});

LoanSchema.virtual('lastTransactionDate').get(function () {
  if (!this.transactions || this.transactions.length === 0) return this.createdAt;
  const dates = this.transactions.map((t) => new Date(t.date).getTime());
  return new Date(Math.max(...dates));
});

module.exports = mongoose.model('Loan', LoanSchema);
