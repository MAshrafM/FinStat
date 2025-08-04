// backend/models/Gold.js
const mongoose = require('mongoose');

const GoldSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    item: { 
        type: String,
        required: true,
    },
    karat: { // e.g., 24, 22, 21, 18
        type: Number,
        required: true,
    },
    weight: { 
        type: Number,
        required: true,
    },
    price: { 
        type: Number,
        required: true,
    },
    paid: { 
        type: Number,
        required: true,
    },
    seller: {
        type: String,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Gold', GoldSchema);
