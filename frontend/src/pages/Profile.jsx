import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
  });
  const [saved, setSaved] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-heading">Tài khoản của tôi</h1>

        <div className="profile-layout">
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar-big">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="profile-name">{currentUser?.name}</p>
                <p className="profile-email">{currentUser?.email}</p>
                <span className={`badge ${currentUser?.verified ? "badge-success" : "badge-warning"} mt-sm`}>
                  {currentUser?.verified ? "Đã xác minh" : "Chưa xác minh"}
                </span>
              </div>
            </div>

            <div className="divider" />

            <form onSubmit={handleSubmit} className="profile-form">
              <h3>Thông tin cá nhân</h3>

              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
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
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="09xxxxxxxx"
                />
              </div>

              {saved && <div className="alert alert-success">Lưu thành công!</div>}

              <div className="form-actions-row">
                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>

          <div className="profile-side">
            <div className="profile-info-card">
              <h4>Thông tin tài khoản</h4>
              <div className="info-rows">
                <div className="info-row">
                  <span>Vai trò</span>
                  <span className={`badge ${currentUser?.role === "admin" ? "badge-error" : currentUser?.role === "seller" ? "badge-info" : "badge-neutral"}`}>
                    {currentUser?.role}
                  </span>
                </div>
                <div className="info-row">
                  <span>Ngày tham gia</span>
                  <span>{currentUser?.joinDate}</span>
                </div>
                {currentUser?.role === "seller" && (
                  <>
                    <div className="info-row">
                      <span>Vé đã bán</span>
                      <span>{currentUser?.totalSold}</span>
                    </div>
                    <div className="info-row">
                      <span>Đánh giá</span>
                      <span>{currentUser?.rating ? `★ ${currentUser.rating}` : "–"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="profile-info-card">
              <h4>Bảo mật</h4>
              <p className="profile-sec-note">Quản lý mật khẩu và bảo mật tài khoản.</p>
              <button className="btn btn-outline btn-sm mt-sm" disabled>
                Đổi mật khẩu (sắp có)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
