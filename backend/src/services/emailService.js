const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

function wrap(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;margin:0;padding:0}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}
  .hdr{background:#0F172A;padding:24px 32px}
  .hdr h1{margin:0;color:#fff;font-size:20px;font-weight:600}
  .body{padding:28px 32px;color:#374151;line-height:1.6}
  .body p{margin:0 0 12px}
  .btn{display:inline-block;margin-top:16px;padding:10px 22px;background:#0F172A;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500}
  .footer{padding:16px 32px;background:#f8fafc;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
</style></head>
<body>
<div class="wrap">
  <div class="hdr"><h1>GoTix</h1></div>
  <div class="body">${bodyHtml}</div>
  <div class="footer">GoTix Marketplace — vé thật, an toàn, tin cậy.</div>
</div>
</body></html>`;
}

async function send({ to, subject, bodyHtml }) {
  if (!process.env.SMTP_USER) return;
  try {
    await transporter.sendMail({
      from: `"GoTix" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: wrap(subject, bodyHtml),
    });
  } catch (err) {
    console.error('[emailService] send failed:', err.message);
  }
}

const emailService = {
  ticketApproved: (user, ticket) => send({
    to: user.email,
    subject: 'Vé của bạn đã được duyệt',
    bodyHtml: `<p>Xin chào <strong>${user.name}</strong>,</p>
<p>Vé <strong>${ticket.title}</strong> của bạn đã được admin duyệt và hiển thị trên marketplace GoTix.</p>
<a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/tickets/${ticket._id}">Xem vé</a>`,
  }),

  ticketRejected: (user, ticket, note) => send({
    to: user.email,
    subject: 'Vé của bạn bị từ chối',
    bodyHtml: `<p>Xin chào <strong>${user.name}</strong>,</p>
<p>Vé <strong>${ticket.title}</strong> đã bị từ chối.</p>
${note ? `<p>Lý do: ${note}</p>` : ''}
<p>Bạn có thể chỉnh sửa và đăng lại vé.</p>`,
  }),

  transactionCompleted: (buyer, ticket, amount) => send({
    to: buyer.email,
    subject: 'Giao dịch thành công',
    bodyHtml: `<p>Xin chào <strong>${buyer.name}</strong>,</p>
<p>Giao dịch mua vé <strong>${ticket?.title || ''}</strong> trị giá <strong>${amount?.toLocaleString('vi-VN')}đ</strong> đã hoàn tất.</p>
<a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/transactions">Xem đơn hàng</a>`,
  }),

  withdrawalApproved: (user, amount) => send({
    to: user.email,
    subject: 'Yêu cầu rút tiền được duyệt',
    bodyHtml: `<p>Xin chào <strong>${user.name}</strong>,</p>
<p>Yêu cầu rút <strong>${amount?.toLocaleString('vi-VN')}đ</strong> đã được duyệt. Tiền sẽ chuyển về tài khoản trong 1-2 ngày làm việc.</p>`,
  }),

  withdrawalRejected: (user, amount, note) => send({
    to: user.email,
    subject: 'Yêu cầu rút tiền bị từ chối',
    bodyHtml: `<p>Xin chào <strong>${user.name}</strong>,</p>
<p>Yêu cầu rút <strong>${amount?.toLocaleString('vi-VN')}đ</strong> bị từ chối. Số tiền đã được hoàn vào ví.</p>
${note ? `<p>Lý do: ${note}</p>` : ''}`,
  }),

  verifyEmail: (user, token) => send({
    to: user.email,
    subject: 'Xác nhận tài khoản GoTix',
    bodyHtml: `<p>Xin chào <strong>${user.name}</strong>,</p>
<p>Cảm ơn bạn đã đăng ký tài khoản GoTix! Vui lòng bấm nút bên dưới để xác nhận địa chỉ email và kích hoạt tài khoản.</p>
<a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}">Xác nhận tài khoản</a>
<p style="margin-top:16px;color:#6b7280;font-size:13px">Link xác nhận có hiệu lực trong <strong>24 giờ</strong>.<br>Nếu bạn không đăng ký tài khoản GoTix, hãy bỏ qua email này.</p>`,
  }),

  accountDisabled: (user) => send({
    to: user.email,
    subject: 'Tài khoản GoTix bị tạm khóa',
    bodyHtml: `<p>Xin chào <strong>${user.name}</strong>,</p>
<p>Tài khoản GoTix của bạn đã bị tạm khóa bởi quản trị viên.</p>
<p>Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ đội hỗ trợ GoTix để được giải quyết.</p>`,
  }),

  accountEnabled: (user) => send({
    to: user.email,
    subject: 'Tài khoản GoTix đã được khôi phục',
    bodyHtml: `<p>Xin chào <strong>${user.name}</strong>,</p>
<p>Tài khoản GoTix của bạn đã được <strong>mở khóa</strong> và hoạt động trở lại bình thường.</p>
<a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login">Đăng nhập ngay</a>`,
  }),

  forgotPassword: (user, resetUrl) => send({
    to: user.email,
    subject: 'Đặt lại mật khẩu GoTix',
    bodyHtml: `<p>Xin chào <strong>${user.name}</strong>,</p>
<p>Nhấn nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong 15 phút.</p>
<a class="btn" href="${resetUrl}">Đặt lại mật khẩu</a>
<p style="margin-top:12px;color:#6b7280;font-size:13px">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>`,
  }),
};

module.exports = emailService;
