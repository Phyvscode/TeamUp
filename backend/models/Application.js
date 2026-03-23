const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    applicant:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recruiter:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Denormalized for quick display without joins
    applicantName: { type: String, required: true },
    position:      { type: String, required: true, trim: true },
    company:       { type: String, required: true, trim: true },
    appliedDate: {
      type: String,
      default: () =>
        new Date().toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        }),
    },
    status: {
      type: String,
      enum: ['applied', 'reviewing', 'interview', 'offered', 'rejected'],
      default: 'applied',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);