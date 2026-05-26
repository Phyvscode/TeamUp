import mongoose, { Schema, Model } from 'mongoose';
import { ITaskSubmission } from '../types';

const taskSubmissionSchema = new Schema<ITaskSubmission>(
  {
    task: {
      type:     Schema.Types.ObjectId,
      ref:      'Task',
      required: true,
    },
    applicant: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    applicantName: {
      type:     String,
      required: true,
    },
    submissionLink: {
      type:     String,
      required: true,
      trim:     true,
    },
    note: {
      type:    String,
      default: '',
    },
    status: {
      type:    String,
      enum:    ['submitted', 'graded'],
      default: 'submitted',
    },
    score: {
      type:    Number,
      default: null,
    },
    feedback: {
      type:    String,
      default: '',
    },
    gradedAt: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One submission per applicant per task
taskSubmissionSchema.index({ task: 1, applicant: 1 }, { unique: true });

const TaskSubmission: Model<ITaskSubmission> =
  (mongoose.models.TaskSubmission as Model<ITaskSubmission>) ||
  mongoose.model<ITaskSubmission>('TaskSubmission', taskSubmissionSchema);

export default TaskSubmission;