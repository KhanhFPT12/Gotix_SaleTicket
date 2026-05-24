import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import "../../layouts/AdminLayout.css";

const ROLE_CONFIG = {
  admin: { label: "Admin", cls: "admin-badge-error" },
  user:  { label: "User",  cls: "admin-badge-neutral" },
};

export default function AdminUsers() {
  const { users, tickets, transactions } = useTickets();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const filtered = users
    .filter((u) => filterRole === "all" || u.role === filterRole)
    .filter((u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );

  function getUserStats(userId) {
    const posted = tickets.filter((t) => t.sellerId === userId).length;
    const bought = transactions.filter((t) => t.buyerId === userId && t.status === "completed").length;
    return { posted, bought };
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Người dùng</h1>
        <p className="admin-page-subtitle">Quản lý toàn bộ tài khoản trên hệ thống</p>
      </div>

      {/* Stats row */}
      <div className="admin-stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng tài khoản</p>
          <p className="admin-stat-value">{users.length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Người dùng</p>
          <p className="admin-stat-value">{users.filter(u => u.role === "user").length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Admin</p>
          <p className="admin-stat-value">{users.filter(u => u.role === "admin").length}</p>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">Danh sách tài khoản</span>
          <div className="admin-section-actions">
            <input
              className="admin-search"
              placeholder="Tìm theo tên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-search"
              style={{ minWidth: 130 }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Tất cả role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Role</th>
                <th>Ngày tham gia</th>
                <th>Vé đã đăng</th>
                <th>Vé đã mua</th>
                <th>Xác minh</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const { posted, bought } = getUserStats(u.id);
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32,
                          background: "#e5e7eb", color: "#374151",
                          borderRadius: "50%", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="admin-cell-main">{u.name}</div>
                          <div className="admin-cell-sub">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${ROLE_CONFIG[u.role]?.cls}`}>
                        {ROLE_CONFIG[u.role]?.label}
                      </span>
                    </td>
                    <td style={{ color: "#6b7280" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "–"}</td>
                    <td style={{ fontWeight: 600 }}>{posted}</td>
                    <td style={{ fontWeight: 600 }}>{bought}</td>
                    <td>
                      <span className={`admin-badge ${u.verified ? "admin-badge-success" : "admin-badge-warning"}`}>
                        {u.verified ? "Đã xác minh" : "Chưa xác minh"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
