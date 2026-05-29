import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoTixLogo from "../components/common/GoTixLogo";
import "./Auth.css";

export default function Register() {
  const { register, currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    if (currentUser && !registered) navigate("/", { replace: true });
  }, [currentUser, navigate, registered]);

  if (currentUser && !registered) return null;

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Mật khẩu ít nhất 6 ký tự"); return; }
    setLoading(true);
    try {
      const result = await register(form);
      if (!result.success) { setError(result.message); return; }
      if (result.requireEmailVerification) {
        setRegisteredEmail(form.email);
        setRegistered(true);
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  // ── Check email screen ──────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-brand">
            <Link to="/"><GoTixLogo height={52} /></Link>
          </div>

          <div style={{ fontSize: 48, margin: "8px 0 16px" }}>📧</div>
          <h1 className="auth-title">Kiểm tra hộp thư</h1>
          <p className="auth-subtitle" style={{ marginBottom: 20 }}>
            Chúng tôi đã gửi email xác nhận đến<br />
            <strong>{registeredEmail}</strong>
          </p>

          <div className="alert alert-info" style={{ textAlign: "left", marginBottom: 20 }}>
            <strong>Bước tiếp theo:</strong>
            <ol style={{ margin: "8px 0 0 16px", padding: 0, lineHeight: 1.8 }}>
              <li>Mở email từ <strong>GoTix</strong></li>
              <li>Bấm nút <strong>"Xác nhận tài khoản"</strong></li>
              <li>Quay lại đăng nhập và sử dụng GoTix</li>
            </ol>
          </div>

          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
            Không nhận được email? Kiểm tra thư mục Spam, hoặc{" "}
            <Link to="/login" style={{ color: "var(--color-primary)" }}>đăng nhập</Link>
            {" "}để gửi lại từ trang hồ sơ.
          </p>

          <Link to="/login" className="btn btn-primary btn-lg" style={{ display: "block" }}>
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // ── Register form ───────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Link to="/" className="auth-logo"><GoTixLogo height={52} /></Link>
        </div>
        <h1 className="auth-title">Tạo tài khoản</h1>
        <p className="auth-subtitle">Đăng ký miễn phí – mua và đăng vé ngay hôm nay</p>

        {error && <div className="alert alert-error mb-md">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Họ và tên</label>
            <input type="text" className="form-input" placeholder="Nguyễn Văn A"
              value={form.name} onChange={e => set("name", e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="email@example.com"
              value={form.email} onChange={e => set("email", e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input type="tel" className="form-input" placeholder="0901234567"
              value={form.phone} onChange={e => set("phone", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input type="password" className="form-input" placeholder="Ít nhất 6 ký tự"
              value={form.password} onChange={e => set("password", e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        <ul className="register-perks">
          <li>Đăng vé miễn phí, được duyệt trong 24h</li>
          <li>Mua vé an toàn từ người dùng được xác minh</li>
          <li>Hỗ trợ chat trực tiếp với người đăng vé</li>
        </ul>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
