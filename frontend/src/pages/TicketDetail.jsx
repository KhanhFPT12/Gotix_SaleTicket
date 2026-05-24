import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import { useAuth } from "../context/AuthContext";
import { apiCheckFavorite, apiToggleFavorite, apiUnfavorite, apiPost } from "../api/client";
import { TICKET_CATEGORIES } from "../data/mockData";
import "./TicketDetail.css";

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}
function formatDate(d) {
  return new Date(d).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

const REPORT_REASONS = [
  { value: "fake_ticket",         label: "Vé giả" },
  { value: "invalid_qr",          label: "QR không hợp lệ" },
  { value: "seller_unresponsive", label: "Người bán không phản hồi" },
  { value: "wrong_info",          label: "Sai thông tin vé" },
  { value: "transaction_issue",   label: "Giao dịch có vấn đề" },
  { value: "other",               label: "Khác" },
];

function TrustBadge({ score }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#ef4444";
  const label = score >= 70 ? "Uy tín cao" : score >= 40 ? "Trung bình" : "Cần thận trọng";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 12, fontWeight: 600, color,
      background: color + "15", borderRadius: 99, padding: "2px 8px",
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill={color}>
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
      </svg>
      {label} {score}/100
    </span>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tickets, incrementViews } = useTickets();
  const { currentUser } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const ticket = tickets.find((t) => t.id === id);

  useEffect(() => {
    if (ticket) incrementViews(id);
    if (ticket && currentUser) {
      apiCheckFavorite(ticket.id).then(res => {
        if (res.success) setSaved(res.data.saved);
      });
    }
  }, [id]);

  if (!ticket) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Không tìm thấy vé</h2>
        <Link to="/tickets" className="btn btn-primary mt-md">Quay lại danh sách</Link>
      </div>
    );
  }

  const category = TICKET_CATEGORIES.find((c) => c.id === ticket.category);
  const discount = Math.round(((ticket.originalPrice - ticket.passPrice) / ticket.originalPrice) * 100);

  async function handleFavorite() {
    if (!currentUser || saving) return;
    setSaving(true);
    try {
      if (saved) { await apiUnfavorite(ticket.id); setSaved(false); }
      else { await apiToggleFavorite(ticket.id); setSaved(true); }
    } finally { setSaving(false); }
  }

  async function handleReport(e) {
    e.preventDefault();
    try {
      await apiPost('/reports', { ticketId: ticket.id, reason: reportReason, description: reportDesc });
    } catch { /* silent */ }
    setReportSent(true);
  }

  return (
    <div className="ticket-detail-page">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link><span>/</span>
          <Link to="/tickets">Tất cả vé</Link><span>/</span>
          <span>{ticket.title}</span>
        </nav>

        <div className="ticket-detail-layout">
          {/* Left – Image */}
          <div className="ticket-detail-media">
            <div className="ticket-detail-image-wrap">
              {ticket.images?.[0] ? (
                <img src={ticket.images[0]} alt={ticket.title} className="ticket-detail-image" />
              ) : (
                <div className="ticket-detail-placeholder">
                  <span style={{ fontSize: 48 }}>{category?.icon}</span>
                  <p>{category?.label}</p>
                </div>
              )}
              {ticket.verified && (
                <div className="verified-ribbon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Đã xác minh
                </div>
              )}
            </div>

            {/* Seller info */}
            <div className="seller-card">
              <div className="seller-card-header">
                <Link to={`/users/${ticket.sellerId}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div className="seller-avatar">{ticket.sellerName?.charAt(0) || "?"}</div>
                    <div>
                      <p className="seller-card-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {ticket.sellerName || "–"}
                        {ticket.sellerIsPro && (
                          <span style={{ fontSize: 11, fontWeight: 700, background: "#0F172A", color: "#fff", borderRadius: 4, padding: "1px 6px" }}>
                            {ticket.sellerBadge || "Pro"}
                          </span>
                        )}
                      </p>
                      <p className="seller-card-meta">
                        {ticket.sellerRating > 0 && <span>★ {ticket.sellerRating} · </span>}
                        {ticket.sellerVerified ? "Đã xác minh" : "Chưa xác minh"}
                      </p>
                      {typeof ticket.trustScore === "number" && (
                        <div style={{ marginTop: 4 }}><TrustBadge score={ticket.trustScore} /></div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right – Info */}
          <div className="ticket-detail-info">
            <div className="ticket-detail-badges">
              <span className="badge badge-neutral">{category?.label}</span>
              {ticket.verified ? (
                <span className="badge badge-success">Đã xác minh</span>
              ) : (
                <span className="badge badge-warning">Chưa xác minh</span>
              )}
            </div>

            <h1 className="ticket-detail-title">{ticket.title}</h1>

            <div className="ticket-detail-meta-grid">
              <div className="meta-row"><span className="meta-key">Địa điểm</span><span className="meta-val">{ticket.location}</span></div>
              <div className="meta-row"><span className="meta-key">Ngày &amp; giờ</span><span className="meta-val">{ticket.date ? formatDate(ticket.date) : "—"} · {ticket.time}</span></div>
              {ticket.seatInfo && <div className="meta-row"><span className="meta-key">Thông tin ghế</span><span className="meta-val">{ticket.seatInfo}</span></div>}
              <div className="meta-row"><span className="meta-key">Số lượng còn</span><span className="meta-val">{ticket.quantity} vé</span></div>
              <div className="meta-row"><span className="meta-key">Lượt xem</span><span className="meta-val">{ticket.views} lượt</span></div>
            </div>

            <div className="ticket-price-box">
              <div className="price-main">
                <span className="price-label">Giá pass</span>
                <span className="price-big">{formatPrice(ticket.passPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="price-compare">
                  <span className="price-orig">{formatPrice(ticket.originalPrice)}</span>
                  <span className="price-save">Tiết kiệm {discount}%</span>
                </div>
              )}
            </div>

            {ticket.description && (
              <div className="ticket-desc"><h3>Mô tả</h3><p>{ticket.description}</p></div>
            )}

            <div className="ticket-actions">
              {currentUser?.id === ticket.sellerId ? (
                <div className="alert alert-info">Đây là vé của bạn</div>
              ) : ticket.status === "approved" ? (
                <>
                  <Link to={`/payment/${ticket.id}`} className="btn btn-accent btn-lg" style={{ flex: 1 }}>
                    Mua ngay
                  </Link>
                  <Link to={`/chat?ticketId=${ticket.id}&sellerId=${ticket.sellerId}`} className="btn btn-outline btn-lg">
                    Chat người bán
                  </Link>
                </>
              ) : (
                <div className="alert alert-info">Vé đang chờ xét duyệt</div>
              )}
            </div>

            {currentUser && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={handleFavorite}
                  className={`btn btn-ghost btn-sm`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, color: saved ? "#ef4444" : undefined }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24"
                    fill={saved ? "currentColor" : "none"}
                    stroke="currentColor" strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {saved ? "Đã lưu vé" : "Lưu vé"}
                </button>
              </div>
            )}

            {currentUser && currentUser.id !== ticket.sellerId && (
              <div className="ticket-report-wrap">
                {!reportOpen ? (
                  <button className="report-btn" onClick={() => setReportOpen(true)}>Báo cáo vé này</button>
                ) : reportSent ? (
                  <div className="alert alert-success">Báo cáo của bạn đã được ghi nhận.</div>
                ) : (
                  <form className="report-form" onSubmit={handleReport}>
                    <h4>Báo cáo vé</h4>
                    <div className="form-group">
                      <label className="form-label">Lý do</label>
                      <select className="form-select" value={reportReason} onChange={e => setReportReason(e.target.value)} required>
                        <option value="">Chọn lý do</option>
                        {REPORT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mô tả thêm</label>
                      <textarea className="form-textarea" rows="3" value={reportDesc}
                        onChange={e => setReportDesc(e.target.value)}
                        placeholder="Chi tiết vấn đề bạn phát hiện..."
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="submit" className="btn btn-accent btn-sm" disabled={!reportReason}>Gửi báo cáo</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReportOpen(false)}>Hủy</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
