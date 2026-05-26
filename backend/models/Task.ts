import mongoose, { Schema, Model } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>(
  {
    title: {
      type:     String,
      required: true,
      trim:     true,
    },
    description: {
      type:    String,
      default: '',
    },
    link: {
      type:     String,
      required: true,
      trim:     true,
    },
    difficulty: {
      type:     String,
      enum:     ['easy', 'medium', 'hard'],
      required: true,
    },
    recruiter: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    recruiterName: {
      type:     String,
      required: true,
    },
    // Empty array = broadcast to ALL applicants; populated = targeted to specific users
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
    dueDate: {
      type:    Date,
      default: null,
    },
    maxScore: {
      type:    Number,
      default: 100,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Task: Model<ITask> = (mongoose.models.Task as Model<ITask>) || mongoose.model<ITask>('Task', taskSchema);

export default Task;