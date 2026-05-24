import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetPublicProfile, resolveMediaUrl, normalizeTicket } from "../api/client";
import "./PublicProfile.css";

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}
function formatPrice(p) {
  return new Intl.NumberFormat("vi-VN").format(p) + "đ";
}

function StarRating({ rating }) {
  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? "star filled" : "star"}>★</span>
      ))}
    </span>
  );
}

function TrustBar({ score }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#ef4444";
  const label = score >= 70 ? "Uy tín cao" : score >= 40 ? "Trung bình" : "Cần thận trọng";
  return (
    <div className="trust-bar-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>Trust Score: {score}/100</span>
        <span style={{ fontSize: 12, color }}>{label}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 99, transition: "width .4s" }} />
      </div>
    </div>
  );
}

export default function PublicProfile() {
  const { id } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGetPublicProfile(id)
      .then(res => { if (res.success) setData(res.data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="public-profile-page"><div className="profile-loading">Đang tải...</div></div>;
  if (notFound || !data) return <div className="public-profile-page"><div className="profile-not-found">Không tìm thấy người dùng</div></div>;

  const { user, stats, reviews, activeListings = [] } = data;
  const avatarUrl = user.avatar ? resolveMediaUrl(user.avatar) : null;
  const trustScore = user.trustScore ?? 50;

  return (
    <div className="public-profile-page">
      {/* Profile card */}
      <div className="public-profile-card">
        <div className="profile-avatar-wrap">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-placeholder">{user.name?.charAt(0).toUpperCase()}</div>
          )}
          {user.isPro && <div className="profile-pro-badge">{user.proBadge || "GoTix Pro"}</div>}
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h1 className="profile-name">{user.name}</h1>
            {user.verified && <span className="profile-verified-badge">Đã xác minh</span>}
          </div>
          <p className="profile-joined">Tham gia {formatDate(user.createdAt)}</p>

          {user.rating > 0 && (
            <div className="profile-rating-row">
              <StarRating rating={user.rating} />
              <span className="profile-rating-num">{user.rating.toFixed(1)}</span>
              <span className="profile-review-count">({user.reviewCount} đánh giá)</span>
            </div>
          )}

          <div style={{ marginTop: 12, maxWidth: 320 }}>
            <TrustBar score={trustScore} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats-row">
        <div className="profile-stat">
          <div className="stat-value">{stats.totalPosted}</div>
          <div className="stat-label">Vé đã đăng</div>
        </div>
        <div className="profile-stat">
          <div className="stat-value">{stats.totalSold}</div>
          <div className="stat-label">Đã bán thành công</div>
        </div>
        {user.reviewCount > 0 && (
          <div className="profile-stat">
            <div className="stat-value">{user.rating?.toFixed(1) ?? "—"}</div>
            <div className="stat-label">Điểm đánh giá</div>
          </div>
        )}
        <div className="profile-stat">
          <div className="stat-value" style={{ color: trustScore >= 70 ? "#16a34a" : trustScore >= 40 ? "#d97706" : "#ef4444" }}>
            {trustScore}
          </div>
          <div className="stat-label">Trust Score</div>
        </div>
      </div>

      {/* Active listings */}
      {activeListings.length > 0 && (
        <div className="profile-section">
          <h2 className="section-title">Vé đang bán ({activeListings.length})</h2>
          <div className="profile-listings-grid">
            {activeListings.map(t => {
              const norm = normalizeTicket(t);
              return (
                <Link key={norm.id} to={`/tickets/${norm.id}`} className="profile-listing-card">
                  <div className="plc-title">{norm.title}</div>
                  <div className="plc-meta">{norm.location}</div>
                  <div className="plc-price">{formatPrice(norm.passPrice)}</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="profile-reviews-section">
          <h2 className="section-title">Đánh giá từ người mua</h2>
          <div className="profile-reviews-list">
            {reviews.map(r => {
              const buyerName  = r.buyerId?.name ?? "Ẩn danh";
              const buyerAv    = r.buyerId?.avatar ? resolveMediaUrl(r.buyerId.avatar) : null;
              return (
                <div key={r._id} className="profile-review-card">
                  <div className="review-header">
                    <div className="review-buyer">
                      {buyerAv ? (
                        <img src={buyerAv} alt={buyerName} className="review-buyer-avatar" />
                      ) : (
                        <div className="review-buyer-avatar placeholder">{buyerName.charAt(0).toUpperCase()}</div>
                      )}
                      <span className="review-buyer-name">{buyerName}</span>
                    </div>
                    <StarRating rating={r.rating} />
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                  {r.ticketId?.title && <p className="review-ticket-ref">Vé: {r.ticketId.title}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
