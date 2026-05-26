import { Router } from 'express';
import { protect }    from '../middleware/authMiddleware';
import { restrictTo } from '../middleware/roleMiddleware';
import {
  uploadAvatar,
  uploadCompanyLogo,
  uploadResume,
} from '../middleware/uploadMiddleware';
import {
  getProfile,
  updateProfile,
  uploadAvatar      as uploadAvatarCtrl,
  uploadCompanyLogo as uploadCompanyLogoCtrl,
  uploadResume      as uploadResumeCtrl,
  changePassword,
  addProject,
  deleteProject,
} from '../controllers/profileController';

const router = Router();

// All profile routes require authentication
router.use(protect);

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/', getProfile);
router.put('/', updateProfile);

// ── Avatar (both roles) ───────────────────────────────────────────────────────
router.post('/avatar', uploadAvatar.single('avatar'), uploadAvatarCtrl);

// ── Company logo (recruiter only) ─────────────────────────────────────────────
router.post(
  '/company-logo',
  restrictTo('recruiter'),
  uploadCompanyLogo.single('logo'),
  uploadCompanyLogoCtrl
);

// ── Resume (applicant only) ───────────────────────────────────────────────────
router.post(
  '/resume',
  restrictTo('applicant'),
  uploadResume.single('resume'),
  uploadResumeCtrl
);

// ── Password ──────────────────────────────────────────────────────────────────
router.post('/change-password', changePassword);

// ── Projects (applicant only) ─────────────────────────────────────────────────
router.post  ('/projects',              restrictTo('applicant'), addProject);
router.delete('/projects/:projectId',   restrictTo('applicant'), deleteProject);

export default router;