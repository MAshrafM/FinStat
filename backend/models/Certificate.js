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
  payoutInterval: {
    type: String,
    enum: ['monthly', 'quarterly', 'annually'],
    default: 'monthly',
  },
  lastPayoutDate: {
    type: Date,
    default: null,
  },
  totalInterestPaidInPiastres: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'withdrawn'],
    default: 'active',
    index: true,
  },
  maturityDate: {
    type: Date,
    default: null,
  },
  withdrawalDate: {
    type: Date,
    default: null,
  },
  withdrawalReason: {
    type: String,
    default: null,
    trim: true,
  },
}, {
  timestamps: true,
});

CertificateSchema.pre('save', function (next) {
  if (this.startDate && this.period && !this.maturityDate) {
    const mat = new Date(this.startDate);
    mat.setMonth(mat.getMonth() + Number(this.period));
    this.maturityDate = mat;
  }
  next();
});

CertificateSchema.plugin(softDeletePlugin);

// Compound indexes
CertificateSchema.index({ user: 1, startDate: -1 });
CertificateSchema.index({ user: 1, maturityDate: 1, status: 1 });
CertificateSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
