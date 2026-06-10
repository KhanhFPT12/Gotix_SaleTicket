import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTickets } from "../context/TicketContext";
import Sidebar from "../components/dashboard/Sidebar";
import StatCard from "../components/dashboard/StatCard";
import "./Dashboard.css";
import "./BuyerDashboard.css";

const SIDEBAR_ITEMS = [
  { path: "/buyer", label: "Tổng quan", icon: "◻", end: true },
  { path: "/post-ticket", label: "Đăng vé mới", icon: "+" },
  { path: "/transactions", label: "Lịch sử giao dịch", icon: "◼" },
  { path: "/chat", label: "Tin nhắn", icon: "💬" },
  { path: "/profile", label: "Tài khoản", icon: "👤" },
];

const STATUS_LABELS = {
  completed: { label: "Hoàn thành", cls: "badge-success" },
  pending:   { label: "Chờ xử lý", cls: "badge-warning" },
  cancelled: { label: "Đã hủy",    cls: "badge-error" },
};

const TICKET_STATUS_LABELS = {
  approved: { label: "Đang bán",  cls: "badge-success" },
  pending:  { label: "Chờ duyệt", cls: "badge-warning" },
  rejected: { label: "Từ chối",   cls: "badge-error" },
};

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

export default function BuyerDashboard() {
  const { currentUser } = useAuth();
  const { myPosted, myPurchases, reviews, addReview, deleteTicket } = useTickets();
  const [activeTab, setActiveTab] = useState("purchases");
  const [reviewTicketId, setReviewTicketId] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const completedPurchases = myPurchases.filter((t) => t.status === "completed");
  const pendingPurchases   = myPurchases.filter((t) => t.status === "pending");
  const totalSpent         = completedPurchases.reduce((s, t) => s + t.amount, 0);
  const myApprovedTickets  = myPosted.filter((t) => t.status === "approved");

  async function submitReview(tx) {
    try {
      await addReview({
        ticketId: tx.ticketId,
        sellerId: tx.sellerId,
        rating:   reviewData.rating,
        comment:  reviewData.comment,
      });
    } catch { /* silent – review already persisted on success */ }
    setReviewTicketId(null);
    setReviewData({ rating: 5, comment: "" });
  }

  return (
    <div className="dashboard-layout-inner">
      <Sidebar items={SIDEBAR_ITEMS} title="Tài khoản" />

      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Xin chào, {currentUser?.name?.split(" ").pop()}!</h1>
            <p className="dashboard-subtitle">Quản lý vé mua và bán của bạn</p>
          </div>
          <Link to="/post-ticket" className="btn btn-primary btn-sm">+ Đăng vé</Link>
        </div>

        {myPosted.length === 0 && (
          <div className="post-cta-banner">
            <div className="post-cta-text">
              <p className="post-cta-title">Có vé muốn pass lại?</p>
              <p className="post-cta-desc">
                Đăng vé miễn phí. Vé được duyệt trong 24 giờ và hiển thị tới hàng nghìn người mua.
              </p>
            </div>
            <Link to="/post-ticket" className="btn btn-primary">Đăng vé ngay</Link>
          </div>
        )}

        <div className="stats-grid">
          <StatCard label="Vé đã mua"   value={completedPurchases.length} sub="giao dịch hoàn thành" accent />
          <StatCard label="Đang chờ"    value={pendingPurchases.length}   sub="chờ xác nhận" />
          <StatCard label="Vé đã đăng"  value={myPosted.length}           sub={`${myApprovedTickets.length} đang bán`} />
          <StatCard label="Tổng chi tiêu" value={formatPrice(totalSpent)} />
        </div>

        <div className="dashboard-section">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "purchases" ? "active" : ""}`}
              onClick={() => setActiveTab("purchases")}
            >
              Vé đã mua <span className="tab-count-badge">{myPurchases.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "posted" ? "active" : ""}`}
              onClick={() => setActiveTab("posted")}
            >
              Vé đã đăng <span className="tab-count-badge">{myPosted.length}</span>
              {myPosted.filter((t) => t.status === "pending").length > 0 && (
                <span className="tab-badge">
                  {myPosted.filter((t) => t.status === "pending").length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "purchases" && (
            myPurchases.length === 0 ? (
              <div className="empty-box">
                <p>Bạn chưa mua vé nào.</p>
                <Link to="/tickets" className="btn btn-primary btn-sm mt-sm">Tìm vé ngay</Link>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vé</th><th>Ngày</th><th>Số tiền</th><th>Trạng thái</th><th>Đánh giá</th><th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPurchases.map((tx) => {
                      const hasReview = reviews.some(
                        (r) => r.ticketId === tx.ticketId && r.reviewerId === currentUser?.id
                      );
                      return (
                        <tr key={tx.id}>
                          <td>
                            <div className="tx-title">{tx.ticketTitle}</div>
                            <div className="tx-sub">#{tx.id}</div>
                          </td>
                          <td className="text-secondary text-sm">{tx.createdAt}</td>
                          <td className="font-semibold">{formatPrice(tx.amount)}</td>
                          <td>
                            <span className={`badge ${STATUS_LABELS[tx.status]?.cls}`}>
                              {STATUS_LABELS[tx.status]?.label}
                            </span>
                          </td>
                          <td>
                            {tx.status === "completed" && !hasReview ? (
                              reviewTicketId === tx.id ? (
                                <div className="inline-review">
                                  <select
                                    className="form-select"
                                    style={{ width: "80px" }}
                                    value={reviewData.rating}
                                    onChange={(e) =>
                                      setReviewData((r) => ({ ...r, rating: Number(e.target.value) }))
                                    }
                                  >
                                    {[5, 4, 3, 2, 1].map((n) => (
                                      <option key={n} value={n}>{n} ★</option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ minWidth: 140 }}
                                    placeholder="Nhận xét..."
                                    value={reviewData.comment}
                                    onChange={(e) =>
                                      setReviewData((r) => ({ ...r, comment: e.target.value }))
                                    }
                                  />
                                  <button className="btn btn-primary btn-sm" onClick={() => submitReview(tx)}>
                                    Gửi
                                  </button>
                                  <button className="btn btn-ghost btn-sm" onClick={() => setReviewTicketId(null)}>
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button className="btn btn-outline btn-sm" onClick={() => setReviewTicketId(tx.id)}>
                                  Viết đánh giá
                                </button>
                              )
                            ) : hasReview ? (
                              <span className="text-muted text-sm">Đã đánh giá</span>
                            ) : (
                              <span className="text-muted text-sm">–</span>
                            )}
                          </td>
                          <td>
                            {tx.status === "completed" && tx.ticketId ? (
                              <button className="btn btn-primary btn-sm" onClick={() => setSelectedPurchase(tx)}>
                                Xem vé & QR
                              </button>
                            ) : (
                              <span className="text-secondary text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "posted" && (
            myPosted.length === 0 ? (
              <div className="empty-box">
                <p>Bạn chưa đăng vé nào.</p>
                <Link to="/post-ticket" className="btn btn-primary btn-sm mt-sm">Đăng vé đầu tiên</Link>
              </div>
            ) : (
              <>
                <div className="posted-toolbar">
                  <Link to="/post-ticket" className="btn btn-outline btn-sm">+ Đăng thêm vé</Link>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tên vé</th><th>Loại</th><th>Ngày</th>
                        <th>Giá pass</th><th>Trạng thái</th><th>Lượt xem</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPosted.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <Link to={`/tickets/${t.id}`} className="tx-title hover-link">{t.title}</Link>
                            <div className="tx-sub">{t.location}</div>
                          </td>
                          <td className="text-sm text-secondary">{t.category}</td>
                          <td className="text-sm text-secondary">{t.date}</td>
                          <td className="font-semibold">{formatPrice(t.passPrice)}</td>
                          <td>
                            <span className={`badge ${TICKET_STATUS_LABELS[t.status]?.cls}`}>
                              {TICKET_STATUS_LABELS[t.status]?.label}
                            </span>
                          </td>
                          <td className="text-sm text-secondary">{t.views || 0}</td>
                          <td>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (window.confirm("Xóa vé này khỏi danh sách?")) deleteTicket(t.id);
                              }}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {myPosted.some((t) => t.status === "pending") && (
                  <div className="pending-note">
                    Vé đang chờ duyệt sẽ được kiểm tra trong vòng 24 giờ làm việc.
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* ── Buyer Ticket & QR Modal ── */}
      {selectedPurchase && (
        <div className="buyer-modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedPurchase(null)}>
          <div className="buyer-modal">
            <div className="buyer-modal-header">
              <h3>Thông tin vé phim (Mã GD: #{selectedPurchase.id})</h3>
              <button className="buyer-modal-close" onClick={() => setSelectedPurchase(null)}>×</button>
            </div>
            <div className="buyer-modal-body">
              <div className="buyer-modal-grid">
                <div className="buyer-modal-field">
                  <div className="buyer-modal-label">Tên phim</div>
                  <div className="buyer-modal-value" style={{ fontWeight: 700, fontSize: "14px" }}>
                    {selectedPurchase.ticketTitle}
                  </div>
                </div>
                <div className="buyer-modal-field">
                  <div className="buyer-modal-label">Trạng thái GD</div>
                  <div className="buyer-modal-value">
                    <span className={`badge ${STATUS_LABELS[selectedPurchase.status]?.cls}`}>
                      {STATUS_LABELS[selectedPurchase.status]?.label}
                    </span>
                  </div>
                </div>
                <div className="buyer-modal-field">
                  <div className="buyer-modal-label">Rạp chiếu</div>
                  <div className="buyer-modal-value">{selectedPurchase.ticketData?.cinema || selectedPurchase.ticketData?.location || "–"}</div>
                </div>
                <div className="buyer-modal-field">
                  <div className="buyer-modal-label">Khu vực / Địa chỉ</div>
                  <div className="buyer-modal-value">
                    {[selectedPurchase.ticketData?.city, selectedPurchase.ticketData?.cinemaAddress].filter(Boolean).join(" · ") || "–"}
                  </div>
                </div>
                <div className="buyer-modal-field">
                  <div className="buyer-modal-label">Suất chiếu</div>
                  <div className="buyer-modal-value">
                    {[selectedPurchase.ticketData?.date, selectedPurchase.ticketData?.time].filter(Boolean).join(" · ") || "–"}
                  </div>
                </div>
                <div className="buyer-modal-field">
                  <div className="buyer-modal-label">Phòng / Số ghế</div>
                  <div className="buyer-modal-value">
                    {[selectedPurchase.ticketData?.room ? `Phòng ${selectedPurchase.ticketData.room}` : "", selectedPurchase.ticketData?.seats?.length > 0 ? `Ghế ${(selectedPurchase.ticketData.seats).join(", ")}` : ""].filter(Boolean).join(" · ") || "–"}
                  </div>
                </div>
                <div className="buyer-modal-field">
                  <div className="buyer-modal-label">Số lượng</div>
                  <div className="buyer-modal-value">{selectedPurchase.quantity} vé</div>
                </div>
                <div className="buyer-modal-field">
                  <div className="buyer-modal-label">Số tiền đã trả</div>
                  <div className="buyer-modal-value" style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                    {formatPrice(selectedPurchase.amount)}
                  </div>
                </div>
              </div>

              {selectedPurchase.ticketData?.description && (
                <div className="buyer-modal-field">
                  <div className="buyer-modal-label">Mô tả thêm</div>
                  <div className="buyer-modal-value desc">{selectedPurchase.ticketData.description}</div>
                </div>
              )}

              {/* Photos Section for Buyer */}
              <div className="buyer-modal-field">
                <div className="buyer-modal-label">Hình ảnh vé đã sở hữu</div>
                <div className="buyer-modal-images">
                  <div className="buyer-image-card">
                    <div className="buyer-image-card-title">Ảnh vé xem phim</div>
                    <div className="buyer-image-card-body">
                      {selectedPurchase.ticketData?.images?.[0] ? (
                        <img src={selectedPurchase.ticketData.images[0]} alt="Ảnh vé" onClick={() => window.open(selectedPurchase.ticketData.images[0])} style={{ cursor: "pointer" }} />
                      ) : (
                        <div className="buyer-image-placeholder">Chưa được đính kèm ảnh vé</div>
                      )}
                    </div>
                  </div>
                  <div className="buyer-image-card">
                    <div className="buyer-image-card-title">Mã QR Code vào cổng</div>
                    <div className="buyer-image-card-body">
                      {selectedPurchase.ticketData?.images?.[1] ? (
                        <img src={selectedPurchase.ticketData.images[1]} alt="Mã QR" onClick={() => window.open(selectedPurchase.ticketData.images[1])} style={{ cursor: "pointer" }} />
                      ) : (
                        <div className="buyer-image-placeholder">Chưa được đính kèm mã QR</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="buyer-modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedPurchase(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
