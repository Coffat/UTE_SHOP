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

/**
 * Gửi email chào mừng khách hàng mới sau khi kích hoạt tài khoản thành công
 */
export const sendWelcomeEmail = async (toEmail: string, customerName: string): Promise<void> => {
  const transporter = createEmailTransporter();
  await transporter.sendMail({
    from: `"UTESHOP" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Chào mừng bạn đến với UTESHOP!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px 20px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="margin:0;color:#4f46e5;font-size:28px;font-weight:800;letter-spacing:-0.5px;">UTESHOP</h2>
        </div>
        <h3 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">Chào mừng ${escapeHtml(customerName)}!</h3>
        <p style="margin:0 0 16px;color:#4b5563;font-size:16px;line-height:1.6;">
          Tài khoản của bạn đã được kích hoạt thành công. Từ nay, bạn có thể trải nghiệm mua sắm hàng ngàn sản phẩm chất lượng, tích lũy điểm thưởng và nhận các ưu đãi đặc quyền dành riêng cho thành viên UTESHOP.
        </p>
        <div style="text-align:center;margin:30px 0 20px;">
          <a href="${process.env.CLIENT_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:5173'}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">Khám phá ngay</a>
        </div>
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:30px 0 20px;" />
        <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ bộ phận hỗ trợ khách hàng của chúng tôi.</p>
        <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} UTESHOP. All rights reserved.</p>
      </div>
    `,
  });
};

/**
 * Gửi email xác nhận đặt hàng thành công kèm theo hóa đơn chi tiết
 */
export const sendOrderSuccessEmail = async (toEmail: string, order: any): Promise<string | undefined> => {
  const transporter = createEmailTransporter();
  
  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return num.toLocaleString('vi-VN') + 'đ';
  };

  const recipientName = order.recipient?.fullName || 'Khách hàng';
  const recipientPhone = order.recipient?.phone || '';
  const deliveryNote = order.recipient?.deliveryNote 
    ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;"><b>Ghi chú giao hàng:</b> ${escapeHtml(order.recipient.deliveryNote)}</p>` 
    : '';
  
  let itemsHtml = '';
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const name = item.snapshotName || 'Sản phẩm';
      const qty = item.quantity || 1;
      const price = formatCurrency(item.unitPrice);
      const subtotal = formatCurrency(item.subtotal);
      itemsHtml += `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">${escapeHtml(name)}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;text-align:center;">${qty}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;text-align:right;">${price}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;text-align:right;font-weight:600;">${subtotal}</td>
        </tr>
      `;
    }
  }

  const subtotal = formatCurrency(order.subtotal);
  const shippingFee = formatCurrency(order.shippingFee);
  const discountAmount = formatCurrency(order.discountAmount);
  const pointsDiscount = formatCurrency(order.pointsDiscount);
  const finalTotal = formatCurrency(order.totalAmount || order.finalTotal);

  const result = await transporter.sendMail({
    from: `"UTESHOP" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `UTESHOP – Xác nhận đơn hàng thành công #${order.orderCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
        <div style="border-bottom:2px solid #f3f4f6;padding-bottom:16px;margin-bottom:20px;">
          <h2 style="margin:0 0 4px;color:#111827;font-size:22px;font-weight:700;">Đặt hàng thành công!</h2>
          <p style="margin:0;color:#6b7280;font-size:14px;">Mã đơn hàng: <strong style="color:#4f46e5;">#${order.orderCode}</strong> | Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>

        <p style="margin:0 0 16px;color:#374151;line-height:1.6;font-size:15px;">
          Chào <b>${escapeHtml(recipientName)}</b>, cảm ơn bạn đã mua sắm tại UTESHOP. Đơn hàng của bạn đã được tiếp nhận và đang trong quá trình chuẩn bị.
        </p>

        <!-- Delivery Address Details -->
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;border:1px solid #f3f4f6;">
          <h4 style="margin:0 0 8px;color:#111827;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Thông tin giao hàng</h4>
          <p style="margin:0;font-size:14px;color:#4b5563;"><b>Người nhận:</b> ${escapeHtml(recipientName)}</p>
          <p style="margin:4px 0 0;font-size:14px;color:#4b5563;"><b>Điện thoại:</b> ${escapeHtml(recipientPhone)}</p>
          ${deliveryNote}
        </div>

        <!-- Order Items -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;text-align:left;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px 8px;border-bottom:2px solid #e5e7eb;color:#4b5563;font-size:13px;font-weight:700;">Sản phẩm</th>
              <th style="padding:10px 8px;border-bottom:2px solid #e5e7eb;color:#4b5563;font-size:13px;font-weight:700;text-align:center;">SL</th>
              <th style="padding:10px 8px;border-bottom:2px solid #e5e7eb;color:#4b5563;font-size:13px;font-weight:700;text-align:right;">Đơn giá</th>
              <th style="padding:10px 8px;border-bottom:2px solid #e5e7eb;color:#4b5563;font-size:13px;font-weight:700;text-align:right;">Tạm tính</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Order pricing summary -->
        <div style="width:280px;margin-left:auto;margin-bottom:24px;">
          <table style="width:100%;font-size:14px;color:#4b5563;line-height:2;">
            <tr>
              <td style="text-align:left;">Tạm tính:</td>
              <td style="text-align:right;color:#111827;">${subtotal}</td>
            </tr>
            <tr>
              <td style="text-align:left;">Phí vận chuyển:</td>
              <td style="text-align:right;color:#111827;">${shippingFee}</td>
            </tr>
            ${
              order.discountAmount && Number(order.discountAmount) > 0
                ? `<tr>
                    <td style="text-align:left;color:#dc2626;">Giảm giá Voucher:</td>
                    <td style="text-align:right;color:#dc2626;">-${discountAmount}</td>
                  </tr>`
                : ''
            }
            ${
              order.pointsDiscount && Number(order.pointsDiscount) > 0
                ? `<tr>
                    <td style="text-align:left;color:#dc2626;">Dùng điểm thưởng:</td>
                    <td style="text-align:right;color:#dc2626;">-${pointsDiscount}</td>
                  </tr>`
                : ''
            }
            <tr style="border-top:1px solid #e5e7eb;font-weight:700;font-size:16px;color:#111827;">
              <td style="text-align:left;padding-top:8px;">Tổng thanh toán:</td>
              <td style="text-align:right;color:#4f46e5;padding-top:8px;">${finalTotal}</td>
            </tr>
          </table>
        </div>

        <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#6b7280;border:1px solid #f3f4f6;">
          <p style="margin:0;"><b>Phương thức thanh toán:</b> ${escapeHtml(order.paymentMethod)} | <b>Trạng thái:</b> ${escapeHtml(order.paymentStatus)}</p>
        </div>

        <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
        <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Cảm ơn bạn đã lựa chọn UTESHOP!</p>
        <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} UTESHOP. All rights reserved.</p>
      </div>
    `,
  });

  return result.messageId;
};

