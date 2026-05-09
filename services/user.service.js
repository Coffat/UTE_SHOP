const User = require('../models/User');

/**
 * Service: updateUserProfile
 *
 * Finds a user by ID and updates ONLY the whitelisted profile fields.
 * Sensitive fields (email, password, role) are intentionally excluded
 * to prevent privilege-escalation or account-takeover attacks.
 *
 * @param {string} userId    - The authenticated user's Mongoose _id.
 * @param {Object} updateData - Raw body fields from the request.
 * @returns {Promise<Object>} Updated user document without the password field.
 */
const updateUserProfile = async (userId, updateData) => {
  // Whitelist: only these fields may be changed via this service.
  const ALLOWED_FIELDS = ['fullName', 'phone', 'address'];

  // Build a sanitised update object – silently ignore any other keys.
  const sanitisedUpdate = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (updateData[field] !== undefined) {
      sanitisedUpdate[field] = updateData[field];
    }
  });

  // findByIdAndUpdate with { new: true } returns the document AFTER the update.
  // { runValidators: true } ensures Mongoose schema validators are enforced.
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: sanitisedUpdate },
    { new: true, runValidators: true }
  ).select('-password'); // Never return the hashed password.

  return updatedUser;
};

module.exports = { updateUserProfile };
