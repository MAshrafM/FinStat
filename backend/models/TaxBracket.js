// backend/models/TaxBracket.js
const mongoose = require('mongoose');

// This defines the structure for a single tax level/bracket
const BracketLevelSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  from: { type: Number, required: true },
  fromInPiastres: { type: Number, default: 0 },
  to: { type: Number, required: true },
  toInPiastres: { type: Number, default: 0 },
  rate: { type: Number, required: true }, // e.g., 0.10 for 10%
});

// Singleton schema for tax brackets
const TaxBracketSchema = new mongoose.Schema({
  identifier: {
    type: String,
    default: 'singleton',
    unique: true,
  },
  brackets: [BracketLevelSchema],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TaxBracket', TaxBracketSchema);
