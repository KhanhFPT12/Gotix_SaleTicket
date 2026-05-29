import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import { apiAdminSetUserActive } from "../../api/client";
import "../../layouts/AdminLayout.css";

const ROLE_CFG = {
  admin: { label: "Admin", cls: "admin-badge-error" },
  user:  { label: "User",  cls: "admin-badge-neutral" },
};

function formatDate(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminUsers() {
  const { users, tickets, transactions } = useTickets();
  const [search,       setSearch]       = useState("");
  const [filterRole,   setFilterRole]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [processing,   setProcessing]   = useState(null);
  const [localUsers,   setLocalUsers]   = useState(null);

  const displayUsers = localUsers || users;

  const filtered = displayUsers
    .filter(u => filterRole === "all" || u.role === filterRole)
    .filter(u => {
      if (filterStatus === "active")     return u.isActive !== false;
      if (filterStatus === "disabled")   return u.isActive === false;
      if (filterStatus === "verified")   return u.emailVerified === true;
      if (filterStatus === "unverified") return !u.emailVerified;
      return true;
    })
    .filter(u =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );

  function getUserStats(userId) {
    const posted = tickets.filter(t => t.sellerId === userId).length;
    const bought = transactions.filter(t => t.buyerId === userId && t.status === "completed").length;
    return { posted, bought };
  }

  async function handleToggleActive(user) {
    const newActive = user.isActive === false ? true : false;
    setProcessing(user.id);
    try {
      const res = await apiAdminSetUserActive(user.id, newActive);
      if (res.success) {
        setLocalUsers(prev =>
          (prev || displayUsers).map(u => u.id === user.id ? { ...u, isActive: newActive } : u)
        );
      } else { alert(res.message || "Thao tác thất bại"); }
    } catch { alert("Đã xảy ra lỗi."); }
    finally { setProcessing(null); }
  }

  const totalDisabled   = displayUsers.filter(u => u.isActive === false).length;
  const totalVerified   = displayUsers.filter(u => u.emailVerified).length;
  const totalUnverified = displayUsers.filter(u => !u.emailVerified).length;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Người dùng</h1>
        <p className="admin-page-subtitle">Quản lý tài khoản và trạng thái người dùng</p>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng tài khoản</p>
          <p className="admin-stat-value">{displayUsers.length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Đã xác minh email</p>
          <p className="admin-stat-value" style={{ color: "#16a34a" }}>{totalVerified}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Chưa xác minh</p>
          <p className="admin-stat-value" style={{ color: "#d97706" }}>{totalUnverified}</p>
        </div>
        <div className="admin-stat-card"
          style={{ borderTop: totalDisabled > 0 ? "3px solid #ef4444" : undefined }}>
          <p className="admin-stat-label">Đang bị khóa</p>
          <p className="admin-stat-value" style={{ color: totalDisabled > 0 ? "#ef4444" : undefined }}>
            {totalDisabled}
          </p>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <span className="admin-section-title">Danh sách tài khoản</span>
          <div className="admin-section-actions">
            <input className="admin-search" placeholder="Tìm tên, email..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="admin-search" style={{ minWidth: 130 }}
              value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="all">Tất cả role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <select className="admin-search" style={{ minWidth: 165 }}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="disabled">Đã bị khóa</option>
              <option value="verified">Đã xác minh email</option>
              <option value="unverified">Chưa xác minh email</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">Không có tài khoản nào.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Tài khoản</th>
                  <th>Vé đăng / Mua</th>
                  <th>Đăng nhập gần nhất</th>
                  <th>Ngày tham gia</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const { posted, bought } = getUserStats(u.id);
                  const isActive      = u.isActive !== false;
                  const emailVerified = u.emailVerified === true;
                  const isAdmin       = u.role === "admin";

                  return (
                    <tr key={u.id} style={{ opacity: isActive ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, flexShrink: 0, borderRadius: "50%",
                            background: isActive ? "#e5e7eb" : "#fee2e2",
                            color: "#374151",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700,
                          }}>
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="admin-cell-main">{u.name}</div>
                            <div className="admin-cell-sub">{u.phone || "–"}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`admin-badge ${ROLE_CFG[u.role]?.cls}`}>
                          {ROLE_CFG[u.role]?.label}
                        </span>
                      </td>

                      <td>
                        <div className="admin-cell-main" style={{ fontSize: 12 }}>{u.email}</div>
                        <span className={`admin-badge ${emailVerified ? "admin-badge-success" : "admin-badge-warning"}`}
                          style={{ fontSize: 10, marginTop: 2, display: "inline-block" }}>
                          {emailVerified ? "✓ Đã xác minh" : "Chưa xác minh"}
                        </span>
                      </td>

                      <td>
                        <span className={`admin-badge ${isActive ? "admin-badge-success" : "admin-badge-error"}`}>
                          {isActive ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>

                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {posted} / {bought}
                      </td>

                      <td style={{ fontSize: 12, color: "#6b7280" }}>
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Chưa đăng nhập"}
                      </td>

                      <td style={{ fontSize: 12, color: "#6b7280" }}>
                        {formatDate(u.createdAt)}
                      </td>

                      <td>
                        {!isAdmin ? (
                          <button
                            disabled={processing === u.id}
                            onClick={() => handleToggleActive(u)}
                            className={`admin-btn ${isActive ? "admin-btn-reject" : "admin-btn-approve"}`}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {processing === u.id ? "..." : isActive ? "Khóa TK" : "Mở khóa"}
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>–</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
