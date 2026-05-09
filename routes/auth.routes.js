const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authValidationRules, handleValidationErrors } = require('../middlewares/validation.middleware');
const { loginLimiter } = require('../middlewares/rateLimit.middleware');

// Rate limiter specifically for password-recovery endpoints (3 attempts / 15 min)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  authValidationRules,
  handleValidationErrors,
  authController.register
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for account activation
// @access  Public
router.post(
  '/verify-otp',
  authController.verifyOtp
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  loginLimiter,
  authController.login
);

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to email for password recovery
// @access  Public
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  authController.forgotPassword
);

// @route   POST /api/auth/reset-password
// @desc    Verify OTP and set a new password
// @access  Public
router.post(
  '/reset-password',
  authController.resetPassword
);

// @route   POST /api/auth/logout
// @desc    Clear cookies and invalidate refresh token in Redis
// @access  Private (cookie required, but no hard auth guard so even
//          expired-token users can cleanly log out)
router.post(
  '/logout',
  authController.logout
);

module.exports = router;
