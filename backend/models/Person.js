// backend/models/Person.js
const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const PersonSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Person name is required'],
      trim: true,
      maxlength: [100, 'Person name cannot exceed 100 characters'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PersonSchema.index({ user: 1, deletedAt: 1, name: 1 });
PersonSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Person', PersonSchema);
