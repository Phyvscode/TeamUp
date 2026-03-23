const express = require('express');
const router  = express.Router();

const {
  getConversations,
  sendMessage,
  markAsRead,
  deleteConversation,
} = require('../controllers/messageController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get  ('/',                        getConversations);
router.post ('/',                        sendMessage);
router.patch('/:conversationId/read',    markAsRead);
router.delete('/:conversationId',        deleteConversation);

module.exports = router;