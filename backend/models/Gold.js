// backend/models/Gold.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GoldSchema = new mongoose.Schema({
    user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // This creates a reference to the User model
    required: true,
  },
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
    status: {
        type: String,
        enum: ['hold', 'sold']
    },
    sellingPrice: { 
        type: Number,
    },
    sellingDate: {
        type: Date,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Gold', GoldSchema);
