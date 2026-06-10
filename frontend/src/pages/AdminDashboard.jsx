import { useState } from "react";
import { useTickets } from "../context/TicketContext";
import { USERS } from "../data/mockData";
import Sidebar from "../components/dashboard/Sidebar";
import StatCard from "../components/dashboard/StatCard";
import "./Dashboard.css";
import "./AdminDashboard.css";

const SIDEBAR_ITEMS = [
  { path: "/admin", label: "Tổng quan", icon: "◻", end: true },
  { path: "/admin#tickets", label: "Duyệt vé", icon: "✓" },
  { path: "/admin#users", label: "Người dùng", icon: "👥" },
  { path: "/admin#transactions", label: "Giao dịch", icon: "◼" },
  { path: "/admin#reports", label: "Báo cáo", icon: "⚠" },
];

const TICKET_STATUS_LABELS = {
  approved: { label: "Đã duyệt", cls: "badge-success" },
  pending: { label: "Chờ duyệt", cls: "badge-warning" },
  rejected: { label: "Từ chối", cls: "badge-error" },
};

const TX_STATUS = {
  completed: { label: "Hoàn thành", cls: "badge-success" },
  pending: { label: "Chờ xử lý", cls: "badge-warning" },
  cancelled: { label: "Đã hủy", cls: "badge-error" },
};

const REPORT_STATUS = {
  pending: { label: "Chờ xử lý", cls: "badge-warning" },
  resolved: { label: "Đã xử lý", cls: "badge-success" },
  dismissed: { label: "Bỏ qua", cls: "badge-neutral" },
};

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

