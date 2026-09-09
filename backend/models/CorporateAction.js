// backend/models/CorporateAction.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const CorporateActionSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stockCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  broker: {
    type: String,
    required: true,
    enum: ['Thndr', 'EFG', 'Telda'],
  },
  type: {
    type: String,
    required: true,
    enum: ['split', 'bonus'],
  },
  ratio: {
    type: Number,
    required: true,
    min: 0.0001,
  },
  effectiveDate: {
    type: Date,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

CorporateActionSchema.plugin(softDeletePlugin);

CorporateActionSchema.index({ user: 1, stockCode: 1, effectiveDate: 1 });
CorporateActionSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('CorporateAction', CorporateActionSchema);
