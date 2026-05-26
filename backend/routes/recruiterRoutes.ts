import { Router } from 'express';
import { protect }    from '../middleware/authMiddleware';
import { restrictTo } from '../middleware/roleMiddleware';
import {
  getApplicants,
  getDashboard,
  getAnalytics,
} from '../controllers/recruiterController';

const router = Router();

// All recruiter routes require authentication + recruiter role
router.use(protect);
router.use(restrictTo('recruiter'));

router.get('/dashboard',  getDashboard);
router.get('/analytics',  getAnalytics);
router.get('/applicants', getApplicants);

export default router;