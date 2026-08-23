// backend/models/Certificate.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const CertificateSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  period: { // Stored in months for consistent calculations
    type: Number,
    required: true,
  },
  amount: { // The principal amount invested (EGP)
    type: Number,
    required: true,
  },
  amountInPiastres: { // Internal value in piastres (1 EGP = 100 piastres)
    type: Number,
    default: 0,
  },
  interest: { // The annual interest rate (e.g., 18.5 for 18.5%)
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

CertificateSchema.plugin(softDeletePlugin);

// Compound indexes
CertificateSchema.index({ user: 1, startDate: -1 });
CertificateSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
