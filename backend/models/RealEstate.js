// backend/models/RealEstate.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const RealEstateSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['Residential', 'Commercial', 'Land', 'Villa', 'Other'],
    default: 'Residential',
  },
  area: {
    type: Number, // Area in square meters (m²)
    default: 0,
  },
  location: {
    type: String,
    trim: true,
    default: '',
  },
  purchasePrice: {
    type: Number, // EGP amount paid
    required: true,
  },
  purchasePriceInPiastres: {
    type: Number,
    default: 0,
  },
  currentValuation: {
    type: Number, // User estimated market/selling value (EGP)
    required: true,
  },
  currentValuationInPiastres: {
    type: Number,
    default: 0,
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Owned', 'Sold'],
    default: 'Owned',
  },
  sellingPrice: {
    type: Number,
    default: 0,
  },
  sellingPriceInPiastres: {
    type: Number,
    default: 0,
  },
  sellingDate: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

RealEstateSchema.plugin(softDeletePlugin);

RealEstateSchema.index({ user: 1, purchaseDate: -1 });
RealEstateSchema.index({ user: 1, status: 1 });
RealEstateSchema.index({ user: 1, deletedAt: 1 });

module.exports = mongoose.model('RealEstate', RealEstateSchema);
