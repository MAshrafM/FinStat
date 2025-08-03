// backend/models/MutualFundTrade.js
const mongoose = require('mongoose');

const MutualFundTradeSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    name: { // e.g., "AZ-Opportuinty MF"
        type: String,
        required: true,
    },
    code: { // e.g., "AZO"
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Buy', 'Sell', 'Coupon'],
    },
    units: { // Number of units/shares
        type: Number,
        default: 0,
    },
    price: { // Price per unit
        type: Number,
        default: 0,
    },
    fees: {
        type: Number,
        default: 0,
    },
    // The total cash value of the transaction
    totalValue: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('MutualFundTrade', MutualFundTradeSchema);
