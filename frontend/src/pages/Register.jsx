import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoTixLogo from "../components/common/GoTixLogo";
import { GoogleLogin } from '@react-oauth/google';
import "./Auth.css";

export default function Register() {
  const { register, googleLogin, verifyOtp, resendOtp, currentUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]   = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP step
  const [step, setStep]               = useState("form"); // form | otp
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp]                 = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError]       = useState("");
  const [otpLoading, setOtpLoading]   = useState(false);
  const [resending, setResending]     = useState(false);
  const [resendMsg, setResendMsg]     = useState("");
  const [countdown, setCountdown]     = useState(0);

  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Nếu đã đăng nhập → về trang chính
  useEffect(() => {
    if (currentUser) navigate("/", { replace: true });
  }, [currentUser, navigate]);

  // Đếm ngược resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  if (currentUser) return null;

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  // ── Submit form đăng ký ──────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Mật khẩu ít nhất 6 ký tự"); return; }
    // Validate phone
    const phoneClean = form.phone.replace(/\s/g, "");
    const vnPhone = /^0[35789][0-9]{8}$/;
    if (!phoneClean) { setError("Vui lòng nhập số điện thoại"); return; }
    if (!vnPhone.test(phoneClean)) {
      setError("Số điện thoại không hợp lệ. Phải là số Việt Nam 10 chữ số (VD: 0901234567)");
      return;
    }

    setLoading(true);
    try {
      const result = await register({ ...form, phone: phoneClean });
      if (!result.success) { setError(result.message); return; }
      setPendingEmail(result.email || form.email);
      setStep("otp");
      setCountdown(60);
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handlers ───────────────────────────────────────────────────
  function handleOtpChange(index, value) {
    const val = value.replace(/\D/g, "").slice(-1); // chỉ lấy 1 số
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    setOtpError("");
    if (val && index < 5) otpRefs[index + 1].current?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
    if (e.key === "Enter") handleVerifyOtp();
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs[5].current?.focus();
    }
  }

  // ── Xác nhận OTP ─────────────────────────────────────────────────────────
  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Vui lòng nhập đủ 6 chữ số"); return; }
    setOtpError("");
    setOtpLoading(true);
    try {
      const result = await verifyOtp(pendingEmail, code);
      if (!result.success) {
        setOtpError(result.message);
        setOtp(["", "", "", "", "", ""]);
        otpRefs[0].current?.focus();
        return;
      }
      // Đăng nhập thành công → navigate (AuthContext set currentUser → useEffect navigate)
    } catch {
      setOtpError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setOtpLoading(false);
    }
  }

  // ── Gửi lại OTP ──────────────────────────────────────────────────────────
  async function handleResend() {
    setResending(true); setResendMsg("");
    try {
      const res = await resendOtp(pendingEmail);
      if (res.success) {
        setResendMsg("Đã gửi lại mã OTP. Kiểm tra hộp thư.");
        setCountdown(60);
        setOtp(["", "", "", "", "", ""]);
        otpRefs[0].current?.focus();
      } else {
        setResendMsg(res.message || "Gửi lại thất bại.");
      }
    } catch { setResendMsg("Đã xảy ra lỗi."); }
    finally { setResending(false); }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (!result.success) {
        setError(result.message);
        return;
      }
      // Redirect handled by useEffect
    } catch {
      setError("Đã xảy ra lỗi khi đăng ký bằng Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Đăng nhập Google thất bại.");
  };

  // ── OTP screen ───────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-brand">
            <Link to="/"><GoTixLogo height={48} /></Link>
          </div>

          <div style={{ fontSize: 44, margin: "8px 0 12px" }}>📱</div>
          <h1 className="auth-title">Nhập mã xác nhận</h1>
          <p className="auth-subtitle" style={{ marginBottom: 24 }}>
            Chúng tôi đã gửi mã 6 chữ số đến<br />
            <strong>{pendingEmail}</strong>
          </p>

          {/* 6 ô OTP */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}
               onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                autoFocus={i === 0}
                style={{
                  width: 52, height: 60,
                  fontSize: 28, fontWeight: 800,
                  textAlign: "center",
                  border: `2px solid ${otpError ? "#ef4444" : digit ? "#2563eb" : "#d1d5db"}`,
                  borderRadius: 12,
                  outline: "none",
                  background: digit ? "#eff6ff" : "#ffffff",
                  color: "#111827",
                  boxShadow: digit ? "0 0 0 3px rgba(37,99,235,0.15)" : "0 1px 3px rgba(0,0,0,0.08)",
                  transition: "all 0.15s",
                  cursor: "text",
                }}
              />
            ))}
          </div>

          {otpError && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>{otpError}</div>
          )}

          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginBottom: 16 }}
            onClick={handleVerifyOtp}
            disabled={otpLoading || otp.join("").length < 6}
          >
            {otpLoading ? "Đang xác nhận..." : "Xác nhận"}
          </button>

          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {resendMsg && (
              <p style={{ marginBottom: 8, color: "#16a34a" }}>{resendMsg}</p>
            )}
            {countdown > 0 ? (
              <p>Gửi lại mã sau <strong>{countdown}s</strong></p>
            ) : (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Đang gửi..." : "Gửi lại mã OTP"}
              </button>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setStep("form"); setOtp(["","","","","",""]); setOtpError(""); }}
            >
              ← Đổi email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
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
              value={form.name} onChange={e => setField("name", e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="email@example.com"
              value={form.email} onChange={e => setField("email", e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">
              Số điện thoại <span className="required">*</span>
            </label>
            <input
              type="tel" className="form-input"
              placeholder="0901234567"
              maxLength={11}
              value={form.phone}
              onChange={e => setField("phone", e.target.value.replace(/[^0-9]/g, ""))}
            />
            <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4, display: "block" }}>
              Số điện thoại Việt Nam 10 chữ số (03x, 05x, 07x, 08x, 09x)
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input type="password" className="form-input" placeholder="Ít nhất 6 ký tự"
              value={form.password} onChange={e => setField("password", e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? "Đang gửi mã..." : "Tiếp tục"}
          </button>
        </form>

        <div className="auth-separator"><span>Hoặc</span></div>
        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            width="100%"
            theme="outline"
            text="signup_with"
          />
        </div>

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
