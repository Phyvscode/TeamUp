const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
  {
    email: {
      type:     String,
      required: true,
      lowercase: true,
      trim:     true,
    },
    code: {
      type:     String,
      required: true,
    },
    expiresAt: {
      type:     Date,
      required: true,
    },
    // How many times the wrong code was entered
    attempts: {
      type:    Number,
      default: 0,
    },
    // Set to a future date when attempts hit 3 — blocks all verify attempts until then
    lockedUntil: {
      type:    Date,
      default: null,
    },
    // Once verified this becomes true so the token can only be used once
    verified: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-delete documents 2 hours after creation (TTL index)
passwordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);