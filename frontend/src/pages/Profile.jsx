import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { resolveMediaUrl } from "../api/client";
import "./Profile.css";

export default function Profile() {
  const { currentUser, updateProfile, changePassword } = useAuth();

  // Profile form
  const [form, setForm] = useState({
    name:  currentUser?.name  || "",
    phone: currentUser?.phone || "",
  });
  const [avatarFile, setAvatarFile]   = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState("");
  const avatarInputRef = useRef();

  // Password form
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]       = useState({ type: "", text: "" });

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    const res = await updateProfile({ ...form, avatarFile });
    if (res?.success) {
      setSaveMsg("Lưu thành công!");
      setAvatarFile(null);
    } else {
      setSaveMsg(res?.message || "Lưu thất bại, vui lòng thử lại.");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwMsg({ type: "error", text: "Mật khẩu mới không khớp." });
    }
    if (pwForm.newPassword.length < 6) {
      return setPwMsg({ type: "error", text: "Mật khẩu mới tối thiểu 6 ký tự." });
    }
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

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-heading">Tài khoản của tôi</h1>

        <div className="profile-layout">
          {/* Left card */}
          <div className="profile-card">
            {/* Avatar section */}
            <div className="profile-avatar-section">
              <div
                className="profile-avatar-big"
                style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
                onClick={() => avatarInputRef.current?.click()}
                title="Nhấn để đổi ảnh đại diện"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  currentUser?.name?.charAt(0).toUpperCase()
                )}
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%", opacity: 0, transition: "opacity .15s",
                }}
                  className="avatar-overlay"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
              <div>
                <p className="profile-name">{currentUser?.name}</p>
                <p className="profile-email">{currentUser?.email}</p>
                <span className={`badge ${currentUser?.verified ? "badge-success" : "badge-warning"} mt-sm`}>
                  {currentUser?.verified ? "Đã xác minh" : "Chưa xác minh"}
                </span>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Nhấn vào ảnh để thay đổi</p>
              </div>
            </div>

            <div className="divider" />

            {/* Profile form */}
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <h3>Thông tin cá nhân</h3>

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
                  style={{ backgroundColor: "var(--bg-muted)", cursor: "not-allowed" }}
                />
                <span className="form-error text-xs text-muted">Email không thể thay đổi</span>
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

              {avatarFile && (
                <div className="alert alert-info" style={{ fontSize: 13 }}>
                  Ảnh mới: <strong>{avatarFile.name}</strong> — nhấn "Lưu thay đổi" để cập nhật.
                </div>
              )}

              {saveMsg && (
                <div className={`alert ${saveMsg.includes("thành công") ? "alert-success" : "alert-error"}`}>
                  {saveMsg}
                </div>
              )}

              <div className="form-actions-row">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>

          {/* Right column */}
          <div className="profile-side">
            <div className="profile-info-card">
              <h4>Thông tin tài khoản</h4>
              <div className="info-rows">
                <div className="info-row">
                  <span>Vai trò</span>
                  <span className={`badge ${currentUser?.role === "admin" ? "badge-error" : "badge-neutral"}`}>
                    {currentUser?.role}
                  </span>
                </div>
                <div className="info-row">
                  <span>Ngày tham gia</span>
                  <span>
                    {currentUser?.createdAt
                      ? new Date(currentUser.createdAt).toLocaleDateString("vi-VN")
                      : currentUser?.joinDate || "—"}
                  </span>
                </div>
                {currentUser?.rating > 0 && (
                  <div className="info-row">
                    <span>Đánh giá</span>
                    <span>★ {currentUser.rating}</span>
                  </div>
                )}
                {currentUser?.isPro && (
                  <div className="info-row">
                    <span>Gói Pro</span>
                    <span className="badge badge-info">{currentUser.proBadge || "GoTix Pro"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Change password */}
            <div className="profile-info-card">
              <h4>Đổi mật khẩu</h4>
              <form onSubmit={handlePasswordSubmit} className="profile-form" style={{ marginTop: 12 }}>
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
                <div className="form-group">
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

                {pwMsg.text && (
                  <div className={`alert ${pwMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                    {pwMsg.text}
                  </div>
                )}

                <button type="submit" className="btn btn-outline btn-sm" disabled={pwSaving}>
                  {pwSaving ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
