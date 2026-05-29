import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Unauthorized() {
  const { currentUser, logout } = useAuth();

  const homeLink = currentUser?.role === "admin" ? "/admin" : "/";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      textAlign: "center",
      padding: "40px 20px",
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "#fef2f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <p style={{ fontSize: 64, fontWeight: 800, color: "#ef4444", lineHeight: 1, margin: 0 }}>403</p>

      <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 600, margin: "12px 0 8px", color: "var(--text-primary)" }}>
        Không có quyền truy cập
      </h2>

      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: 8, maxWidth: 380 }}>
        Bạn không có quyền truy cập trang này.
      </p>

      {currentUser && (
        <p style={{ fontSize: "var(--font-size-xs, 12px)", color: "var(--text-muted)", marginBottom: 28 }}>
          Tài khoản của bạn có vai trò&nbsp;
          <strong style={{ color: "var(--text-primary)" }}>
            {currentUser.role === "admin" ? "Quản trị viên" : "Người dùng"}
          </strong>
          &nbsp;và không được phép vào khu vực này.
        </p>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link to={homeLink} className="btn btn-primary">
          Về trang chủ
        </Link>
        {currentUser && (
          <button
            onClick={logout}
            className="btn btn-outline"
            style={{ cursor: "pointer" }}
          >
            Đăng xuất
          </button>
        )}
      </div>
    </div>
  );
}
