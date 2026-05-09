const nodemailer = require('nodemailer');

const sendOtpEmail = async (toEmail, otpCode) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"UTESHOP" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your UTESHOP Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Welcome to UTESHOP!</h2>
        <p style="color: #555; font-size: 16px;">Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address and activate your account.</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; padding: 10px 20px; background-color: #f4f4f4; color: #333; font-size: 24px; font-weight: bold; border-radius: 4px; letter-spacing: 2px;">
            ${otpCode}
          </span>
        </div>
        <p style="color: #555; font-size: 14px;">This OTP is valid for 5 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} UTESHOP. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail,
};
