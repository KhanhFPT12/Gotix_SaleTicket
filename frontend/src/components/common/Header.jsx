import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Header.css";

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="header-logo">
          <img src="/gotix-logo.png" alt="GoTix" className="header-logo-img" />
        </Link>

        <nav className={`header-nav ${menuOpen ? "open" : ""}`}>
          <Link to="/tickets" className={`nav-link ${isActive("/tickets") ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            Tất cả vé
          </Link>
          <Link to="/tickets?category=concert" className="nav-link" onClick={() => setMenuOpen(false)}>Concert</Link>
          <Link to="/tickets?category=movie"   className="nav-link" onClick={() => setMenuOpen(false)}>Phim</Link>
          <Link to="/tickets?category=sport"   className="nav-link" onClick={() => setMenuOpen(false)}>Thể thao</Link>
          <Link to="/tickets?category=workshop" className="nav-link" onClick={() => setMenuOpen(false)}>Workshop</Link>
        </nav>

        <div className="header-actions">
          {currentUser ? (
            <>
              {currentUser.role !== "admin" && !currentUser.isPro && (
                <Link to="/upgrade-pro" className="btn btn-pro btn-sm hide-mobile">
                  GoTix Pro
                </Link>
              )}
              {currentUser.role !== "admin" && (
                <Link to="/post-ticket" className="btn btn-outline btn-sm hide-mobile">
                  + Đăng vé
                </Link>
              )}
              <div className="user-menu">
                <button className="user-menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="user-avatar">
                    {currentUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name hide-mobile">{currentUser.name?.split(" ").pop()}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <div className={`user-dropdown ${menuOpen ? "open" : ""}`}>
                  <div className="dropdown-header">
                    <p className="dropdown-name">
                      {currentUser.name}
                      {currentUser.isPro && (
                        <span className="dropdown-pro-badge">{currentUser.proBadge || "GoTix Pro"}</span>
                      )}
                    </p>
                    <p className="dropdown-email">{currentUser.email}</p>
                  </div>
                  <div className="dropdown-divider" />

                  {currentUser.role === "admin" ? (
                    <Link to="/admin" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link to="/buyer" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        Vé của tôi
                      </Link>
                      <Link to="/wallet" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        Ví tiền
                      </Link>
                      <Link to="/post-ticket" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        Đăng vé
                      </Link>
                      <Link to="/upgrade-pro" className="dropdown-item dropdown-item-pro" onClick={() => setMenuOpen(false)}>
                        {currentUser.isPro ? "Quản lý gói Pro" : "Nâng cấp Pro"}
                      </Link>
                    </>
                  )}

                  <Link to="/transactions" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    Lịch sử giao dịch
                  </Link>
                  <Link to="/chat" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    Tin nhắn
                  </Link>
                  <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    Tài khoản
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost btn-sm">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Đăng ký</Link>
            </>
          )}

          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
