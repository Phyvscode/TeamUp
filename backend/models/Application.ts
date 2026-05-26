import mongoose, { Schema, Model } from 'mongoose';
import { IApplication } from '../types';

const applicationSchema = new Schema<IApplication>(
  {
    applicant: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    recruiter: {
      type: Schema.Types.ObjectId,
      ref:  'User',
    },
    // Denormalized for quick display without joins
    applicantName: { type: String, required: true },
    position:      { type: String, required: true, trim: true },
    company:       { type: String, required: true, trim: true },
    appliedDate: {
      type:    String,
      default: () =>
        new Date().toLocaleDateString('en-US', {
          month: 'short',
          day:   'numeric',
          year:  'numeric',
        }),
    },
    status: {
      type:    String,
      enum:    ['applied', 'reviewing', 'interview', 'offered', 'rejected'],
      default: 'applied',
    },
  },
  { timestamps: true }
);

const Application: Model<IApplication> =
  (mongoose.models.Application as Model<IApplication>) ||
  mongoose.model<IApplication>('Application', applicationSchema);

export default Application;