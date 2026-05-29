import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTickets } from "../context/TicketContext";
import "./AdminLayout.css";

const NAV_ITEMS = [
  {
    path: "/admin",
    end: true,
    label: "Tổng quan",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: "/admin/tickets",
    label: "Quản lý vé",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
      </svg>
    ),
  },
  {
    path: "/admin/users",
    label: "Người dùng",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: "/admin/transactions",
    label: "Giao dịch",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    path: "/admin/reports",
    label: "Báo cáo",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    path: "/admin/topups",
    label: "Nạp tiền",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    path: "/admin/withdrawals",
    label: "Rút tiền",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    path: "/admin/pro-subscriptions",
    label: "GoTix Pro",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    path: "/admin/audit-logs",
    label: "Nhật ký",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const { tickets, reports } = useTickets();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingTickets = tickets.filter((t) => t.status === "pending").length;
  const pendingReports = reports.filter((r) => r.status === "pending").length;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const { adminWithdrawals, adminTopUps } = useTickets();
  const pendingWithdrawals = adminWithdrawals.filter(w => w.status === "pending").length;
  const pendingTopUps      = adminTopUps.filter(t => t.status === "pending").length;

  const badges = {
    "/admin/tickets":     pendingTickets     || null,
    "/admin/reports":     pendingReports     || null,
    "/admin/topups":      pendingTopUps      || null,
    "/admin/withdrawals": pendingWithdrawals || null,
  };

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-brand-logo-wrap">
            <img src="/gotix-logo.png" alt="GoTix" className="admin-logo-img" />
          </div>
          <span className="admin-brand-tag">Admin Panel</span>
        </div>

        <nav className="admin-nav">
          <p className="admin-nav-group-label">Quản lý</p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {badges[item.path] && (
                <span className="admin-nav-badge">{badges[item.path]}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-meta">
              <p className="admin-user-name">{currentUser?.name}</p>
              <p className="admin-user-role">Administrator</p>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title="Đăng xuất">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main area */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="admin-topbar-right">
            {(pendingTickets > 0 || pendingReports > 0) && (
              <div className="admin-topbar-alerts">
                {pendingTickets > 0 && (
                  <NavLink to="/admin/tickets" className="topbar-alert-chip">
                    {pendingTickets} vé chờ duyệt
                  </NavLink>
                )}
                {pendingReports > 0 && (
                  <NavLink to="/admin/reports" className="topbar-alert-chip warn">
                    {pendingReports} báo cáo mới
                  </NavLink>
                )}
              </div>
            )}
            <span className="admin-topbar-name">{currentUser?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
