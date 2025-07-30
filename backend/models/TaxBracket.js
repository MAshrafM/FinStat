// backend/models/TaxBracket.js
const mongoose = require('mongoose');

// This defines the structure for a single tax level/bracket
const BracketLevelSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  from: { type: Number, required: true },
  to: { type: Number, required: true },
  rate: { type: Number, required: true }, // e.g., 0.10 for 10%
});

// This is the main schema. We will only ever have ONE document of this type.
const TaxBracketSchema = new mongoose.Schema({
  // An identifier to make it easy to find the single document
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
