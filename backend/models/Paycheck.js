// backend/models/Paycheck.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaycheckSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // This creates a reference to the User model
    required: true,
  },
  month: {
    type: String,
    required: true, // e.g., "2024-07" for July 2024
  },
  type: {
    type: String,
    required: true,
    enum: ['Cash', 'Prepaid'], // Only allows these two values
  },
  amount: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
    trim: true, // Removes whitespace from start and end
  },
  insuranceDeduction: {
    type: Number,
    default: 0,
  },
  grossAmount: {
    type: Number,
    default: 0,
  },
  taxDeduction: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now, // Automatically sets the creation date
  },
});

module.exports = mongoose.model('Paycheck', PaycheckSchema);
