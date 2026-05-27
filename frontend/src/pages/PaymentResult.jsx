import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { apiGet } from "../api/client";

export default function PaymentResult() {
  const location = useLocation();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    // If it has vnp_ResponseCode, it's a redirect from VNPay
    if (searchParams.has("vnp_ResponseCode")) {
      apiGet(`/transactions/vnpay/return${location.search}`)
        .then((res) => {
          if (res.success) {
            setStatus("success");
            setMessage("Thanh toán thành công! Giao dịch của bạn đã được ghi nhận.");
          } else {
            setStatus("error");
            setMessage(res.message || "Thanh toán thất bại hoặc mã xác thực không hợp lệ.");
          }
        })
        .catch((err) => {
          setStatus("error");
          setMessage("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại lịch sử giao dịch.");
        });
    } else {
      setStatus("error");
      setMessage("Không tìm thấy thông tin thanh toán.");
    }
  }, [location]);

  return (
    <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
      {status === "loading" && (
        <div>
          <h2>Đang xử lý...</h2>
          <p>{message}</p>
        </div>
      )}
      {status === "success" && (
        <div>
          <div style={{ fontSize: "50px", color: "green", marginBottom: "20px" }}>✓</div>
          <h2>{message}</h2>
          <p style={{ marginTop: "10px", color: "#666" }}>
            Cảm ơn bạn đã mua vé qua GoTix. Người bán sẽ liên hệ chuyển vé trong vòng 2 giờ.
          </p>
          <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <Link to="/buyer" className="btn btn-primary">Xem đơn hàng</Link>
            <Link to="/tickets" className="btn btn-ghost">Tìm thêm vé</Link>
          </div>
        </div>
      )}
      {status === "error" && (
        <div>
          <div style={{ fontSize: "50px", color: "red", marginBottom: "20px" }}>✗</div>
          <h2>Thanh toán thất bại</h2>
          <p style={{ marginTop: "10px", color: "#666" }}>{message}</p>
          <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <Link to="/buyer" className="btn btn-primary">Lịch sử giao dịch</Link>
            <Link to="/" className="btn btn-ghost">Về trang chủ</Link>
          </div>
        </div>
      )}
    </div>
  );
}
