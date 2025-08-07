// backend/models/Certificate.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CertificateSchema = new mongoose.Schema({
    user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // This creates a reference to the User model
    required: true,
  },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    period: { // Stored in months for consistent calculations
        type: Number,
        required: true,
    },
    amount: { // The principal amount invested
        type: Number,
        required: true,
    },
    interest: { // The annual interest rate (e.g., 18.5 for 18.5%)
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Certificate', CertificateSchema);
