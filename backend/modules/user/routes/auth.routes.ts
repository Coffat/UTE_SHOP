import express from 'express';
import passport from 'passport';
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

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

// ─── Social Login Routes ───────────────────────────────────────────────────
// GET /api/v1/auth/google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/v1/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.socialLoginCallback
);

// GET /api/v1/auth/facebook
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

// GET /api/v1/auth/facebook/callback
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  authController.socialLoginCallback
);

// POST /api/v1/auth/social-exchange
router.post('/social-exchange', authController.socialTokenExchange);

export default router;
