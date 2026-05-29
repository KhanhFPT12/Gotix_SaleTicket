// ── Email template wrapper ─────────────────────────────────────────────────────
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
  .btn{display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600}
  .footer{padding:16px 32px;background:#f8fafc;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0}
</style></head>
<body>
<div class="wrap">
  <div class="hdr"><h1>GoTix</h1></div>
  <div class="body">${bodyHtml}</div>
  <div class="footer">GoTix — Nền tảng pass vé phim #1 Việt Nam</div>
</div>
</body></html>`;
}

// ── Brevo (recommended: free 300/day, any recipient, no domain needed) ────────
async function sendViaBrevo({ to, subject, bodyHtml }) {
  if (!process.env.BREVO_API_KEY) throw new Error('BREVO_API_KEY not set');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: {
      'api-key':      process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify({
      sender:      { name: 'GoTix', email: process.env.EMAIL_FROM_ADDRESS },
      to:          [{ email: to }],
      subject,
      htmlContent: wrap(subject, bodyHtml),
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Brevo HTTP ${res.status}`);
  }
}

// ── Resend HTTP API (requires verified domain for non-owner emails) ─────────────
async function sendViaResend({ to, subject, bodyHtml }) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    process.env.EMAIL_FROM || 'GoTix <onboarding@resend.dev>',
      to:      [to],
      subject,
      html:    wrap(subject, bodyHtml),
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Resend error ${res.status}`);
}

// ── SMTP fallback (may be blocked by some hosting providers) ──────────────────
const nodemailer = require('nodemailer');
const smtpTransport = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
  tls:  { rejectUnauthorized: false },
});

async function sendViaSmtp({ to, subject, bodyHtml }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER / SMTP_PASS not configured');
  }
  await smtpTransport.sendMail({
    from: `"GoTix" <${process.env.SMTP_USER}>`,
    to, subject, html: wrap(subject, bodyHtml),
  });
}

// ── Main send — Brevo → Resend → SMTP ─────────────────────────────────────────
async function send({ to, subject, bodyHtml }) {
  // 1. Brevo: free 300/day, any recipient, HTTP API (recommended)
  if (process.env.BREVO_API_KEY) {
    try {
      await sendViaBrevo({ to, subject, bodyHtml });
      console.log(`[email] ✓ Brevo → ${to}`);
      return;
    } catch (err) {
      console.error('[email] Brevo failed:', err.message);
    }
  }

  // 2. Resend: requires verified domain for non-owner emails
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend({ to, subject, bodyHtml });
      console.log(`[email] ✓ Resend → ${to}`);
      return;
    } catch (err) {
      console.error('[email] Resend failed:', err.message);
    }
  }

  // 3. SMTP: may be blocked on cloud hosting
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await sendViaSmtp({ to, subject, bodyHtml });
      console.log(`[email] ✓ SMTP → ${to}`);
      return;
    } catch (err) {
      console.error('[email] SMTP failed:', err.message);
    }
  }

  console.warn('[email] No provider configured. Add BREVO_API_KEY (recommended).');
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

  welcomeAndVerify: (user, token) => send({
    to: user.email,
    subject: 'Chào mừng đến với GoTix — Xác nhận tài khoản',
    bodyHtml: `
<p>Xin chào <strong>${user.name}</strong>,</p>
<p>🎉 Chào mừng bạn đến với <strong>GoTix</strong> — nền tảng pass vé phim #1 Việt Nam!</p>
<p>Tài khoản của bạn đã được tạo thành công. Bấm nút bên dưới để xác nhận email và kích hoạt đầy đủ tính năng:</p>
<a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}">
  ✅ Xác nhận tài khoản
</a>
<p style="margin-top:20px;padding:14px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;font-size:13px">
  <strong>Với GoTix bạn có thể:</strong><br>
  🎬 Đăng vé phim cần pass để tìm người mua nhanh<br>
  🛒 Mua lại vé phim từ người dùng khác với giá tốt<br>
  💬 Chat trực tiếp với người đăng vé để thương lượng<br>
  🔒 Giao dịch an toàn, được GoTix xác minh và bảo đảm
</p>
<p style="margin-top:14px;color:#6b7280;font-size:12px">
  Link xác nhận có hiệu lực trong <strong>24 giờ</strong>.<br>
  Nếu bạn không đăng ký tài khoản GoTix, hãy bỏ qua email này.
</p>`,
  }),

  // Keep old name as alias for backward compat
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
