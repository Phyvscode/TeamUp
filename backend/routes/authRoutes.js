const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  signup,
  login,
  getMe,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} = require('../controllers/authController');

router.post('/signup',              signup);
router.post('/login',               login);
router.get('/me',                   protect, getMe);

// ── Forgot password flow (no auth required) ───────────────────────────────────
router.post('/forgot-password',     forgotPassword);
router.post('/verify-reset-code',   verifyResetCode);
router.post('/reset-password',      resetPassword);

module.exports = router;