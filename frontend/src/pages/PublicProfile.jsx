import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGetPublicProfile, resolveMediaUrl } from "../api/client";
import "./PublicProfile.css";

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
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

export default function PublicProfile() {
  const { id } = useParams();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGetPublicProfile(id).then(res => {
      if (res.success) setData(res.data);
      else setNotFound(true);
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="public-profile-page"><div className="profile-loading">Đang tải...</div></div>;
  }
  if (notFound || !data) {
    return <div className="public-profile-page"><div className="profile-not-found">Không tìm thấy người dùng</div></div>;
  }

  const { user, stats, reviews } = data;
  const avatarUrl = user.avatar ? resolveMediaUrl(user.avatar) : null;

  return (
    <div className="public-profile-page">
      <div className="public-profile-card">
        <div className="profile-avatar-wrap">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          {user.isPro && (
            <div className="profile-pro-badge">{user.proBadge || "GoTix Pro"}</div>
          )}
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
        </div>
      </div>

      <div className="profile-stats-row">
        <div className="profile-stat">
          <div className="stat-value">{stats.totalPosted}</div>
          <div className="stat-label">Vé đã đăng</div>
        </div>
        <div className="profile-stat">
          <div className="stat-value">{stats.totalSold}</div>
          <div className="stat-label">Giao dịch thành công</div>
        </div>
        {user.reviewCount > 0 && (
          <div className="profile-stat">
            <div className="stat-value">{user.rating?.toFixed(1) ?? "—"}</div>
            <div className="stat-label">Điểm đánh giá</div>
          </div>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="profile-reviews-section">
          <h2 className="section-title">Đánh giá từ người mua</h2>
          <div className="profile-reviews-list">
            {reviews.map(r => {
              const buyerName = r.buyerId?.name ?? "Ẩn danh";
              const buyerAvatar = r.buyerId?.avatar ? resolveMediaUrl(r.buyerId.avatar) : null;
              return (
                <div key={r._id} className="profile-review-card">
                  <div className="review-header">
                    <div className="review-buyer">
                      {buyerAvatar ? (
                        <img src={buyerAvatar} alt={buyerName} className="review-buyer-avatar" />
                      ) : (
                        <div className="review-buyer-avatar placeholder">{buyerName.charAt(0).toUpperCase()}</div>
                      )}
                      <span className="review-buyer-name">{buyerName}</span>
                    </div>
                    <StarRating rating={r.rating} />
                  </div>
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                  {r.ticketId?.title && (
                    <p className="review-ticket-ref">Vé: {r.ticketId.title}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
