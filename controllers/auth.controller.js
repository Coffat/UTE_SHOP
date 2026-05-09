const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const response = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const response = await authService.verifyRegistrationOtp(email, otp);
    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'OTP verification failed'
    });
  }
};

module.exports = {
  register,
  verifyOtp
};
