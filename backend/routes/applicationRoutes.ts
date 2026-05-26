import { Router } from 'express';
import { protect }    from '../middleware/authMiddleware';
import { restrictTo } from '../middleware/roleMiddleware';
import {
  getApplications,
  createApplication,
  updateStatus,
  deleteApplication,
} from '../controllers/applicationController';

const router = Router();

// All application routes require authentication
router.use(protect);

router.get   ('/',           getApplications);
router.post  ('/',           restrictTo('applicant'), createApplication);
router.patch ('/:id/status', restrictTo('recruiter'), updateStatus);
router.delete('/:id',        restrictTo('applicant'), deleteApplication);

export default router;