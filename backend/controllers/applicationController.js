const Application  = require('../models/Application');
const Notification = require('../models/Notification');

// ── GET /api/applications ─────────────────────────────────────────────────────
// Applicant  → their own applications
// Recruiter  → applications sent to them
exports.getApplications = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'applicant'
        ? { applicant: req.user._id }
        : { recruiter: req.user._id };

    const applications = await Application.find(filter).sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/applications ────────────────────────────────────────────────────
// Body: { position, company, recruiterId? }
exports.createApplication = async (req, res, next) => {
  try {
    const { position, company, recruiterId } = req.body;

    if (!position || !company) {
      return res.status(400).json({ message: 'position and company are required.' });
    }

    const application = await Application.create({
      applicant:     req.user._id,
      applicantName: req.user.name,
      position,
      company,
      recruiter: recruiterId || undefined,
    });

    // ── Notify recruiter (user → user) ────────────────────────────────────────
    if (recruiterId) {
      await Notification.send({
        recipient: recruiterId,
        sender:    req.user._id,
        title:    'New Application Received',
        message:  `${req.user.name} applied for the ${position} position at ${company}.`,
        type:     'application',
      });
    }

    // ── Confirm to applicant ──────────────────────────────────────────────────
    await Notification.send({
      recipient: req.user._id,
      title:    'Application Submitted',
      message:  `Your application for ${position} at ${company} was submitted successfully.`,
      type:     'success',
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/applications/:id/status ───────────────────────────────────────
// Recruiter updates status → notifies applicant
// Body: { status }
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['applied', 'reviewing', 'interview', 'offered', 'rejected'];

    if (!valid.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${valid.join(', ')}.` });
    }

    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user._id },
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // ── Notify applicant of status change (user → user) ───────────────────────
    const statusMessages = {
      reviewing: 'Your application is now under review. We will be in touch soon.',
      interview: 'Great news! You have been shortlisted for an interview.',
      offered:   '🎉 Congratulations! You have received a job offer.',
      rejected:  'Thank you for your interest. Unfortunately you were not selected this time.',
    };

    if (statusMessages[status]) {
      await Notification.send({
        recipient: application.applicant,
        sender:    req.user._id,
        title:    `Application Update — ${application.position}`,
        message:  statusMessages[status],
        type:     status === 'offered' ? 'success' : status === 'interview' ? 'interview' : 'info',
      });
    }

    res.json(application);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/applications/:id ─────────────────────────────────────────────
// Applicant withdraws their own application
exports.deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({
      _id:       req.params.id,
      applicant: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    res.json({ message: 'Application withdrawn successfully.' });
  } catch (err) {
    next(err);
  }
};