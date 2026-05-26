import mongoose, { Schema, Model } from 'mongoose';
import { IPasswordReset } from '../types';

const passwordResetSchema = new Schema<IPasswordReset>(
  {
    email: {
      type:      String,
      required:  true,
      lowercase: true,
      trim:      true,
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
    // Set to a future date when attempts >= 3 — blocks all verify attempts until then
    lockedUntil: {
      type:    Date,
      default: null,
    },
    // Becomes true once the code is successfully verified
    verified: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-delete documents 2 hours after creation (TTL index)
passwordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

const PasswordReset: Model<IPasswordReset> =
  (mongoose.models.PasswordReset as Model<IPasswordReset>) ||
  mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema);

export default PasswordReset;