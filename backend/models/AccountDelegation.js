// backend/models/AccountDelegation.js
const mongoose = require('mongoose');

const AccountDelegationSchema = new mongoose.Schema(
  {
    delegator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    delegate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    relationship: {
      type: String,
      enum: ['dependent', 'spouse', 'child', 'parent', 'client', 'accountant', 'other'],
      default: 'dependent',
    },
    permissions: {
      type: String,
      enum: ['view_only', 'full_access'],
      default: 'view_only',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'revoked'],
      default: 'active',
      index: true,
    },
    notes: {
      type: String,
      maxlength: 200,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index enforcing uniqueness per delegator-delegate pair
AccountDelegationSchema.index({ delegator: 1, delegate: 1 }, { unique: true });

// Self-delegation loop guard
AccountDelegationSchema.pre('save', function (next) {
  if (this.delegator && this.delegate && this.delegator.toString() === this.delegate.toString()) {
    return next(new Error('Self-delegation is not allowed'));
  }
  next();
});

module.exports = mongoose.model('AccountDelegation', AccountDelegationSchema);

