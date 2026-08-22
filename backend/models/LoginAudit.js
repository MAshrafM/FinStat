// backend/models/LoginAudit.js
const mongoose = require('mongoose');

const loginAuditSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  }, // null for failed attempts
  attemptedUsername: { 
    type: String, 
    default: null 
  }, // forensics for unknown/failed attempts
  success: { 
    type: Boolean, 
    required: true 
  },
  ip: { 
    type: String, 
    required: true 
  },
  userAgent: { 
    type: String, 
    required: true 
  },
  deviceFingerprint: { 
    type: String, 
    default: null 
  },
  action: {
    type: String,
    default: 'login',
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

loginAuditSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('LoginAudit', loginAuditSchema);
