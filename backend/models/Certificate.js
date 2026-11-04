// backend/models/Certificate.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const CertificateSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  period: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  amountInPiastres: {
    type: Number,
    default: 0,
  },
  interest: {
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
  maturityDateDerived: {
    type: Boolean,
    default: true,
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
  linkedExpenditureId: {
    type: Schema.Types.ObjectId,
    ref: 'Expenditure',
    default: null,
    index: true,
  },
}, {
  timestamps: true,
});

CertificateSchema.pre('save', function (next) {
  if (!this.maturityDate && this.startDate && this.period) {
    const { addMonthsClamped } = require('../utils/interestAccrual');
    this.maturityDate = addMonthsClamped(this.startDate, Number(this.period));
    this.maturityDateDerived = true;
  }
  next();
});

CertificateSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Certificate', CertificateSchema);
