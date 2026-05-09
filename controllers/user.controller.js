const User = require('../models/User');
const { updateUserProfile } = require('../services/user.service');

/**
 * Controller: getProfile
 *
 * Returns the authenticated user's own profile.
 * `req.user` is populated by the verifyToken middleware.
 *
 * GET /api/user/profile
 */
const getProfile = async (req, res) => {
  try {
    // req.user.id comes from the decoded JWT payload (set by verifyToken).
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error('[getProfile] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not retrieve profile.',
    });
  }
};

/**
 * Controller: editProfile
 *
 * Updates the authenticated user's profile using whitelisted fields only.
 * Delegates business logic and field sanitisation to the user service.
 *
 * PUT /api/user/profile
 */
const editProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Injected by verifyToken middleware.
    const updateData = req.body;

    const updatedUser = await updateUserProfile(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser,
    });
  } catch (err) {
    console.error('[editProfile] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not update profile.',
    });
  }
};

module.exports = { getProfile, editProfile };
