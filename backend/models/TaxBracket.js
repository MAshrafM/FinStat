// backend/models/TaxBracket.js
const mongoose = require('mongoose');

const BracketLevelSchema = new mongoose.Schema({
  level: { type: Number },
  from: { type: Number, required: true },
  fromInPiastres: { type: Number, default: 0 },
  to: { type: Number, required: true }, // Use a very large number for infinity e.g. 1000000000
  toInPiastres: { type: Number, default: 0 },
  rate: { type: Number, required: true }, // percentage e.g. 2.5 for 2.5%, or 0.025
});

const TaxBracketSchema = new mongoose.Schema({
  country: {
    type: String,
    default: 'Egypt',
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  brackets: [BracketLevelSchema],
  personalExemption: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

TaxBracketSchema.index({ country: 1, year: 1 }, { unique: true });
TaxBracketSchema.index({ year: 1, isActive: 1 });

module.exports = mongoose.model('TaxBracket', TaxBracketSchema);
