import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoTixLogo from "../components/common/GoTixLogo";
import "./Auth.css";

export default function Login() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [errorType, setErrorType] = useState(""); // "disabled" | ""
  const [loading, setLoading]     = useState(false);

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (currentUser) {
      const dest = currentUser.role === "admin" ? "/admin" : from === "/login" ? "/" : from;
      navigate(dest, { replace: true });
    }
  }, [currentUser, navigate, from]);

  if (currentUser) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setErrorType("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
        if (result.message?.includes("vô hiệu hóa")) setErrorType("disabled");
        return;
      }
      const role = result.user.role;
      if (role === "admin") navigate("/admin", { replace: true });
      else navigate(from === "/login" ? "/" : from, { replace: true });
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role) {
    const demos = {
      user:  { email: "user@gotix.vn",  password: "123456" },
      admin: { email: "admin@gotix.vn", password: "admin123" },
    };
    setEmail(demos[role].email);
    setPassword(demos[role].password);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Link to="/" className="auth-logo">
            <GoTixLogo height={52} />
          </Link>
        </div>
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Chào mừng bạn trở lại GoTix</p>

        {error && (
          <div className={`alert ${errorType === "disabled" ? "alert-warning" : "alert-error"} mb-md`}>
            {error}
            {errorType === "disabled" && (
              <div style={{ marginTop: 6, fontSize: 13 }}>
                Vui lòng liên hệ hỗ trợ qua email hoặc trang GoTix.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <div className="password-label-row">
              <label className="form-label">Mật khẩu</label>
              <a href="#" className="forgot-link">Quên mật khẩu?</a>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
