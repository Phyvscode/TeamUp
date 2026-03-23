const User         = require('../models/User');
const Conversation = require('../models/Conversation');

// ── GET /api/users/applicants ─────────────────────────────────────────────────
exports.getApplicants = async (req, res, next) => {
  try {
    const applicants = await User.find({ role: 'applicant' })
      .select('name email avatar bio skills location phone resumeUrl projects createdAt')
      .sort({ createdAt: -1 });

    res.json(applicants);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/applicants/:id ─────────────────────────────────────────────
exports.getApplicantById = async (req, res, next) => {
  try {
    const applicant = await User.findOne({ _id: req.params.id, role: 'applicant' })
      .select('name email avatar bio skills location phone resumeUrl projects createdAt');

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found.' });
    }

    res.json(applicant);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/recruiters ─────────────────────────────────────────────────
exports.getRecruiters = async (req, res, next) => {
  try {
    const recruiters = await User.find({ role: 'recruiter' })
      .select('name email avatar company')
      .sort({ createdAt: -1 });

    res.json(recruiters);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/users/start-conversation ───────────────────────────────────────
exports.startConversation = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const myId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId is required.' });
    }

    if (targetUserId.toString() === myId.toString()) {
      return res.status(400).json({ message: 'You cannot start a conversation with yourself.' });
    }

    const target = await User.findById(targetUserId).select('name role company avatar');
    if (!target) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [myId, targetUserId] },
    }).populate('participants', 'name role company avatar');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, targetUserId],
        messages:     [],
      });
      conversation = await conversation.populate('participants', 'name role company avatar');
    }

    const isApplicant = req.user.role === 'applicant';
    const other = conversation.participants.find(
      (p) => p._id.toString() !== myId.toString()
    );

    res.json({
      id:            conversation._id.toString(),
      recruiterId:   isApplicant ? other?._id : req.user._id,
      recruiterName: isApplicant ? other?.name : req.user.name,
      applicantId:   !isApplicant ? other?._id : req.user._id,
      applicantName: !isApplicant ? other?.name : req.user.name,
      company:       isApplicant ? (other?.company || '') : (req.user.company || ''),
      position:      '',
      lastMessage:   conversation.lastMessage,
      unread:        0,
      messages:      [],
    });
  } catch (err) {
    next(err);
  }
};