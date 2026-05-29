import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoTixLogo from "../components/common/GoTixLogo";
import "./StaffLayout.css";

export default function StaffLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="staff-shell">
      {/* Sidebar */}
      <aside className={`staff-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="staff-brand">
          <GoTixLogo height={28} />
          <span className="staff-brand-tag">Support</span>
        </div>

        <nav className="staff-nav">
          <p className="staff-nav-label">Hỗ trợ</p>
          <NavLink to="/staff/support" end className={({ isActive }) => `staff-nav-link ${isActive ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Tất cả yêu cầu</span>
          </NavLink>
        </nav>

        <div className="staff-sidebar-footer">
          <div className="staff-user-info">
            <div className="staff-avatar">{currentUser?.name?.charAt(0).toUpperCase()}</div>
            <div className="staff-user-meta">
              <p className="staff-user-name">{currentUser?.name}</p>
              <p className="staff-user-role">Support Staff</p>
            </div>
          </div>
          <button className="staff-logout-btn" onClick={handleLogout} title="Đăng xuất">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="staff-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="staff-main">
        <header className="staff-topbar">
          <button className="staff-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="staff-topbar-title">GoTix Support Center</span>
          <span className="staff-topbar-user">{currentUser?.email}</span>
        </header>
        <main className="staff-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
