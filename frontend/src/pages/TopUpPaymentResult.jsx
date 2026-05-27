import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { apiGet } from "../api/client";
import { useTickets } from "../context/TicketContext";

export default function TopUpPaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshWallet } = useTickets();
  
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("vnp_ResponseCode")) {
      apiGet(`/topups/vnpay/return${location.search}`)
        .then(async (res) => {
          if (res.success) {
            setStatus("success");
            setMessage("Nạp tiền vào ví thành công!");
            if (refreshWallet) await refreshWallet();
          } else {
            setStatus("error");
            setMessage(res.message || "Thanh toán thất bại hoặc mã xác thực không hợp lệ.");
          }
        })
        .catch((err) => {
          setStatus("error");
          setMessage("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại lịch sử ví.");
        });
    } else {
      setStatus("error");
      setMessage("Không tìm thấy thông tin thanh toán.");
    }
  }, [location, refreshWallet]);

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
          <div style={{ fontSize: "50px", color: "#16a34a", marginBottom: "20px" }}>✓</div>
          <h2>{message}</h2>
          <p style={{ marginTop: "10px", color: "#666" }}>
            Tiền đã được cộng vào số dư khả dụng của bạn. Bạn có thể sử dụng số dư này để mua vé.
          </p>
          <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <button className="btn btn-primary" onClick={() => navigate("/wallet")}>Về trang Ví</button>
            <button className="btn btn-outline" onClick={() => navigate("/tickets")}>Tìm mua vé</button>
          </div>
        </div>
      )}
      {status === "error" && (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '40px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: "50px", color: "red", marginBottom: "20px" }}>✗</div>
          <h2>Thanh toán thất bại</h2>
          <p style={{ marginTop: "10px", color: "#666" }}>{message}</p>
          <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <Link to="/wallet" className="btn btn-primary">Thử lại</Link>
            <Link to="/" className="btn btn-ghost">Về trang chủ</Link>
          </div>
        </div>
      )}
    </div>
  );
}
