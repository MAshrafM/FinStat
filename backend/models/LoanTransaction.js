// backend/models/LoanTransaction.js
const mongoose = require('mongoose');

const LoanTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['borrow', 'repay'],
      required: [true, 'Transaction type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
    },
    amountInPiastres: {
      type: Number,
      required: [true, 'Amount in piastres is required'],
      min: [1, 'Amount must be at least 1 piastre'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [300, 'Transaction note cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = LoanTransactionSchema;
