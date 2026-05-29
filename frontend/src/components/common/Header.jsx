import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { apiGetNotifications, apiMarkRead, apiMarkAllRead, normalizeNotification, resolveMediaUrl } from "../../api/client";
import GoTixLogo from "./GoTixLogo";
import "./Header.css";

function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const ref = useRef(null);

  async function load() {
    const res = await apiGetNotifications();
    if (res.success) {
      setNotifications((res.data.notifications || []).map(normalizeNotification));
      setUnread(res.data.unread || 0);
    }
  }

  useEffect(() => { load(); }, []);

  // Poll every 30s
  useEffect(() => {
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleClick(n) {
    if (!n.isRead) {
      await apiMarkRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnread(prev => Math.max(0, prev - 1));
    }
    if (n.link) { window.location.href = n.link; }
    setOpen(false);
  }

  async function handleMarkAll() {
    await apiMarkAllRead();
    setNotifications(prev => prev.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-bell" onClick={() => setOpen(o => !o)} aria-label="Thông báo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Thông báo</span>
            {unread > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAll}>Đọc tất cả</button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">Không có thông báo nào</div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                className={`notif-item ${n.isRead ? '' : 'unread'}`}
                onClick={() => handleClick(n)}
              >
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{new Date(n.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatIcon() {
  const { unreadTotal } = useChat();
  return (
    <Link to="/chat" className="chat-icon-btn" aria-label="Tin nhắn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {unreadTotal > 0 && (
        <span className="notif-badge">{unreadTotal > 9 ? "9+" : unreadTotal}</span>
      )}
    </Link>
  );
}

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
          <GoTixLogo height={38} />
        </Link>

        <nav className={`header-nav ${menuOpen ? "open" : ""}`}>
          <Link to="/tickets" className={`nav-link ${isActive("/tickets") ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
            Vé phim đang pass
          </Link>
          <Link to="/tickets?cinema=CGV"   className="nav-link" onClick={() => setMenuOpen(false)}>CGV</Link>
          <Link to="/tickets?cinema=BHD"   className="nav-link" onClick={() => setMenuOpen(false)}>BHD Star</Link>
          <Link to="/tickets?cinema=Lotte" className="nav-link" onClick={() => setMenuOpen(false)}>Lotte Cinema</Link>
          <Link to="/tickets?cinema=Galaxy" className="nav-link" onClick={() => setMenuOpen(false)}>Galaxy</Link>
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
                  + Đăng vé phim
                </Link>
              )}

              <NotificationDropdown />
              <ChatIcon />

              <div className="user-menu">
                <button className="user-menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
                  <div className="user-avatar">
                    {currentUser.avatar
                      ? <img src={resolveMediaUrl(currentUser.avatar)} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      : currentUser.name?.charAt(0).toUpperCase()
                    }
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
                      <Link to="/saved-tickets" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        Vé đã lưu
                      </Link>
                      <Link to="/post-ticket" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        Đăng vé phim
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
