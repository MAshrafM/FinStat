// backend/models/Category.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const softDeletePlugin = require('../utils/softDeletePlugin');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      default: null,
    },
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.plugin(softDeletePlugin);

// Compound partial unique index enforcing uniqueness per user (or system categories when user is null) among active records
CategorySchema.index(
  { name: 1, user: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.model('Category', CategorySchema);
