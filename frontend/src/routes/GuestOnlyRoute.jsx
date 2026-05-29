import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Redirects already-authenticated users away from guest-only pages
 * (login, register). Admin → /admin, User → /.
 */
export default function GuestOnlyRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>Đang tải...</p>
      </div>
    );
  }

  if (currentUser) {
    const dest = currentUser.role === "admin"   ? "/admin"
               : currentUser.role === "support" ? "/staff/support"
               : "/";
    return <Navigate to={dest} replace />;
  }

  return children;
}
