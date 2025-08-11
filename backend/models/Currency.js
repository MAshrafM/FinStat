// backend/models/Currency.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CurrencySchema = new mongoose.Schema({
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
    amount: { // The principal amount invested
        type: Number,
        required: true,
    },
    price: { // price paid
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Currency', CurrencySchema);
