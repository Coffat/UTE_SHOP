import nodemailer from 'nodemailer';

export const createEmailTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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
  const transporter = createEmailTransporter();

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

interface SendNotificationEmailParams {
  toEmail: string;
  title: string;
  body: string;
  actionUrl?: string;
}

export const sendNotificationEmail = async ({
  toEmail,
  title,
  body,
  actionUrl,
}: SendNotificationEmailParams): Promise<string | undefined> => {
  const transporter = createEmailTransporter();
  const frontendUrl = process.env.CLIENT_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:5173';
  const resolvedActionUrl = actionUrl
    ? actionUrl.startsWith('http')
      ? actionUrl
      : `${frontendUrl}${actionUrl.startsWith('/') ? actionUrl : `/${actionUrl}`}`
    : undefined;

  const result = await transporter.sendMail({
    from: `"UTESHOP" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `UTESHOP – ${title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
        <h2 style="margin:0 0 12px;color:#111827;">${escapeHtml(title)}</h2>
        <p style="margin:0 0 18px;color:#374151;line-height:1.6;">${escapeHtml(body)}</p>
        ${
          resolvedActionUrl
            ? `<a href="${resolvedActionUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;">Xem chi tiết</a>`
            : ''
        }
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0;" />
        <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} UTESHOP</p>
      </div>
    `,
  });

  return result.messageId;
};
