const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authValidationRules, handleValidationErrors } = require('../middlewares/validation.middleware');

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

module.exports = router;
