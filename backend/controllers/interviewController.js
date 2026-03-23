const Interview    = require('../models/Interview');
const Notification = require('../models/Notification');

// ── GET /api/interviews ───────────────────────────────────────────────────────
exports.getInterviews = async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'applicant'
        ? { applicant: req.user._id }
        : { recruiter: req.user._id };

    const interviews = await Interview.find(filter).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/interviews ──────────────────────────────────────────────────────
// Body: { applicantId, applicationId?, position, company, date, time, notes?, meetingLink? }
exports.createInterview = async (req, res, next) => {
  try {
    const { applicantId, applicationId, position, company, date, time, notes, meetingLink } = req.body;

    if (!applicantId || !position || !company || !date || !time) {
      return res.status(400).json({
        message: 'applicantId, position, company, date and time are required.',
      });
    }

    const interview = await Interview.create({
      applicant:     applicantId,
      recruiter:     req.user._id,
      application:   applicationId || undefined,
      position,
      company,
      recruiterName: req.user.name,
      date,
      time,
      notes:       notes       || '',
      meetingLink: meetingLink || '',
    });

    // ── Rich notification to applicant ────────────────────────────────────────
    const linkLine = meetingLink
      ? `\n\nMeeting link: ${meetingLink}`
      : '\n\nYour recruiter will share the meeting link shortly.';

    await Notification.send({
      recipient: applicantId,
      sender:    req.user._id,
      title:     '🗓️ Interview Confirmed!',
      message:
        `Your interview for ${position} at ${company} has been confirmed.\n` +
        `📅 Date: ${date}\n` +
        `🕐 Time: ${time}\n` +
        `👤 Recruiter: ${req.user.name}` +
        linkLine +
        `\n\nPlease be ready a few minutes before your scheduled time. Good luck!`,
      type: 'interview',
    });

    res.status(201).json(interview);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/interviews/:id ─────────────────────────────────────────────────
// Body: { status?, date?, time?, notes?, meetingLink? }
exports.updateInterview = async (req, res, next) => {
  try {
    const { status, date, time, notes, meetingLink } = req.body;

    const validStatuses = ['scheduled', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}.` });
    }

    const updates = {};
    if (status      !== undefined) updates.status      = status;
    if (date        !== undefined) updates.date        = date;
    if (time        !== undefined) updates.time        = time;
    if (notes       !== undefined) updates.notes       = notes;
    if (meetingLink !== undefined) updates.meetingLink = meetingLink;

    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found.' });
    }

    // ── Notifications per status or field update ──────────────────────────────
    if (status === 'cancelled') {
      await Notification.send({
        recipient: interview.applicant,
        sender:    req.user._id,
        title:     'Interview Cancelled',
        message:   `Your interview for ${interview.position} at ${interview.company} scheduled on ${interview.date} at ${interview.time} has been cancelled by ${req.user.name}.`,
        type:      'info',
      });
    } else if (status === 'completed') {
      await Notification.send({
        recipient: interview.applicant,
        sender:    req.user._id,
        title:     '✅ Interview Completed',
        message:   `Your interview for ${interview.position} at ${interview.company} has been marked as completed by ${req.user.name}. We will be in touch soon!`,
        type:      'success',
      });
    } else if (date || time) {
      // Rescheduled
      await Notification.send({
        recipient: interview.applicant,
        sender:    req.user._id,
        title:     '📅 Interview Rescheduled',
        message:
          `Your interview for ${interview.position} at ${interview.company} has been rescheduled.\n` +
          `📅 New Date: ${updates.date || interview.date}\n` +
          `🕐 New Time: ${updates.time || interview.time}\n` +
          `👤 Recruiter: ${req.user.name}`,
        type: 'interview',
      });
    } else if (meetingLink) {
      // Meeting link added/updated
      await Notification.send({
        recipient: interview.applicant,
        sender:    req.user._id,
        title:     '🔗 Interview Link Updated',
        message:
          `The meeting link for your ${interview.position} interview at ${interview.company} (${interview.date} at ${interview.time}) has been updated.\n\n` +
          `Meeting link: ${meetingLink}`,
        type: 'interview',
      });
    }

    res.json(interview);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/interviews/:id ────────────────────────────────────────────────
exports.deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOneAndDelete({
      _id:      req.params.id,
      recruiter: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found.' });
    }

    await Notification.send({
      recipient: interview.applicant,
      sender:    req.user._id,
      title:     'Interview Removed',
      message:   `The interview for ${interview.position} at ${interview.company} scheduled on ${interview.date} has been removed by ${req.user.name}.`,
      type:      'info',
    });

    res.json({ message: 'Interview deleted.' });
  } catch (err) {
    next(err);
  }
};