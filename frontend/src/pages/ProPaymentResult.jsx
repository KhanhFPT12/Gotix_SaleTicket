import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { apiGet } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ProPaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("vnp_ResponseCode")) {
      apiGet(`/pro/vnpay/return${location.search}`)
        .then(async (res) => {
          if (res.success) {
            setStatus("success");
            setMessage("Nâng cấp tài khoản Pro thành công!");
            if (refreshUser) await refreshUser();
          } else {
            setStatus("error");
            setMessage(res.message || "Thanh toán thất bại hoặc mã xác thực không hợp lệ.");
          }
        })
        .catch((err) => {
          setStatus("error");
          setMessage("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại trạng thái tài khoản.");
        });
    } else {
      setStatus("error");
      setMessage("Không tìm thấy thông tin thanh toán.");
    }
  }, [location, refreshUser]);

  return (
    <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
      {status === "loading" && (
        <div>
          <h2>Đang xử lý...</h2>
          <p>{message}</p>
        </div>
      )}
      {status === "success" && (
        <div className="pro-success-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: "50px", color: "#f59e0b", marginBottom: "20px" }}>🌟</div>
          <h2>{message}</h2>
          <p style={{ marginTop: "10px", color: "#666" }}>
            Tài khoản của bạn đã có huy hiệu GoTix Pro. Vé của bạn sẽ được ưu tiên hiển thị.
          </p>
          <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <button className="btn btn-primary" onClick={() => navigate("/post-ticket")}>Đăng vé ngay</button>
            <button className="btn btn-outline" onClick={() => navigate("/profile")}>Xem hồ sơ</button>
          </div>
        </div>
      )}
      {status === "error" && (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '40px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: "50px", color: "red", marginBottom: "20px" }}>✗</div>
          <h2>Thanh toán thất bại</h2>
          <p style={{ marginTop: "10px", color: "#666" }}>{message}</p>
          <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <Link to="/upgrade-pro" className="btn btn-primary">Thử lại</Link>
            <Link to="/" className="btn btn-ghost">Về trang chủ</Link>
          </div>
        </div>
      )}
    </div>
  );
}
