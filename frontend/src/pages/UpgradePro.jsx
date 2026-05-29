import { useState, useEffect, useCallback } from "react";
import { useTickets } from "../context/TicketContext";
import { useAuth } from "../context/AuthContext";
import { apiGetProPlans } from "../api/client";
import "./UpgradePro.css";

const QR_BASE = "https://img.vietqr.io/image/TPB-0819734122-print.png";
const EXPIRY_SECONDS = 5 * 60;

const PLAN_LABELS = {
  "1_month":  "1 Tháng",
  "3_months": "3 Tháng",
  "6_months": "6 Tháng",
  "1_year":   "1 Năm",
};

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}
function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function buildQrUrl(amount, note) {
  return `${QR_BASE}?amount=${amount}&addInfo=${encodeURIComponent(note)}&accountName=Nguyen%20Gia%20Khanh`;
}

function useCountdown(targetDate) {
  const calc = useCallback(() => {
    if (!targetDate) return EXPIRY_SECONDS;
    return Math.max(0, Math.floor((new Date(targetDate) - Date.now()) / 1000));
  }, [targetDate]);

  const [secs, setSecs] = useState(calc);

  useEffect(() => {
    setSecs(calc());
    if (!targetDate) return;
    const id = setInterval(() => {
      const r = calc();
      setSecs(r);
      if (r <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate, calc]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return { secs, display: `${mm}:${ss}`, expired: secs <= 0 };
}

export default function UpgradePro() {
  const { currentUser, refreshUser } = useAuth();
  const { mySubscription, upgradePro, cancelPro, confirmProPayment, refreshSubscription } = useTickets();

  const [plans, setPlans]         = useState([]);
  const [selected, setSelected]   = useState("3_months");
  const [loading, setLoading]     = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // QR payment step state
  const [step, setStep]               = useState("plans"); // plans | qr | waiting
  const [subData, setSubData]         = useState(null);    // { id, paymentNote, paymentExpiredAt, price }
  const [copied, setCopied]           = useState(false);
  const [payError, setPayError]       = useState("");
  const [paying, setPaying]           = useState(false);

  const { secs, display: countdown, expired } = useCountdown(subData?.paymentExpiredAt);

  useEffect(() => {
    apiGetProPlans().then(res => {
      if (res.success) setPlans(res.data.plans || []);
    });
  }, []);

  const selectedPlan = plans.find(p => p.id === selected);
  const isPro = currentUser?.isPro;

  async function handleUpgrade() {
    setLoading(true);
    setPayError("");
    try {
      const res = await upgradePro(selected);
      // res = { subscription, paymentNote }
      setSubData({
        id:               res.subscription.id || res.subscription._id,
        paymentNote:      res.paymentNote || res.subscription.paymentNote || currentUser?.name || "",
        paymentExpiredAt: res.subscription.paymentExpiredAt,
        price:            res.subscription.price,
      });
      setStep("qr");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaid() {
    if (!subData || expired) return;
    setPaying(true);
    setPayError("");
    try {
      await confirmProPayment(subData.id);
      setStep("waiting");
    } catch (e) {
      setPayError(e.message || "Xác nhận thất bại. Vui lòng thử lại.");
    } finally {
      setPaying(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(subData?.paymentNote || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      await cancelPro();
      if (refreshUser) await refreshUser();
      setConfirmCancel(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── QR payment view ───────────────────────────────────────────────────────
  if (step === "qr" && subData) {
    return (
      <div className="upgrade-pro-page">
        <div className="pro-payment-wrap">
          <div className="pro-payment-card">
            {/* Header */}
            <div className="pro-pay-header">
              <button className="pro-pay-back" onClick={() => setStep("plans")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Quay lại
              </button>
              <div className={`pay-countdown ${expired ? "expired" : secs <= 60 ? "warning" : ""}`}>
                {expired
                  ? <span>⏰ Đã hết thời gian</span>
                  : <span>Còn lại <strong>{countdown}</strong></span>
                }
              </div>
            </div>

            <div className="pro-pay-badge">GoTix Pro — {PLAN_LABELS[selected]}</div>
            <h2 className="pro-pay-title">Quét mã QR để thanh toán</h2>

            {expired ? (
              <div className="pay-expired-box">
                <p>Đơn đăng ký đã hết hạn. Vui lòng chọn lại gói và thử lại.</p>
                <button className="btn btn-outline" style={{ marginTop: 12 }}
                  onClick={() => { setStep("plans"); setSubData(null); }}>
                  Chọn lại gói
                </button>
              </div>
            ) : (
              <>
                <div className="pay-qr-wrap">
                  <img
                    src={buildQrUrl(subData.price, subData.paymentNote)}
                    alt="QR chuyển khoản nâng cấp Pro"
                    className="pay-qr-img"
                  />
                </div>

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
                    <strong className="pay-amount-value">{formatPrice(subData.price)}</strong>
                  </div>
                  <div className="pay-info-row">
                    <span>Nội dung chuyển khoản</span>
                    <div className="pay-note-wrap">
                      <strong className="pay-note-text">{subData.paymentNote}</strong>
                      <button className="pay-copy-btn" onClick={handleCopy}>
                        {copied ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
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

                {payError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{payError}</div>}

                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%" }}
                  onClick={handlePaid}
                  disabled={paying || expired}
                >
                  {paying ? "Đang xử lý..." : "Tôi đã chuyển khoản"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting for admin ──────────────────────────────────────────────────────
  if (step === "waiting") {
    return (
      <div className="upgrade-pro-page">
        <div className="pro-payment-wrap">
          <div className="pro-payment-card" style={{ textAlign: "center" }}>
            <div className="waiting-icon" style={{ margin: "0 auto 16px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="pro-pay-badge">GoTix Pro</div>
            <h2 style={{ margin: "12px 0 8px" }}>Chờ xác nhận từ GoTix</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)", maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.7 }}>
              Đơn nâng cấp của bạn đang chờ xác minh. GoTix sẽ kích hoạt Pro trong vòng <strong>15–30 phút</strong> sau khi nhận được chuyển khoản.
            </p>
            <div className="pay-info-table" style={{ maxWidth: 360, margin: "0 auto 20px", textAlign: "left" }}>
              <div className="pay-info-row">
                <span>Gói đăng ký</span>
                <strong>{PLAN_LABELS[selected]}</strong>
              </div>
              <div className="pay-info-row">
                <span>Nội dung đã dùng</span>
                <strong>{subData?.paymentNote}</strong>
              </div>
              <div className="pay-info-row">
                <span>Số tiền đã chuyển</span>
                <strong>{formatPrice(subData?.price ?? 0)}</strong>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={() => setStep("plans")}>
              Quay về trang gói Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Plan selection (default) ───────────────────────────────────────────────
  return (
    <div className="upgrade-pro-page">
      <div className="pro-hero">
        <div className="pro-hero-badge">GoTix Pro</div>
        <h1 className="pro-hero-title">Nâng cấp tài khoản Pro</h1>
        <p className="pro-hero-sub">Vé của bạn được ưu tiên hiển thị đầu tiên — tiếp cận nhiều người mua hơn</p>
      </div>

      <div className="pro-benefits">
        {[
          { icon: "⚡", title: "Ưu tiên hiển thị",   desc: "Vé của bạn luôn xuất hiện đầu trang tìm kiếm" },
          { icon: "✅", title: "Badge Pro xác nhận",  desc: "Huy hiệu GoTix Pro tăng độ tin cậy với người mua" },
          { icon: "📊", title: "Hồ sơ nổi bật",       desc: "Trang hồ sơ công khai đầy đủ thống kê và đánh giá" },
          { icon: "🚀", title: "Bán nhanh hơn",       desc: "Người dùng Pro bán vé nhanh hơn 3x so với thường" },
        ].map(b => (
          <div key={b.title} className="pro-benefit-card">
            <div className="pro-benefit-icon">{b.icon}</div>
            <h3>{b.title}</h3>
            <p>{b.desc}</p>
          </div>
        ))}
      </div>

      {isPro && mySubscription && (
        <div className="pro-current-section">
          <div className="pro-current-card">
            <div className="pro-current-header">
              <span className="pro-badge-label">GoTix Pro</span>
              <span className="pro-current-status active">Đang hoạt động</span>
            </div>
            <div className="pro-current-info">
              <div className="pro-info-row">
                <span>Gói hiện tại</span>
                <strong>{PLAN_LABELS[mySubscription.plan] || mySubscription.plan}</strong>
              </div>
              <div className="pro-info-row">
                <span>Hết hạn vào</span>
                <strong>{formatDate(currentUser?.proEndDate)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pro-plans-section">
        <h2>{isPro ? "Gia hạn / Đổi gói" : "Chọn gói phù hợp"}</h2>
        <div className="pro-plans-grid">
          {plans.map(plan => {
            const isSelected = selected === plan.id;
            const isPopular  = plan.id === "3_months";
            return (
              <div
                key={plan.id}
                className={`pro-plan-card ${isSelected ? "selected" : ""} ${isPopular ? "popular" : ""}`}
                onClick={() => setSelected(plan.id)}
              >
                {isPopular && <div className="pro-plan-popular">Phổ biến nhất</div>}
                <h3 className="pro-plan-name">{plan.label}</h3>
                <div className="pro-plan-price">
                  <span className="pro-plan-amount">{formatPrice(plan.price)}</span>
                  <span className="pro-plan-per">/ {plan.label.toLowerCase()}</span>
                </div>
                <div className="pro-plan-per-day">
                  ~{formatPrice(Math.round(plan.price / plan.durationInDays))}/ngày
                </div>
                <div className={`pro-plan-radio ${isSelected ? "checked" : ""}`} />
              </div>
            );
          })}
        </div>

        <div className="pro-upgrade-action">
          <button
            className="btn btn-primary btn-lg pro-upgrade-btn"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading
              ? "Đang xử lý..."
              : isPro
              ? `Gia hạn gói ${PLAN_LABELS[selected]}`
              : `Nâng cấp Pro — ${formatPrice(selectedPlan?.price ?? 0)}`
            }
          </button>
        </div>
      </div>

      {isPro && (
        <div className="pro-cancel-section">
          {confirmCancel ? (
            <div className="pro-cancel-confirm">
              <p>Bạn có chắc muốn hủy gói Pro? Ưu tiên hiển thị sẽ mất ngay.</p>
              <div className="pro-cancel-btns">
                <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={loading}>
                  {loading ? "Đang hủy..." : "Xác nhận hủy"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)}>
                  Không, giữ lại
                </button>
              </div>
            </div>
          ) : (
            <button className="pro-cancel-link" onClick={() => setConfirmCancel(true)}>
              Hủy gói Pro
            </button>
          )}
        </div>
      )}
    </div>
  );
}
