import mongoose, { Schema, Model } from 'mongoose';
import { IInterview } from '../types';

const interviewSchema = new Schema<IInterview>(
  {
    applicant: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    recruiter: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    application: {
      type: Schema.Types.ObjectId,
      ref:  'Application',
    },
    // Denormalized fields for quick display without joins
    position:      { type: String, required: true },
    company:       { type: String, required: true },
    recruiterName: { type: String, required: true },
    date:          { type: String, required: true }, // e.g. "Mar 15, 2025"
    time:          { type: String, required: true }, // e.g. "10:00 AM"
    status: {
      type:    String,
      enum:    ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes:       { type: String, default: '' },
    meetingLink: { type: String, default: '' }, // Zoom / Meet / Teams URL
  },
  { timestamps: true }
);

const Interview: Model<IInterview> = (mongoose.models.Interview as Model<IInterview>) || mongoose.model<IInterview>('Interview', interviewSchema);

export default Interview;