// backend/models/RefreshToken.js
const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tokenHash: { 
    type: String, 
    required: true,
  }, // SHA-256 hash of raw refresh token
  expiresAt: { 
    type: Date, 
    required: true 
  },
  revoked: { 
    type: Boolean, 
    default: false 
  },
  rotatedAt: {
    type: Date,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ userId: 1, revoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
