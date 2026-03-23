const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    applicant:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recruiter:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    application:   { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    // Denormalized
    position:      { type: String, required: true },
    company:       { type: String, required: true },
    recruiterName: { type: String, required: true },
    date:          { type: String, required: true },  // "Mar 15, 2025"
    time:          { type: String, required: true },  // "10:00 AM"
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes:       { type: String, default: '' },
    meetingLink: { type: String, default: '' }, // Zoom/Meet/Teams URL
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);