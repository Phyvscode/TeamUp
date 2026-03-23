const Conversation = require('../models/Conversation');
const User         = require('../models/User');
const Notification = require('../models/Notification');

const fmtTime = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

// ── Shared helper: shape a conversation doc for the frontend ──────────────────
const shapeConversation = (conv, currentUser) => {
  const userId      = currentUser._id;
  const isApplicant = currentUser.role === 'applicant';

  const other = conv.participants.find(
    (p) => p._id.toString() !== userId.toString()
  );

  const unread = conv.messages.filter(
    (m) => m.sender.toString() !== userId.toString() && !m.read
  ).length;

  const messages = conv.messages.map((m) => ({
    _id:        m._id,
    sender:     m.sender.toString() === userId.toString() ? 'me' : (isApplicant ? 'recruiter' : 'applicant'),
    senderName: m.sender.toString() === userId.toString()
      ? currentUser.name
      : other?.name || 'Unknown',
    text: m.text,
    time: fmtTime(m.createdAt || new Date()),
  }));

  return {
    id:            conv._id.toString(),
    recruiterId:   isApplicant ? other?._id?.toString() : userId.toString(),
    recruiterName: isApplicant ? other?.name : currentUser.name,
    applicantId:   !isApplicant ? other?._id?.toString() : userId.toString(),
    applicantName: !isApplicant ? other?.name : currentUser.name,
    company:       isApplicant ? (other?.company || '') : (currentUser.company || ''),
    position:      '',
    lastMessage:   conv.lastMessage || '',
    unread,
    messages,
  };
};

// ── GET /api/messages ─────────────────────────────────────────────────────────
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name company role avatar')
      .sort({ lastMessageAt: -1 });

    res.json(conversations.map((c) => shapeConversation(c, req.user)));
  } catch (err) {
    next(err);
  }
};

// ── POST /api/messages ────────────────────────────────────────────────────────
// Send a message — works for BOTH recruiter → applicant and applicant → recruiter
// Body: { receiverId, text }
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !text?.trim()) {
      return res.status(400).json({ message: 'receiverId and text are required.' });
    }

    if (receiverId.toString() === senderId.toString()) {
      return res.status(400).json({ message: 'You cannot message yourself.' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found.' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        messages:     [],
      });
    }

    conversation.messages.push({
      sender:   senderId,
      receiver: receiverId,
      text:     text.trim(),
      read:     false,
    });
    conversation.lastMessage   = text.trim();
    conversation.lastMessageAt = new Date();

    await conversation.save();

    const saved = conversation.messages[conversation.messages.length - 1];

    // ── Cross-user notification ───────────────────────────────────────────────
    await Notification.send({
      recipient: receiverId,
      sender:    senderId,
      title:     `New message from ${req.user.name}`,
      message:   text.length > 80 ? text.slice(0, 77) + '\u2026' : text,
      type:      'message',
    });

    res.status(201).json({
      _id:        saved._id,
      sender:     'me',
      senderName: req.user.name,
      text:       saved.text,
      time:       fmtTime(saved.createdAt || new Date()),
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/messages/:conversationId/read ──────────────────────────────────
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id:          req.params.conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    conversation.messages.forEach((m) => {
      if (m.sender.toString() !== userId.toString()) m.read = true;
    });

    await conversation.save();
    res.json({ message: 'Messages marked as read.' });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/messages/:conversationId ──────────────────────────────────────
exports.deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id:          req.params.conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    await conversation.deleteOne();
    res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    next(err);
  }
};