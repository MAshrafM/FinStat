// backend/models/RebalancingTarget.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RebalancingTargetSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    default: 'Default',
    trim: true,
  },
  targets: [{
    assetType: {
      type: String,
      enum: ['stocks', 'mutualFunds', 'gold', 'cash', 'certificates'],
      required: true,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  excludeRealEstate: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

RebalancingTargetSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('RebalancingTarget', RebalancingTargetSchema);
