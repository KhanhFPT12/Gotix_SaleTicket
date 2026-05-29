import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import { useAuth } from "../context/AuthContext";
import "./Payment.css";

const QR_BASE = "https://img.vietqr.io/image/TPB-0819734122-print.png";
const EXPIRY_SECONDS = 5 * 60; // 5 minutes

function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

function buildQrUrl(amount, note) {
  return `${QR_BASE}?amount=${amount}&addInfo=${encodeURIComponent(note)}&accountName=Nguyen%20Gia%20Khanh`;
}

function useCountdown(targetDate) {
  const calc = useCallback(() => {
    if (!targetDate) return EXPIRY_SECONDS;
    const diff = Math.floor((new Date(targetDate) - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [targetDate]);

  const [secs, setSecs] = useState(calc);

  useEffect(() => {
    setSecs(calc());
    if (!targetDate) return;
    const id = setInterval(() => {
      const remaining = calc();
      setSecs(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate, calc]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return { secs, display: `${mm}:${ss}`, expired: secs <= 0 };
}

const STEP_LABELS = ["Xác nhận đơn", "Thanh toán", "Hoàn tất"];

export default function Payment() {
  const { ticketId }   = useParams();
  const { tickets, addTransaction, confirmPayment } = useTickets();
  const { currentUser } = useAuth();

  const [step, setStep]         = useState(0);
  const [qty, setQty]           = useState(1);
  const [txData, setTxData]     = useState(null); // { id, paymentNote, paymentExpiredAt, totalPrice+fee }
  const [confirmError, setConfirmError] = useState("");
  const [confirming, setConfirming]     = useState(false);
  const [paying, setPaying]             = useState(false);
  const [payError, setPayError]         = useState("");
  const [copied, setCopied]             = useState(false);
  const [hasPaid, setHasPaid]           = useState(false);

  const ticket = tickets.find((t) => t.id === ticketId);

  const total      = ticket ? ticket.passPrice * qty : 0;
  const fee        = Math.round(total * 0.02);
  const finalTotal = total + fee;

  const { secs, display: countdown, expired } = useCountdown(txData?.paymentExpiredAt);

  if (!ticket) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Không tìm thấy vé</h2>
        <Link to="/tickets" className="btn btn-primary mt-md">Quay lại</Link>
      </div>
    );
  }

  async function handleConfirm() {
    setConfirmError("");
    setConfirming(true);
    try {
      const tx = await addTransaction({ ticketId: ticket.id, quantity: qty });
      setTxData({
        id:               tx.id,
        paymentNote:      tx.paymentNote || currentUser?.name || "",
        paymentExpiredAt: tx.paymentExpiredAt,
        totalPrice:       tx.amount,
      });
      setStep(1);
    } catch (err) {
      setConfirmError(err.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setConfirming(false);
    }
  }

  async function handlePaid() {
    if (!txData || expired) return;
    setPayError("");
    setPaying(true);
    try {
      await confirmPayment(txData.id);
      setHasPaid(true);
      setStep(2);
    } catch (err) {
      setPayError(err.message || "Xác nhận thất bại. Vui lòng thử lại.");
    } finally {
      setPaying(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(txData?.paymentNote || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore clipboard error */
    }
  }

  return (
    <div className="payment-page">
      <div className="container">
        <h1 className="page-heading">Thanh toán vé</h1>

        {/* Steps */}
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

            {/* ── Step 0: Confirm order ── */}
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

                <div className="pay-method-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                  Thanh toán qua chuyển khoản ngân hàng (QR Code)
                </div>

                {confirmError && <div className="alert alert-error mt-md">{confirmError}</div>}
                <button className="btn btn-accent btn-lg w-full mt-lg" onClick={handleConfirm} disabled={confirming}>
                  {confirming ? "Đang xử lý..." : "Tiến hành thanh toán"}
                </button>
              </div>
            )}

            {/* ── Step 1: QR Payment ── */}
            {step === 1 && txData && (
              <div className="payment-card">
                <div className="pay-qr-header">
                  <h2>Quét mã QR để thanh toán</h2>
                  <div className={`pay-countdown ${expired ? "expired" : secs <= 60 ? "warning" : ""}`}>
                    {expired ? (
                      <span>⏰ Đã hết thời gian thanh toán</span>
                    ) : (
                      <span>Còn lại <strong>{countdown}</strong></span>
                    )}
                  </div>
                </div>

                {expired ? (
                  <div className="pay-expired-box">
                    <p>Giao dịch đã hết hạn. Vui lòng tạo đơn hàng mới.</p>
                    <button className="btn btn-outline mt-md" onClick={() => { setStep(0); setTxData(null); }}>
                      Tạo đơn mới
                    </button>
                  </div>
                ) : (
                  <>
                    {/* QR Image */}
                    <div className="pay-qr-wrap">
                      <img
                        src={buildQrUrl(finalTotal, txData.paymentNote)}
                        alt="QR chuyển khoản"
                        className="pay-qr-img"
                      />
                    </div>

                    {/* Payment details */}
                    <div className="pay-info-table">
                      <div className="pay-info-row">
                        <span>Ngân hàng</span>
                        <strong>TPBank</strong>
                      </div>
                      <div className="pay-info-row">
                        <span>Số tài khoản</span>
                        <strong>0819734122</strong>
                      </div>
                      <div className="pay-info-row pay-info-amount">
                        <span>Số tiền</span>
                        <strong className="pay-amount-value">{formatPrice(finalTotal)}</strong>
                      </div>
                      <div className="pay-info-row">
                        <span>Nội dung chuyển khoản</span>
                        <div className="pay-note-wrap">
                          <strong className="pay-note-text">{txData.paymentNote}</strong>
                          <button className="pay-copy-btn" onClick={handleCopy} title="Sao chép nội dung">
                            {copied ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                            )}
                            <span>{copied ? "Đã copy" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pay-warning">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      Vui lòng chuyển đúng số tiền và đúng nội dung để hệ thống xử lý giao dịch.
                    </div>

                    {payError && <div className="alert alert-error mt-md">{payError}</div>}

                    <div className="payment-actions">
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={handlePaid}
                        disabled={paying || expired}
                      >
                        {paying ? "Đang xử lý..." : "Tôi đã chuyển khoản"}
                      </button>
                      <button className="btn btn-ghost" onClick={() => setStep(0)} disabled={paying}>
                        Quay lại
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Step 2: Waiting for admin ── */}
            {step === 2 && (
              <div className="payment-card payment-waiting">
                <div className="waiting-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h2>Chờ xác nhận từ GoTix</h2>
                <p>
                  Giao dịch của bạn đang chờ xác minh. GoTix sẽ xác nhận trong vòng <strong>15–30 phút</strong> sau khi nhận được chuyển khoản.
                </p>
                <div className="waiting-detail">
                  <div className="pay-info-row">
                    <span>Nội dung đã dùng</span>
                    <strong>{txData?.paymentNote}</strong>
                  </div>
                  <div className="pay-info-row">
                    <span>Số tiền đã chuyển</span>
                    <strong>{formatPrice(finalTotal)}</strong>
                  </div>
                </div>
                <div className="success-actions">
                  <Link to="/buyer" className="btn btn-primary">Xem đơn hàng</Link>
                  <Link to="/tickets" className="btn btn-ghost">Tìm thêm vé</Link>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
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
