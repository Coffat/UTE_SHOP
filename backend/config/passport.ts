import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../modules/user/models/User.js';
import Customer from '../modules/user/models/Customer.js';
import UserStatus from '../shared/enums/UserStatus.js';
import { sendWelcomeEmail } from '../shared/utils/email.js';
import dotenv from 'dotenv';

dotenv.config();

// Define a common callback handler for social login
const handleSocialLogin = async (
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: any
) => {
  try {
    const email = profile.emails && profile.emails[0]?.value;
    if (!email) {
      return done(new Error('No email associated with this account.'));
    }

    // Try to find user by email
    let user = await User.findOne({ email });

    const providerId = profile.id;
    const provider = profile.provider; // 'google' or 'facebook'

    if (user) {
      // User exists, link account if not already linked
      let changed = false;
      if (provider === 'google' && !user.googleId) {
        user.googleId = providerId;
        changed = true;
      } else if (provider === 'facebook' && !user.facebookId) {
        user.facebookId = providerId;
        changed = true;
      }
      
      // Auto-migrate lowercase role to uppercase and ensure fullName exists
      if (user.role === 'customer') {
        user.role = 'CUSTOMER';
        changed = true;
      }
      
      if (user.role === 'CUSTOMER' && !(user as any).fullName) {
        (user as any).fullName = profile.displayName || email.split('@')[0];
        changed = true;
      }
      
      if (changed) {
        await user.save();
      }
      return done(null, user);
    }

    // User does not exist, create new Customer
    const fullName = profile.displayName || (profile.name ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() : '') || email.split('@')[0];
    
    user = new Customer({
      email,
      fullName,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      role: 'CUSTOMER',
      isActive: true,
      ...(provider === 'google' && { googleId: providerId }),
      ...(provider === 'facebook' && { facebookId: providerId }),
    });

    await user.save();

    // Gửi email chào mừng khách hàng mới (chạy background)
    sendWelcomeEmail(email, fullName).catch((err) => {
      console.error('[Passport] Lỗi khi gửi email chào mừng:', err);
    });

    return done(null, user);
  } catch (error) {
    return done(error);
  }
};

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
      callbackURL: '/api/v1/auth/google/callback',
    },
    handleSocialLogin
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || 'placeholder',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'placeholder',
      callbackURL: '/api/v1/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name'],
    },
    handleSocialLogin
  )
);

export default passport;
