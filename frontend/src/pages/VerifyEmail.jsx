import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiVerifyEmail } from "../api/client";
import { useAuth } from "../context/AuthContext";
import GoTixLogo from "../components/common/GoTixLogo";
import "./Auth.css";

export default function VerifyEmail() {
  const [searchParams]  = useSearchParams();
  const { refreshUser } = useAuth();
  const token = searchParams.get("token");

  const [status, setStatus]   = useState("loading"); // loading | success | invalid | expired
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    apiVerifyEmail(token)
      .then(res => {
        if (res.success) {
          setStatus("success");
          setMessage(res.message);
          // Refresh user so emailVerified state updates if logged in
          refreshUser?.().catch(() => {});
        } else {
          setStatus("invalid");
          setMessage(res.message);
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-brand">
          <Link to="/"><GoTixLogo height={52} /></Link>
        </div>

        {status === "loading" && (
          <>
            <div style={{ fontSize: 40, margin: "12px 0" }}>⏳</div>
            <h1 className="auth-title">Đang xác minh...</h1>
            <p className="auth-subtitle">Vui lòng chờ trong giây lát.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 52, margin: "12px 0" }}>✅</div>
            <h1 className="auth-title" style={{ color: "#16a34a" }}>Xác minh thành công!</h1>
            <p className="auth-subtitle" style={{ marginBottom: 24 }}>
              {message || "Tài khoản GoTix của bạn đã được kích hoạt đầy đủ."}
            </p>
            <Link to="/login" className="btn btn-primary btn-lg" style={{ display: "block" }}>
              Đăng nhập ngay
            </Link>
          </>
        )}

        {(status === "invalid" || status === "expired") && (
          <>
            <div style={{ fontSize: 52, margin: "12px 0" }}>⛔</div>
            <h1 className="auth-title" style={{ color: "#dc2626" }}>
              {status === "expired" ? "Link đã hết hạn" : "Link không hợp lệ"}
            </h1>
            <p className="auth-subtitle" style={{ marginBottom: 24 }}>
              {message || "Link xác nhận không hợp lệ hoặc đã hết hạn (24 giờ)."}
              <br />
              Đăng nhập và gửi lại email xác minh từ trang hồ sơ.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/login" className="btn btn-primary">Đăng nhập</Link>
              <Link to="/"      className="btn btn-ghost">Về trang chủ</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
