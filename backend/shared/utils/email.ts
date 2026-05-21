import nodemailer from 'nodemailer';

/**
 * Gửi email OTP (dùng chung cho register & forgot-password)
 * @param toEmail - Địa chỉ email đích
 * @param otpCode - Mã OTP 6 chữ số
 * @param type - Loại OTP để tuỳ chỉnh tiêu đề
 */
export const sendOtpEmail = async (
  toEmail: string,
  otpCode: string,
  type: 'register' | 'reset' = 'register'
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const subject =
    type === 'reset'
      ? 'UTESHOP – Đặt lại mật khẩu'
      : 'UTESHOP – Xác minh tài khoản';

  const heading =
    type === 'reset'
      ? 'Yêu cầu đặt lại mật khẩu'
      : 'Chào mừng đến UTESHOP!';

  const body =
    type === 'reset'
      ? 'Dùng mã OTP sau để đặt lại mật khẩu của bạn:'
      : 'Cảm ơn bạn đã đăng ký. Dùng mã OTP sau để kích hoạt tài khoản:';

  const mailOptions = {
    from: `"UTESHOP" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:8px">
        <h2 style="color:#333;text-align:center">${heading}</h2>
        <p style="color:#555;font-size:16px">${body}</p>
        <div style="text-align:center;margin:20px 0">
          <span style="display:inline-block;padding:10px 20px;background:#f4f4f4;color:#333;font-size:24px;font-weight:bold;border-radius:4px;letter-spacing:2px">
            ${otpCode}
          </span>
        </div>
        <p style="color:#555;font-size:14px">Mã OTP có hiệu lực trong <strong>5 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#999;font-size:12px;text-align:center">© ${new Date().getFullYear()} UTESHOP. All rights reserved.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
