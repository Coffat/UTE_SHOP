const express = require('express');
const router = express.Router();

const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { getProfile, editProfile } = require('../controllers/user.controller');

/**
 * @route   GET /api/user/profile
 * @desc    Get the authenticated user's profile
 * @access  Private – roles: user, admin
 */
router.get('/profile', verifyToken, authorize('user', 'admin'), getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update the authenticated user's profile (fullName, phone, address only)
 * @access  Private – roles: user, admin
 */
router.put('/profile', verifyToken, authorize('user', 'admin'), editProfile);

module.exports = router;
