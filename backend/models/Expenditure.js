// backend/models/Expenditure.js
const mongoose = require('mongoose');

const ExpenditureSchema = new mongoose.Schema({
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
  transactionValue:{
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
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Expenditure', ExpenditureSchema);
