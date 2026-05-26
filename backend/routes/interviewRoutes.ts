import { Router } from 'express';
import { protect }    from '../middleware/authMiddleware';
import { restrictTo } from '../middleware/roleMiddleware';
import {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
} from '../controllers/interviewController';

const router = Router();

// All interview routes require authentication
router.use(protect);

router.get   ('/',    getInterviews);
router.post  ('/',    restrictTo('recruiter'), createInterview);
router.patch ('/:id', restrictTo('recruiter'), updateInterview);
router.delete('/:id', restrictTo('recruiter'), deleteInterview);

export default router;