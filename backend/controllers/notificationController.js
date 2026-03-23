const Notification = require('../models/Notification');
const User         = require('../models/User');

// ── GET /api/notifications ────────────────────────────────────────────────────
// Returns all notifications for the logged-in user, newest first
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar role company')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/notifications/send ─────────────────────────────────────────────
// Explicitly send a notification from the logged-in user to another user.
// Body: { recipientId, title, message, type? }
exports.sendNotification = async (req, res, next) => {
  try {
    const { recipientId, title, message, type } = req.body;

    if (!recipientId || !title || !message) {
      return res.status(400).json({ message: 'recipientId, title, and message are required.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found.' });
    }

    const notification = await Notification.send({
      recipient: recipientId,
      sender:    req.user._id,
      title,
      message,
      type: type || 'info',
    });

    // Return the notification with sender populated
    const populated = await notification.populate('sender', 'name avatar role company');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/read ─────────────────────────────────────────────
// Mark ALL unread notifications as read
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
// Mark one notification as read
exports.markOneRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    res.json(notification);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id:       req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/notifications/unread-count ───────────────────────────────────────
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read:      false,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};