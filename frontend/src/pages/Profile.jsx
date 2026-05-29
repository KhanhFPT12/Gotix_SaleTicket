import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiGet, resolveMediaUrl, apiResendVerification } from "../api/client";
import "./Profile.css";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatPrice(p) {
  if (!p && p !== 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

export default function Profile() {
  const { currentUser, updateProfile, changePassword } = useAuth();

  const [form, setForm] = useState({
    name:     currentUser?.name     || "",
    phone:    currentUser?.phone    || "",
    bio:      currentUser?.bio      || "",
    location: currentUser?.location || "",
  });
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving]               = useState(false);
  const [saveMsg, setSaveMsg]             = useState({ type: "", text: "" });
  const avatarInputRef = useRef();

  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]       = useState({ type: "", text: "" });

  const [stats, setStats] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg]         = useState("");

  // Lấy stats từ backend
  useEffect(() => {
    apiGet("/users/profile")
      .then((res) => { if (res.success) setStats(res.data.stats); })
      .catch(() => {});
  }, []);

  // Sync form khi currentUser thay đổi
  useEffect(() => {
    if (!currentUser) return;
    setForm({
      name:     currentUser.name     || "",
      phone:    currentUser.phone    || "",
      bio:      currentUser.bio      || "",
      location: currentUser.location || "",
    });
  }, [currentUser]);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg({ type: "", text: "" });
    const res = await updateProfile({ ...form, avatarFile });
    if (res?.success) {
      setSaveMsg({ type: "success", text: "Lưu thay đổi thành công!" });
      setAvatarFile(null);
    } else {
      setSaveMsg({ type: "error", text: res?.message || "Lưu thất bại, vui lòng thử lại." });
    }
    setSaving(false);
    setTimeout(() => setSaveMsg({ type: "", text: "" }), 4000);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return setPwMsg({ type: "error", text: "Mật khẩu mới không khớp." });
    if (pwForm.newPassword.length < 6)
      return setPwMsg({ type: "error", text: "Mật khẩu mới tối thiểu 6 ký tự." });
    setPwSaving(true);
    const res = await changePassword(pwForm.oldPassword, pwForm.newPassword);
    if (res?.success) {
      setPwMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPwMsg({ type: "error", text: res?.message || "Đổi mật khẩu thất bại." });
    }
    setPwSaving(false);
  }

  const avatarUrl = avatarPreview || (currentUser?.avatar ? resolveMediaUrl(currentUser.avatar) : null);
  const trustScore = currentUser?.trustScore ?? 50;
  const trustColor = trustScore >= 70 ? "#16a34a" : trustScore >= 40 ? "#d97706" : "#ef4444";
  const trustLabel = trustScore >= 70 ? "Uy tín cao" : trustScore >= 40 ? "Trung bình" : "Cần thận trọng";

  async function handleResendVerification() {
    setResendLoading(true); setResendMsg("");
    try {
      const res = await apiResendVerification();
      setResendMsg(res.success ? "✅ " + res.message : "❌ " + (res.message || "Gửi thất bại."));
    } catch { setResendMsg("❌ Đã xảy ra lỗi."); }
    finally { setResendLoading(false); }
  }

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-heading">Tài khoản của tôi</h1>

        {/* Email verification banner */}
        {currentUser && !currentUser.emailVerified && (
          <div className="alert alert-warning" style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span>
              <strong>📧 Chưa xác minh email</strong> — Bạn cần xác minh email để đăng vé, mua vé và rút tiền.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {resendMsg && <span style={{ fontSize: 13 }}>{resendMsg}</span>}
              <button
                className="btn btn-outline btn-sm"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? "Đang gửi..." : "Gửi lại email xác minh"}
              </button>
            </div>
          </div>
        )}
        {currentUser?.emailVerified && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 100, padding: "4px 12px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Email đã xác minh
            </span>
          </div>
        )}

        <div className="profile-layout">
          {/* ── Cột trái: chỉnh sửa ──────────────────────── */}
          <div className="profile-main">

            {/* Avatar + tên */}
            <div className="pf-card pf-identity">
              <div
                className="pf-avatar"
                onClick={() => avatarInputRef.current?.click()}
                title="Nhấn để đổi ảnh đại diện"
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" />
                  : <span>{currentUser?.name?.charAt(0).toUpperCase()}</span>
                }
                <div className="pf-avatar__overlay">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              <div className="pf-identity__info">
                <p className="pf-identity__name">
                  {currentUser?.name}
                  {currentUser?.isPro && (
                    <span className="pro-badge">{currentUser.proBadge || "GoTix Pro"}</span>
                  )}
                </p>
                <p className="pf-identity__email">{currentUser?.email}</p>
                <div className="pf-identity__badges">
                  <span className={`badge ${currentUser?.verified ? "badge-success" : "badge-warning"}`}>
                    {currentUser?.verified ? "Đã xác minh" : "Chưa xác minh"}
                  </span>
                </div>
                <p className="pf-avatar__hint">Nhấn vào ảnh để thay đổi</p>
              </div>
            </div>

            {/* Form chỉnh sửa */}
            <div className="pf-card">
              <h3 className="pf-section-title">Thông tin cá nhân</h3>
              <form onSubmit={handleProfileSubmit} className="pf-form">
                <div className="pf-form-grid">
                  <div className="form-group">
                    <label className="form-label">Họ và tên</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={currentUser?.email || ""}
                      disabled
                    />
                    <p className="form-hint">Email không thể thay đổi</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="09xxxxxxxx"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Khu vực</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="Hà Nội, TP. Hồ Chí Minh..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Giới thiệu bản thân</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Viết vài điều về bản thân..."
                    maxLength={500}
                  />
                  <p className="form-hint">{form.bio.length}/500 ký tự</p>
                </div>

                {avatarFile && (
                  <div className="alert alert-info" style={{ fontSize: 13 }}>
                    Ảnh mới: <strong>{avatarFile.name}</strong> — nhấn "Lưu thay đổi" để cập nhật.
                  </div>
                )}

                {saveMsg.text && (
                  <div className={`alert ${saveMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                    {saveMsg.text}
                  </div>
                )}

                <div className="pf-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>

            {/* Đổi mật khẩu */}
            <div className="pf-card">
              <h3 className="pf-section-title">Đổi mật khẩu</h3>
              <form onSubmit={handlePasswordSubmit} className="pf-form">
                <div className="pf-form-grid">
                  <div className="form-group">
                    <label className="form-label">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      className="form-input"
                      value={pwForm.oldPassword}
                      onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu mới</label>
                    <input
                      type="password"
                      className="form-input"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group pf-span-2">
                    <label className="form-label">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      className="form-input"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {pwMsg.text && (
                  <div className={`alert ${pwMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                    {pwMsg.text}
                  </div>
                )}

                <div className="pf-form-actions">
                  <button type="submit" className="btn btn-outline btn-sm" disabled={pwSaving}>
                    {pwSaving ? "Đang đổi..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Cột phải: thống kê & tài khoản ──────────── */}
          <aside className="profile-aside">

            {/* Stats */}
            {stats && (
              <div className="pf-card">
                <h4 className="pf-card-title">Thống kê hoạt động</h4>
                <div className="pf-stats">
                  <div className="pf-stat">
                    <span className="pf-stat__value">{stats.ticketsPosted ?? 0}</span>
                    <span className="pf-stat__label">Vé đã đăng</span>
                  </div>
                  <div className="pf-stat">
                    <span className="pf-stat__value">{stats.ticketsSold ?? 0}</span>
                    <span className="pf-stat__label">Đã bán</span>
                  </div>
                </div>
              </div>
            )}

            {/* Trust score */}
            {currentUser && (
              <div className="pf-card">
                <h4 className="pf-card-title">Trust Score</h4>
                <div className="pf-trust">
                  <div className="pf-trust__row">
                    <span className="pf-trust__score" style={{ color: trustColor }}>
                      {trustScore}/100
                    </span>
                    <span className="pf-trust__label" style={{ color: trustColor }}>{trustLabel}</span>
                  </div>
                  <div className="pf-trust__bar-bg">
                    <div className="pf-trust__bar-fill" style={{ width: `${trustScore}%`, background: trustColor }} />
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin tài khoản */}
            <div className="pf-card">
              <h4 className="pf-card-title">Thông tin tài khoản</h4>
              <div className="pf-info-rows">
                <div className="pf-info-row">
                  <span>Vai trò</span>
                  <span className={`badge ${currentUser?.role === "admin" ? "badge-error" : "badge-neutral"}`}>
                    {currentUser?.role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </span>
                </div>
                <div className="pf-info-row">
                  <span>Ngày tham gia</span>
                  <span>{formatDate(currentUser?.createdAt)}</span>
                </div>
                {currentUser?.rating > 0 && (
                  <div className="pf-info-row">
                    <span>Đánh giá</span>
                    <span>★ {currentUser.rating.toFixed(1)} ({currentUser.reviewCount})</span>
                  </div>
                )}
                {currentUser?.isPro && (
                  <div className="pf-info-row">
                    <span>Gói Pro</span>
                    <span className="badge badge-info">{currentUser.proBadge || "GoTix Pro"}</span>
                  </div>
                )}
                <div className="pf-info-row">
                  <span>Số dư ví</span>
                  <span>{formatPrice(currentUser?.availableBalance)}</span>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
