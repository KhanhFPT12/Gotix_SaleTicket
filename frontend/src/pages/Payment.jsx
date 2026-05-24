import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import "./Payment.css";

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

const PAYMENT_METHODS = [
  { id: "bank_transfer", label: "Chuyển khoản ngân hàng", sub: "VCB, TCB, MB, VPB..." },
  { id: "momo",          label: "Ví Momo",                sub: "Thanh toán qua ứng dụng Momo" },
  { id: "vnpay",         label: "VNPay",                  sub: "Thẻ nội địa / quốc tế" },
];

const STEP_LABELS = ["Xác nhận đơn", "Thanh toán", "Hoàn tất"];

export default function Payment() {
  const { ticketId } = useParams();
  const { tickets, addTransaction, payForTransaction } = useTickets();
  const [step, setStep]                 = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [qty, setQty]                   = useState(1);
  const [txId, setTxId]                 = useState(null);
  const [confirmError, setConfirmError] = useState("");
  const [confirming, setConfirming]     = useState(false);
  const [paying, setPaying]             = useState(false);
  const [payError, setPayError]         = useState("");

  const ticket = tickets.find((t) => t.id === ticketId);

  if (!ticket) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Không tìm thấy vé</h2>
        <Link to="/tickets" className="btn btn-primary mt-md">Quay lại</Link>
      </div>
    );
  }

  const total      = ticket.passPrice * qty;
  const fee        = Math.round(total * 0.02);
  const finalTotal = total + fee;

  async function handleConfirm() {
    setConfirmError("");
    setConfirming(true);
    try {
      const tx = await addTransaction({
        ticketId:      ticket.id,
        quantity:      qty,
        paymentMethod,
      });
      setTxId(tx.id);
      setStep(1);
    } catch (err) {
      setConfirmError(err.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setConfirming(false);
    }
  }

  async function handlePaid() {
    if (!txId) return;
    setPayError("");
    setPaying(true);
    try {
      await payForTransaction(txId);
      setStep(2);
    } catch (err) {
      setPayError(err.message || "Xác nhận thanh toán thất bại. Vui lòng thử lại.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="payment-page">
      <div className="container">
        <h1 className="page-heading">Thanh toán vé</h1>

        <div className="payment-steps">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className={`step ${i === step ? "active" : i < step ? "done" : ""}`}>
              <div className="step-dot">{i < step ? "✓" : i + 1}</div>
              <span>{label}</span>
              {i < STEP_LABELS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <div className="payment-layout">
          <div className="payment-main">
            {step === 0 && (
              <div className="payment-card">
                <h2>Xác nhận đơn hàng</h2>
                <div className="order-ticket">
                  <div className="order-ticket-info">
                    <p className="order-ticket-title">{ticket.title}</p>
                    <p className="order-ticket-meta">{ticket.location} · {ticket.date} {ticket.time}</p>
                    {ticket.seatInfo && <p className="order-ticket-seat">{ticket.seatInfo}</p>}
                  </div>
                </div>

                <div className="form-group mt-md">
                  <label className="form-label">Số lượng vé</label>
                  <div className="qty-control">
                    <button type="button" className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>–</button>
                    <span className="qty-value">{qty}</span>
                    <button type="button" className="qty-btn" onClick={() => setQty(Math.min(ticket.quantity, qty + 1))}>+</button>
                    <span className="text-muted text-sm">/ {ticket.quantity} vé còn lại</span>
                  </div>
                </div>

                <div className="form-group mt-md">
                  <label className="form-label">Phương thức thanh toán</label>
                  <div className="payment-methods">
                    {PAYMENT_METHODS.map((m) => (
                      <label key={m.id} className={`payment-method-item ${paymentMethod === m.id ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="payment"
                          value={m.id}
                          checked={paymentMethod === m.id}
                          onChange={() => setPaymentMethod(m.id)}
                        />
                        <div>
                          <p className="method-label">{m.label}</p>
                          <p className="method-sub">{m.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {confirmError && <div className="alert alert-error mt-md">{confirmError}</div>}
                <button className="btn btn-accent btn-lg w-full mt-lg" onClick={handleConfirm} disabled={confirming}>
                  {confirming ? "Đang xử lý..." : "Tiến hành thanh toán"}
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="payment-card">
                <h2>Thực hiện thanh toán</h2>
                <div className="payment-instruction">
                  {paymentMethod === "bank_transfer" && (
                    <>
                      <p className="instruction-note">Chuyển khoản theo thông tin bên dưới. Vé sẽ được giao sau khi xác nhận thanh toán.</p>
                      <div className="bank-info">
                        <div className="bank-row"><span>Ngân hàng</span><strong>Vietcombank (VCB)</strong></div>
                        <div className="bank-row"><span>Số tài khoản</span><strong>1234567890123</strong></div>
                        <div className="bank-row"><span>Tên tài khoản</span><strong>GOTIX VIETNAM</strong></div>
                        <div className="bank-row"><span>Số tiền</span><strong className="text-error">{formatPrice(finalTotal)}</strong></div>
                        <div className="bank-row"><span>Nội dung CK</span><strong>GOTIX {txId}</strong></div>
                      </div>
                      <p className="instruction-warn">Nhập đúng nội dung chuyển khoản để hệ thống xác nhận tự động.</p>
                    </>
                  )}
                  {(paymentMethod === "momo" || paymentMethod === "vnpay") && (
                    <div className="qr-mock">
                      <div className="qr-box">
                        <p>QR {paymentMethod === "momo" ? "Momo" : "VNPay"}</p>
                        <div className="qr-placeholder"><span>Quét QR</span></div>
                        <p className="qr-amount">{formatPrice(finalTotal)}</p>
                      </div>
                      <p className="instruction-note">Mở ứng dụng và quét mã QR để thanh toán.</p>
                    </div>
                  )}
                </div>
                {payError && <div className="alert alert-error mt-md">{payError}</div>}
                <div className="payment-actions">
                  <button className="btn btn-primary btn-lg" onClick={handlePaid} disabled={paying}>
                    {paying ? "Đang xử lý..." : "Tôi đã thanh toán"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setStep(0)} disabled={paying}>Quay lại</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="payment-card payment-success">
                <div className="success-check">✓</div>
                <h2>Thanh toán thành công!</h2>
                <p>Cảm ơn bạn đã mua vé qua GoTix. Người bán sẽ liên hệ chuyển vé trong vòng 2 giờ.</p>
                <div className="success-actions">
                  <Link to="/buyer" className="btn btn-primary">Xem đơn hàng</Link>
                  <Link to="/tickets" className="btn btn-ghost">Tìm thêm vé</Link>
                </div>
              </div>
            )}
          </div>

          {step < 2 && (
            <div className="order-summary">
              <h3>Tóm tắt đơn hàng</h3>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Giá vé × {qty}</span>
                  <span>{formatPrice(ticket.passPrice * qty)}</span>
                </div>
                <div className="summary-row">
                  <span>Phí dịch vụ (2%)</span>
                  <span>{formatPrice(fee)}</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total-row">
                  <span>Tổng cộng</span>
                  <strong>{formatPrice(finalTotal)}</strong>
                </div>
              </div>
              <div className="summary-seller">
                <p className="summary-label">Người bán</p>
                <div className="summary-seller-info">
                  <div className="seller-dot">{ticket.sellerName?.charAt(0) || "?"}</div>
                  <div>
                    <p className="seller-name-sm">{ticket.sellerName || "–"}</p>
                    {ticket.sellerRating > 0 && <p className="seller-rating-sm">★ {ticket.sellerRating}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
