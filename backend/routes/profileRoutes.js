const express    = require('express');
const router     = express.Router();
const { protect }    = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const {
  uploadAvatar,
  uploadCompanyLogo,
  uploadResume,
} = require('../middleware/uploadMiddleware');

const {
  getProfile,
  updateProfile,
  uploadAvatar:       uploadAvatarCtrl,
  uploadCompanyLogo:  uploadCompanyLogoCtrl,
  uploadResume:       uploadResumeCtrl,
  changePassword,
  addProject,
  deleteProject,
} = require('../controllers/profileController');

// All profile routes require authentication
router.use(protect);

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/',    getProfile);
router.put('/',    updateProfile);

// ── Avatar ────────────────────────────────────────────────────────────────────
router.post('/avatar', uploadAvatar.single('avatar'), uploadAvatarCtrl);

// ── Company logo (recruiter) ──────────────────────────────────────────────────
router.post('/company-logo', restrictTo('recruiter'), uploadCompanyLogo.single('logo'), uploadCompanyLogoCtrl);

// ── Resume (applicant) ────────────────────────────────────────────────────────
router.post('/resume', restrictTo('applicant'), uploadResume.single('resume'), uploadResumeCtrl);

// ── Password ──────────────────────────────────────────────────────────────────
router.post('/change-password', changePassword);

// ── Projects (applicant only) ─────────────────────────────────────────────────
router.post('/projects',              restrictTo('applicant'), addProject);
router.delete('/projects/:projectId', restrictTo('applicant'), deleteProject);

module.exports = router;