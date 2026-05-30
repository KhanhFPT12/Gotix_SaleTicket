import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoTixLogo from "../components/common/GoTixLogo";
import "./Auth.css";

export default function Login() {
  const { login, currentUser, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [errorType, setErrorType] = useState(""); // "disabled" | "unverified" | ""
  const [loading,   setLoading]   = useState(false);

  const [resending,    setResending]    = useState(false);
  const [resendMsg,    setResendMsg]    = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (currentUser) {
      const dest = currentUser.role === "admin"   ? "/admin"
                 : currentUser.role === "support" ? "/staff/support"
                 : from === "/login"              ? "/"
                 : from;
      navigate(dest, { replace: true });
    }
  }, [currentUser, navigate, from]);

  if (currentUser) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setErrorType(""); setResendMsg("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
        if (result.message?.includes("vô hiệu hóa")) {
          setErrorType("disabled");
        } else if (result.message?.includes("xác minh email")) {
          setErrorType("unverified");
          setUnverifiedEmail(email);
        }
        return;
      }
      const role = result.user.role;
      if (role === "admin")        navigate("/admin",         { replace: true });
      else if (role === "support") navigate("/staff/support", { replace: true });
      else navigate(from === "/login" ? "/" : from, { replace: true });
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true); setResendMsg("");
    try {
      const res = await resendVerification(unverifiedEmail);
      setResendMsg(res.success ? "✅ " + res.message : "❌ " + (res.message || "Gửi thất bại."));
    } catch { setResendMsg("❌ Đã xảy ra lỗi."); }
    finally { setResending(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Link to="/" className="auth-logo"><GoTixLogo height={52} /></Link>
        </div>
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">Chào mừng bạn trở lại GoTix</p>

        {/* Lỗi chưa xác minh email */}
        {errorType === "unverified" && (
          <div className="alert alert-warning mb-md">
            <strong>📧 Email chưa được xác minh</strong>
            <p style={{ margin: "6px 0 10px", fontSize: 13 }}>
              Vui lòng kiểm tra hộp thư <strong>{unverifiedEmail}</strong> và bấm link xác nhận trước khi đăng nhập.
            </p>
            {resendMsg ? (
              <p style={{ fontSize: 13, margin: 0 }}>{resendMsg}</p>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Đang gửi..." : "Gửi lại email xác minh"}
              </button>
            )}
          </div>
        )}

        {/* Lỗi tài khoản bị khóa */}
        {errorType === "disabled" && (
          <div className="alert alert-warning mb-md">
            {error}
            <div style={{ marginTop: 6, fontSize: 13 }}>
              Vui lòng liên hệ hỗ trợ qua trang GoTix.
            </div>
          </div>
        )}

        {/* Lỗi thông thường */}
        {error && errorType === "" && (
          <div className="alert alert-error mb-md">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="email@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <div className="password-label-row">
              <label className="form-label">Mật khẩu</label>
              <a href="#" className="forgot-link">Quên mật khẩu?</a>
            </div>
            <input type="password" className="form-input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
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
