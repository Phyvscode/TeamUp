const express = require('express');
const router  = express.Router();

const {
  getNotifications,
  sendNotification,
  markAllRead,
  markOneRead,
  deleteNotification,
  getUnreadCount,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// GET all notifications for the logged-in user
router.get   ('/',              getNotifications);

// GET unread count (used for badge in nav)
router.get   ('/unread-count',  getUnreadCount);

// POST — explicitly send a notification from one user to another
// Body: { recipientId, title, message, type? }
router.post  ('/send',          sendNotification);

// PATCH — mark all as read (bulk)
router.patch ('/read',          markAllRead);

// PATCH — mark single notification as read
router.patch ('/:id/read',      markOneRead);

// DELETE — delete a single notification
router.delete('/:id',           deleteNotification);

module.exports = router;