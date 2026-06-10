import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTickets } from "../context/TicketContext";
import Sidebar from "../components/dashboard/Sidebar";
import StatCard from "../components/dashboard/StatCard";
import "./Dashboard.css";

const SIDEBAR_ITEMS = [
  { path: "/seller", label: "Tổng quan", icon: "◻", end: true },
  { path: "/post-ticket", label: "Đăng vé mới", icon: "+" },
  { path: "/transactions", label: "Lịch sử bán", icon: "◼" },
  { path: "/chat", label: "Tin nhắn", icon: "💬" },
  { path: "/profile", label: "Tài khoản", icon: "👤" },
];

const STATUS_LABELS = {
  approved: { label: "Đang bán", cls: "badge-success" },
  pending: { label: "Chờ duyệt", cls: "badge-warning" },
  rejected: { label: "Từ chối", cls: "badge-error" },
  sold: { label: "Đã bán hết", cls: "badge-neutral" },
};

const TX_STATUS = {
  completed: { label: "Hoàn thành", cls: "badge-success" },
  pending: { label: "Chờ xử lý", cls: "badge-warning" },
  cancelled: { label: "Đã hủy", cls: "badge-error" },
};

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

export default function SellerDashboard() {
  const { currentUser } = useAuth();
  const { tickets, transactions, reviews, deleteTicket } = useTickets();
  const [activeTab, setActiveTab] = useState("tickets");

  const myTickets = tickets.filter((t) => t.sellerId === currentUser?.id);
  const myTxs = transactions.filter((t) => t.sellerId === currentUser?.id);
  const myReviews = reviews.filter((r) => r.sellerId === currentUser?.id);

  const approved = myTickets.filter((t) => t.status === "approved").length;
  const pending = myTickets.filter((t) => t.status === "pending").length;
  const totalEarned = myTxs.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const avgRating = myReviews.length > 0
    ? (myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1)
    : "–";

  return (
    <div className="dashboard-layout-inner">
      <Sidebar items={SIDEBAR_ITEMS} title="Seller" />

      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard bán hàng</h1>
            <p className="dashboard-subtitle">{currentUser?.name}</p>
          </div>
          <Link to="/post-ticket" className="btn btn-primary btn-sm">+ Đăng vé mới</Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Vé đang bán" value={approved} sub={`${pending} chờ duyệt`} accent />
          <StatCard label="Tổng doanh thu" value={formatPrice(totalEarned)} sub="giao dịch hoàn thành" />
          <StatCard label="Đánh giá trung bình" value={avgRating} sub={`${myReviews.length} nhận xét`} />
          <StatCard label="Lượt xem vé" value={myTickets.reduce((s, t) => s + (t.views || 0), 0)} />
        </div>

        {/* Tabs */}
        <div className="dashboard-section">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "tickets" ? "active" : ""}`}
              onClick={() => setActiveTab("tickets")}
            >
              Vé của tôi <span className="tab-count-badge">{myTickets.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "sales" ? "active" : ""}`}
              onClick={() => setActiveTab("sales")}
            >
              Lịch sử bán <span className="tab-count-badge">{myTxs.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Đánh giá <span className="tab-count-badge">{myReviews.length}</span>
            </button>
          </div>

          {activeTab === "tickets" && (
            myTickets.length === 0 ? (
              <div className="empty-box">
                <p>Bạn chưa đăng vé nào.</p>
                <Link to="/post-ticket" className="btn btn-primary btn-sm mt-sm">Đăng vé ngay</Link>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vé</th>
                      <th>Loại</th>
                      <th>Ngày</th>
                      <th>Giá pass</th>
                      <th>Trạng thái</th>
                      <th>Lượt xem</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTickets.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <Link to={`/tickets/${t.id}`} className="tx-title">{t.title}</Link>
                          <div className="tx-sub">{t.location}</div>
                        </td>
                        <td className="text-sm text-secondary">{t.category}</td>
                        <td className="text-sm text-secondary">{t.date}</td>
                        <td className="font-semibold">{formatPrice(t.passPrice)}</td>
                        <td>
                          <span className={`badge ${STATUS_LABELS[t.status]?.cls}`}>
                            {STATUS_LABELS[t.status]?.label}
                          </span>
                        </td>
                        <td className="text-sm text-secondary">{t.views || 0}</td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              if (confirm("Xóa vé này?")) deleteTicket(t.id);
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
            )
          )}

          {activeTab === "sales" && (
            myTxs.length === 0 ? (
              <div className="empty-box">Chưa có giao dịch nào.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vé</th>
                      <th>Ngày</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTxs.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <div className="tx-title">{tx.ticketTitle}</div>
                          <div className="tx-sub">#{tx.id}</div>
                        </td>
                        <td className="text-sm text-secondary">{tx.createdAt}</td>
                        <td className="font-semibold">{formatPrice(tx.amount)}</td>
                        <td>
                          <span className={`badge ${TX_STATUS[tx.status]?.cls}`}>
                            {TX_STATUS[tx.status]?.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "reviews" && (
            myReviews.length === 0 ? (
              <div className="empty-box">Chưa có đánh giá nào.</div>
            ) : (
              <div className="reviews-list">
                {myReviews.map((r) => (
                  <div key={r.id} className="review-row">
                    <div className="review-row-header">
                      <span className="review-author-name">{r.reviewerName}</span>
                      <span className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                      <span className="review-date">{r.createdAt}</span>
                    </div>
                    <p className="review-row-text">{r.comment}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
