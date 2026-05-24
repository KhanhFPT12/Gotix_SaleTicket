import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import { useAuth } from "../context/AuthContext";
import { TICKET_CATEGORIES } from "../data/mockData";
import "./TicketDetail.css";

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tickets, incrementViews, addReport } = useTickets();
  const { currentUser } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const ticket = tickets.find((t) => t.id === id);

  useEffect(() => {
    if (ticket) incrementViews(id);
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

  async function handleReport(e) {
    e.preventDefault();
    try {
      await addReport({
        ticketId:    ticket.id,
        reason:      reportReason,
        description: reportDesc,
      });
    } catch { /* silent */ }
    setReportSent(true);
  }

  return (
    <div className="ticket-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/tickets">Tất cả vé</Link>
          <span>/</span>
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
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Đã xác minh
                </div>
              )}
            </div>

            {/* Seller info */}
            <div className="seller-card">
              <div className="seller-card-header">
                <div className="seller-avatar">
                  {ticket.sellerName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="seller-card-name">{ticket.sellerName || "–"}</p>
                  <p className="seller-card-meta">
                    {ticket.sellerRating > 0 && <span>★ {ticket.sellerRating} · </span>}
                    {ticket.sellerVerified ? "Đã xác minh" : "Chưa xác minh"}
                  </p>
                </div>
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
              {ticket.status === "approved" ? (
                <span className="badge badge-success">Đang bán</span>
              ) : (
                <span className="badge badge-neutral">{ticket.status}</span>
              )}
            </div>

            <h1 className="ticket-detail-title">{ticket.title}</h1>

            <div className="ticket-detail-meta-grid">
              <div className="meta-row">
                <span className="meta-key">Địa điểm</span>
                <span className="meta-val">{ticket.location}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Ngày &amp; giờ</span>
                <span className="meta-val">{formatDate(ticket.date)} · {ticket.time}</span>
              </div>
              {ticket.seatInfo && (
                <div className="meta-row">
                  <span className="meta-key">Thông tin ghế</span>
                  <span className="meta-val">{ticket.seatInfo}</span>
                </div>
              )}
              <div className="meta-row">
                <span className="meta-key">Số lượng còn</span>
                <span className="meta-val">{ticket.quantity} vé</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Lượt xem</span>
                <span className="meta-val">{ticket.views} lượt</span>
              </div>
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
              <div className="ticket-desc">
                <h3>Mô tả</h3>
                <p>{ticket.description}</p>
              </div>
            )}

            <div className="ticket-actions">
              {currentUser?.id === ticket.sellerId ? (
                <div className="alert alert-info">Đây là vé của bạn</div>
              ) : ticket.status === "approved" ? (
                <>
                  <Link
                    to={`/payment/${ticket.id}`}
                    className="btn btn-accent btn-lg"
                    style={{ flex: 1 }}
                  >
                    Mua ngay
                  </Link>
                  <Link
                    to={`/chat?ticketId=${ticket.id}&sellerId=${ticket.sellerId}`}
                    className="btn btn-outline btn-lg"
                  >
                    Chat người bán
                  </Link>
                </>
              ) : (
                <div className="alert alert-info">Vé đang chờ xét duyệt</div>
              )}
            </div>

            {currentUser && currentUser.id !== ticket.sellerId && (
              <div className="ticket-report-wrap">
                {!reportOpen ? (
                  <button className="report-btn" onClick={() => setReportOpen(true)}>
                    Báo cáo vé này
                  </button>
                ) : reportSent ? (
                  <div className="alert alert-success">Báo cáo của bạn đã được ghi nhận.</div>
                ) : (
                  <form className="report-form" onSubmit={handleReport}>
                    <h4>Báo cáo vé</h4>
                    <div className="form-group">
                      <label className="form-label">Lý do</label>
                      <select
                        className="form-select"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        required
                      >
                        <option value="">Chọn lý do</option>
                        <option value="Nghi ngờ vé giả">Nghi ngờ vé giả</option>
                        <option value="Thông tin sai">Thông tin sai lệch</option>
                        <option value="Vé đã qua sử dụng">Vé đã qua sử dụng</option>
                        <option value="Giá không hợp lý">Giá không hợp lý</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mô tả thêm</label>
                      <textarea
                        className="form-textarea"
                        rows="3"
                        value={reportDesc}
                        onChange={(e) => setReportDesc(e.target.value)}
                        placeholder="Chi tiết vấn đề bạn phát hiện..."
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" className="btn btn-accent btn-sm" disabled={!reportReason}>
                        Gửi báo cáo
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReportOpen(false)}>
                        Hủy
                      </button>
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
