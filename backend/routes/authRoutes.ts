import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  signup,
  login,
  getMe,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from '../controllers/authController';

const router = Router();

router.post('/signup',            signup);
router.post('/login',             login);
router.get ('/me',                protect, getMe);

// ── Forgot password flow (no auth required) ───────────────────────────────────
router.post('/forgot-password',   forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password',    resetPassword);

export default router;