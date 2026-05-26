import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getConversations,
  sendMessage,
  markAsRead,
  deleteConversation,
} from '../controllers/messageController';

const router = Router();

// All message routes require authentication
router.use(protect);

router.get   ('/',                     getConversations);
router.post  ('/',                     sendMessage);
router.patch ('/:conversationId/read', markAsRead);
router.delete('/:conversationId',      deleteConversation);

export default router;