import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword,
} from '../middlewares/auth.validator.js';
import {
  loginLimiter,
  forgotPasswordLimiter,
} from '../../../shared/middlewares/rateLimiter.js';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', validateVerifyOtp, authController.verifyOtp);

// POST /api/v1/auth/login
router.post('/login', loginLimiter, validateLogin, authController.login);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, authController.forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// POST /api/v1/auth/logout
router.post('/logout', authController.logout);

export default router;
