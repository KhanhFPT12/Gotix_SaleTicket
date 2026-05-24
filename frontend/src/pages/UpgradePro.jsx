import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import { useAuth } from "../context/AuthContext";
import { apiGetProPlans, normalizeProSubscription } from "../api/client";
import "./UpgradePro.css";

const PLAN_LABELS = {
  "1_month":   "1 Tháng",
  "3_months":  "3 Tháng",
  "6_months":  "6 Tháng",
  "1_year":    "1 Năm",
};

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function UpgradePro() {
  const { currentUser, refreshUser } = useAuth();
  const { mySubscription, upgradePro, cancelPro, refreshSubscription } = useTickets();
  const navigate = useNavigate();

  const [plans, setPlans]         = useState([]);
  const [selected, setSelected]   = useState("3_months");
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    apiGetProPlans().then(res => {
      if (res.success) setPlans(res.data.plans || []);
    });
  }, []);

  async function handleUpgrade() {
    try {
      setLoading(true);
      await upgradePro(selected);
      if (refreshUser) await refreshUser();
      setSuccess(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    try {
      setLoading(true);
      await cancelPro();
      if (refreshUser) await refreshUser();
      setConfirmCancel(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="upgrade-pro-page">
        <div className="pro-success-card">
          <div className="pro-success-icon">🌟</div>
          <h2>Chúc mừng! Bạn đã là GoTix Pro</h2>
          <p>Tài khoản của bạn đã được nâng cấp thành công. Vé của bạn sẽ được ưu tiên hiển thị trên trang chủ.</p>
          <div className="pro-success-actions">
            <button className="btn btn-primary" onClick={() => navigate("/post-ticket")}>Đăng vé ngay</button>
            <button className="btn btn-outline" onClick={() => navigate("/buyer")}>Về trang của tôi</button>
          </div>
        </div>
      </div>
    );
  }

  const isPro = currentUser?.isPro;

  return (
    <div className="upgrade-pro-page">
      <div className="pro-hero">
        <div className="pro-hero-badge">GoTix Pro</div>
        <h1 className="pro-hero-title">Nâng cấp tài khoản Pro</h1>
        <p className="pro-hero-sub">Vé của bạn được ưu tiên hiển thị đầu tiên — tiếp cận nhiều người mua hơn</p>
      </div>

      <div className="pro-benefits">
        {[
          { icon: "⚡", title: "Ưu tiên hiển thị", desc: "Vé của bạn luôn xuất hiện đầu trang tìm kiếm" },
          { icon: "✅", title: "Badge Pro xác nhận", desc: "Huy hiệu GoTix Pro tăng độ tin cậy với người mua" },
          { icon: "📊", title: "Hồ sơ nổi bật", desc: "Trang hồ sơ công khai đầy đủ thống kê và đánh giá" },
          { icon: "🚀", title: "Bán nhanh hơn", desc: "Người dùng Pro bán vé nhanh hơn 3x so với thường" },
        ].map(b => (
          <div key={b.title} className="pro-benefit-card">
            <div className="pro-benefit-icon">{b.icon}</div>
            <h3>{b.title}</h3>
            <p>{b.desc}</p>
          </div>
        ))}
      </div>

      {isPro && mySubscription ? (
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
            <div className="pro-current-actions">
              <p className="pro-renew-hint">Gia hạn để tiếp tục hưởng ưu tiên hiển thị</p>
            </div>
          </div>
        </div>
      ) : null}

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
            {loading ? "Đang xử lý..." : isPro ? `Gia hạn gói ${PLAN_LABELS[selected]}` : `Nâng cấp Pro — ${formatPrice(plans.find(p => p.id === selected)?.price ?? 0)}`}
          </button>
          <p className="pro-upgrade-note">Thanh toán mô phỏng — không trừ tiền thật</p>
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