export default function AdminDashboard() {
  const { tickets, transactions, reports, updateTicketStatus, resolveReport } = useTickets();
  const [activeTab, setActiveTab] = useState("tickets");
  const [userSearch, setUserSearch] = useState("");

  const pendingTickets = tickets.filter((t) => t.status === "pending");
  const approvedTickets = tickets.filter((t) => t.status === "approved");
  const pendingReports = reports.filter((r) => r.status === "pending");
  const totalRevenue = transactions.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);

  const filteredUsers = USERS.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="dashboard-layout-inner">
      <Sidebar items={SIDEBAR_ITEMS} title="Admin" />

      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="dashboard-subtitle">Quản lý toàn bộ hoạt động GoTix</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Tổng vé" value={tickets.length} sub={`${pendingTickets.length} chờ duyệt`} accent />
          <StatCard label="Người dùng" value={USERS.length} />
          <StatCard label="Tổng giao dịch" value={transactions.length} sub={`${formatPrice(totalRevenue)} hoàn thành`} />
          <StatCard label="Báo cáo" value={reports.length} sub={`${pendingReports.length} chờ xử lý`} />
        </div>

        {/* Alert: pending */}
        {(pendingTickets.length > 0 || pendingReports.length > 0) && (
          <div className="admin-alerts">
            {pendingTickets.length > 0 && (
              <div className="admin-alert">
                <strong>{pendingTickets.length} vé</strong> đang chờ xét duyệt
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("tickets")}>
                  Duyệt ngay
                </button>
              </div>
            )}
            {pendingReports.length > 0 && (
              <div className="admin-alert admin-alert-warn">
                <strong>{pendingReports.length} báo cáo</strong> chưa được xử lý
                <button className="btn btn-accent btn-sm" onClick={() => setActiveTab("reports")}>
                  Xem báo cáo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="dashboard-section">
          <div className="tabs">
            <button className={`tab-btn ${activeTab === "tickets" ? "active" : ""}`} onClick={() => setActiveTab("tickets")}>
              Vé <span className="tab-count-badge">{tickets.length}</span> {pendingTickets.length > 0 && <span className="tab-badge">{pendingTickets.length}</span>}
            </button>
            <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
              Người dùng <span className="tab-count-badge">{USERS.length}</span>
            </button>
            <button className={`tab-btn ${activeTab === "transactions" ? "active" : ""}`} onClick={() => setActiveTab("transactions")}>
              Giao dịch <span className="tab-count-badge">{transactions.length}</span>
            </button>
            <button className={`tab-btn ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")}>
              Báo cáo <span className="tab-count-badge">{reports.length}</span> {pendingReports.length > 0 && <span className="tab-badge">{pendingReports.length}</span>}
            </button>
          </div>

          {/* Tickets tab */}
          {activeTab === "tickets" && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vé</th>
                    <th>Người bán</th>
                    <th>Giá pass</th>
                    <th>Ngày đăng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const seller = USERS.find((u) => u.id === t.sellerId);
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="tx-title">{t.title}</div>
                          <div className="tx-sub">{t.location}</div>
                        </td>
                        <td className="text-sm">{seller?.name || "–"}</td>
                        <td className="font-semibold">{formatPrice(t.passPrice)}</td>
                        <td className="text-sm text-secondary">{t.createdAt}</td>
                        <td>
                          <span className={`badge ${TICKET_STATUS_LABELS[t.status]?.cls}`}>
                            {TICKET_STATUS_LABELS[t.status]?.label}
                          </span>
                        </td>
                        <td>
                          {t.status === "pending" ? (
                            <div className="action-btns">
                              <button
                                className="btn btn-sm"
                                style={{ backgroundColor: "var(--color-success)", color: "white", border: "none" }}
                                onClick={() => updateTicketStatus(t.id, "approved")}
                              >
                                Duyệt
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => updateTicketStatus(t.id, "rejected")}
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => updateTicketStatus(t.id, t.status === "approved" ? "rejected" : "approved")}
                            >
                              {t.status === "approved" ? "Thu hồi" : "Kích hoạt"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Users tab */}
          {activeTab === "users" && (
            <>
              <div className="tab-toolbar">
                <input
                  type="text"
                  className="form-input"
                  style={{ maxWidth: 280 }}
                  placeholder="Tìm người dùng..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Ngày tham gia</th>
                      <th>Xác minh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="font-medium">{u.name}</td>
                        <td className="text-sm text-secondary">{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === "admin" ? "badge-error" : u.role === "seller" ? "badge-info" : "badge-neutral"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="text-sm text-secondary">{u.joinDate}</td>
                        <td>
                          <span className={`badge ${u.verified ? "badge-success" : "badge-warning"}`}>
                            {u.verified ? "Đã xác minh" : "Chưa"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Transactions tab */}
          {activeTab === "transactions" && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Vé</th>
                    <th>Số tiền</th>
                    <th>Thanh toán</th>
                    <th>Ngày</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="text-sm text-secondary">#{tx.id}</td>
                      <td>
                        <div className="tx-title">{tx.ticketTitle}</div>
                      </td>
                      <td className="font-semibold">{formatPrice(tx.amount)}</td>
                      <td className="text-sm text-secondary">{tx.paymentMethod === "momo" ? "Momo" : "Chuyển khoản"}</td>
                      <td className="text-sm text-secondary">{tx.createdAt}</td>
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
          )}

          {/* Reports tab */}
          {activeTab === "reports" && (
            reports.length === 0 ? (
              <div className="empty-box">Không có báo cáo nào.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vé bị báo cáo</th>
                      <th>Lý do</th>
                      <th>Mô tả</th>
                      <th>Ngày</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td className="text-sm font-medium">#{r.ticketId}</td>
                        <td className="text-sm">{r.reason}</td>
                        <td className="text-sm text-secondary" style={{ maxWidth: 180 }}>{r.description}</td>
                        <td className="text-sm text-secondary">{r.createdAt}</td>
                        <td>
                          <span className={`badge ${REPORT_STATUS[r.status]?.cls}`}>
                            {REPORT_STATUS[r.status]?.label}
                          </span>
                        </td>
                        <td>
                          {r.status === "pending" && (
                            <div className="action-btns">
                              <button
                                className="btn btn-sm"
                                style={{ backgroundColor: "var(--color-success)", color: "white", border: "none" }}
                                onClick={() => resolveReport(r.id, "resolved")}
                              >
                                Xử lý
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => resolveReport(r.id, "dismissed")}
                              >
                                Bỏ qua
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
