const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    submissionLink: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['submitted', 'graded'],
      default: 'submitted',
    },
    score: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    gradedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One submission per applicant per task
taskSubmissionSchema.index({ task: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('TaskSubmission', taskSubmissionSchema);