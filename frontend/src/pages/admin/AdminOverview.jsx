import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTickets } from "../../context/TicketContext";
import { apiGet } from "../../api/client";
import "../../layouts/AdminLayout.css";

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const { tickets, transactions, reports, users, adminWithdrawals, adminTopUps } = useTickets();
  const [dash, setDash] = useState(null);

  useEffect(() => {
    apiGet("/admin/dashboard").then(res => { if (res.success) setDash(res.data); });
  }, []);

  const pendingTickets     = dash?.pendingTickets    ?? tickets.filter(t => t.status === "pending").length;
  const approvedTickets    = tickets.filter(t => t.status === "approved").length;
  const pendingReports     = dash?.pendingReports    ?? reports.filter(r => r.status === "pending").length;
  const completedTxs       = transactions.filter(t => t.status === "completed");
  const totalRevenue       = dash?.totalRevenue      ?? completedTxs.reduce((s, t) => s + t.amount, 0);
  const totalPlatformFee   = dash?.totalPlatformFee  ?? completedTxs.reduce((s, t) => s + (t.platformFee || 0), 0);
  const pendingWithdrawals = dash?.pendingWithdrawals ?? adminWithdrawals.filter(w => w.status === "pending").length;
  const pendingTopUps      = dash?.pendingTopUps     ?? adminTopUps.filter(t => t.status === "pending").length;
  const lockedUsers        = dash?.lockedUsers       ?? users.filter(u => !u.isActive).length;
  const expiredTickets     = dash?.expiredTickets    ?? 0;
  const totalUsers         = dash?.totalUsers        ?? users.length;
  const totalTickets       = dash?.totalTickets      ?? tickets.length;
  const totalTransactions  = dash?.totalTransactions ?? transactions.length;
  const completedCount     = dash?.completedTransactions ?? completedTxs.length;

  const recentTickets = [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentTxs     = [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const TX_STATUS = {
    completed: { label: "Hoàn thành", cls: "admin-badge-success" },
    pending:   { label: "Chờ xử lý",  cls: "admin-badge-warning" },
    cancelled: { label: "Đã hủy",     cls: "admin-badge-error" },
  };
  const TK_STATUS = {
    approved: { label: "Đã duyệt",  cls: "admin-badge-success" },
    pending:  { label: "Chờ duyệt", cls: "admin-badge-warning" },
    rejected: { label: "Từ chối",   cls: "admin-badge-error" },
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Tổng quan</h1>
        <p className="admin-page-subtitle">Thống kê hoạt động hệ thống GoTix</p>
      </div>

      {(pendingTickets > 0 || pendingReports > 0 || pendingWithdrawals > 0 || pendingTopUps > 0) && (
        <div className="admin-alert-row">
          {pendingTickets > 0 && (
            <div className="admin-alert-box info">
              <span>Có <strong>{pendingTickets} vé</strong> đang chờ xét duyệt</span>
              <button className="admin-btn admin-btn-neutral" onClick={() => navigate("/admin/tickets")}>Duyệt ngay</button>
            </div>
          )}
          {pendingReports > 0 && (
            <div className="admin-alert-box warn">
              <span>Có <strong>{pendingReports} báo cáo</strong> chưa được xử lý</span>
              <button className="admin-btn admin-btn-neutral" onClick={() => navigate("/admin/reports")}>Xem báo cáo</button>
            </div>
          )}
          {pendingTopUps > 0 && (
            <div className="admin-alert-box info">
              <span>Có <strong>{pendingTopUps} lệnh nạp tiền</strong> chờ xác minh</span>
              <button className="admin-btn admin-btn-neutral" onClick={() => navigate("/admin/topups")}>Duyệt ngay</button>
            </div>
          )}
          {pendingWithdrawals > 0 && (
            <div className="admin-alert-box warn">
              <span>Có <strong>{pendingWithdrawals} yêu cầu rút tiền</strong> chờ duyệt</span>
              <button className="admin-btn admin-btn-neutral" onClick={() => navigate("/admin/withdrawals")}>Xem ngay</button>
            </div>
          )}
        </div>
      )}

      {/* Primary stats */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng vé</p>
          <p className="admin-stat-value">{totalTickets}</p>
          <p className="admin-stat-sub">{approvedTickets} đang bán · {pendingTickets} chờ duyệt</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Người dùng</p>
          <p className="admin-stat-value">{totalUsers}</p>
          <p className="admin-stat-sub">{lockedUsers > 0 ? `${lockedUsers} bị khóa` : "Tất cả đang hoạt động"}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Giao dịch</p>
          <p className="admin-stat-value">{totalTransactions}</p>
          <p className="admin-stat-sub">{completedCount} hoàn thành</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Doanh thu hệ thống</p>
          <p className="admin-stat-value" style={{ fontSize: 18 }}>{formatPrice(totalRevenue)}</p>
          <p className="admin-stat-sub">Phí nền tảng: {formatPrice(totalPlatformFee)}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Rút tiền chờ duyệt</p>
          <p className="admin-stat-value">{pendingWithdrawals}</p>
          <p className="admin-stat-sub">đang chờ xử lý</p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="admin-stats-row" style={{ marginTop: 0 }}>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Báo cáo chờ xử lý</p>
          <p className="admin-stat-value" style={{ color: pendingReports > 0 ? "#d97706" : undefined }}>{pendingReports}</p>
          <p className="admin-stat-sub">tranh chấp cần xử lý</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Nạp tiền chờ duyệt</p>
          <p className="admin-stat-value" style={{ color: pendingTopUps > 0 ? "#2563eb" : undefined }}>{pendingTopUps}</p>
          <p className="admin-stat-sub">lệnh nạp chờ xác minh</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Vé hết hạn</p>
          <p className="admin-stat-value">{expiredTickets}</p>
          <p className="admin-stat-sub">đã tự động ẩn</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tài khoản bị khóa</p>
          <p className="admin-stat-value" style={{ color: lockedUsers > 0 ? "#ef4444" : undefined }}>{lockedUsers}</p>
          <p className="admin-stat-sub">user vi phạm</p>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="admin-section">
          <div className="admin-section-header">
            <span className="admin-section-title">Vé mới đăng gần đây</span>
            <button className="admin-btn admin-btn-neutral" onClick={() => navigate("/admin/tickets")}>Xem tất cả</button>
          </div>
          <table className="admin-table">
            <thead><tr><th>Tên vé</th><th>Giá</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {recentTickets.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="admin-cell-main" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div className="admin-cell-sub">{t.createdAt}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(t.passPrice)}</td>
                  <td><span className={`admin-badge ${TK_STATUS[t.status]?.cls}`}>{TK_STATUS[t.status]?.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-section">
          <div className="admin-section-header">
            <span className="admin-section-title">Giao dịch gần đây</span>
            <button className="admin-btn admin-btn-neutral" onClick={() => navigate("/admin/transactions")}>Xem tất cả</button>
          </div>
          <table className="admin-table">
            <thead><tr><th>Vé</th><th>Số tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {recentTxs.map(tx => (
                <tr key={tx.id}>
                  <td>
                    <div className="admin-cell-main" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.ticketTitle}</div>
                    <div className="admin-cell-sub">{tx.createdAt}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(tx.amount)}</td>
                  <td><span className={`admin-badge ${TX_STATUS[tx.status]?.cls}`}>{TX_STATUS[tx.status]?.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
