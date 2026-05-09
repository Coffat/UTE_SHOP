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
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const redirectUrl = user.role === 'admin' ? '/admin/profile' : '/user/profile';

    res.status(200).json({
      success: true,
      message: 'Login success',
      redirectUrl
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// ─── Forgot Password ─────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const response = await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send password recovery email'
    });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    const response = await authService.resetPassword(email, otp, newPassword);
    res.status(200).json({
      success: true,
      message: response.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed'
    });
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // Attempt to remove the refresh token from Redis (fails gracefully)
    await authService.logoutUser(refreshToken);

    // Clear both HttpOnly cookies regardless of Redis outcome
    res.clearCookie('accessToken',  { httpOnly: true, sameSite: 'strict' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Logout failed',
    });
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  logout,
};
