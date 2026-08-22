// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'viewer'],
        default: 'viewer',
    },
    totpSecret: {
        type: String,   // encrypted (AES-256) TOTP secret
        select: false,  // never returned in queries by default
    },
    totpEnabled: {
        type: Boolean,
        default: false,
    },
    backupCodes: {
        type: [String], // bcrypt-hashed backup codes
        select: false,
    },
    managedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

UserSchema.index({ managedBy: 1, role: 1 });

module.exports = mongoose.model('User', UserSchema);
