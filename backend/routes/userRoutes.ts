import { Router } from 'express';
import { protect }    from '../middleware/authMiddleware';
import { restrictTo } from '../middleware/roleMiddleware';
import {
  getApplicants,
  getApplicantById,
  getRecruiters,
  startConversation,
} from '../controllers/userController';

const router = Router();

// All user routes require authentication
router.use(protect);

// Recruiter browses all applicants
router.get('/applicants',     restrictTo('recruiter'), getApplicants);

// Recruiter views a specific applicant's profile
router.get('/applicants/:id', restrictTo('recruiter'), getApplicantById);

// Applicant browses all recruiters
router.get('/recruiters',     restrictTo('applicant'), getRecruiters);

// Either role starts (or retrieves) a conversation with another user
router.post('/start-conversation', startConversation);

export default router;