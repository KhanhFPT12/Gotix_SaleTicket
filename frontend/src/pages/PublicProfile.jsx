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

function StarRating({ rating, size = "md" }) {
  const rounded = Math.round(rating);
  return (
    <span className={`star-row star-row--${size}`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star ${i <= rounded ? "star--filled" : ""}`}>★</span>
      ))}
    </span>
  );
}

function TrustBar({ score }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#ef4444";
  const label = score >= 70 ? "Uy tín cao" : score >= 40 ? "Trung bình" : "Cần thận trọng";
  return (
    <div className="trust-bar">
      <div className="trust-bar__row">
        <span className="trust-bar__score" style={{ color }}>Trust Score: {score}/100</span>
        <span className="trust-bar__label" style={{ color }}>{label}</span>
      </div>
      <div className="trust-bar__bg">
        <div className="trust-bar__fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function TicketCard({ ticket }) {
  const norm = normalizeTicket(ticket);
  return (
    <Link to={`/tickets/${norm.id}`} className="pp-ticket-card">
      <div className="pp-ticket-card__img">
        {norm.images?.[0]
          ? <img src={norm.images[0]} alt={norm.title} />
          : <div className="pp-ticket-card__img-placeholder">{norm.title?.charAt(0)}</div>
        }
      </div>
      <div className="pp-ticket-card__body">
        <p className="pp-ticket-card__title">{norm.title}</p>
        {norm.location && <p className="pp-ticket-card__location">{norm.location}</p>}
        <p className="pp-ticket-card__price">{formatPrice(norm.passPrice)}</p>
      </div>
    </Link>
  );
}

function ReviewCard({ review }) {
  const buyerName = review.buyerId?.name ?? "Ẩn danh";
  const buyerAv   = review.buyerId?.avatar ? resolveMediaUrl(review.buyerId.avatar) : null;
  return (
    <div className="pp-review">
      <div className="pp-review__header">
        <div className="pp-review__buyer">
          {buyerAv
            ? <img src={buyerAv} alt={buyerName} className="pp-review__avatar" />
            : <div className="pp-review__avatar pp-review__avatar--placeholder">{buyerName.charAt(0).toUpperCase()}</div>
          }
          <div>
            <p className="pp-review__name">{buyerName}</p>
            {review.ticketId?.title && (
              <p className="pp-review__ticket">Vé: {review.ticketId.title}</p>
            )}
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      {review.comment && <p className="pp-review__comment">{review.comment}</p>}
    </div>
  );
}

export default function PublicProfile() {
  const { id } = useParams();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    apiGetPublicProfile(id)
      .then(res => { if (res.success) setData(res.data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="pp-page">
      <div className="container pp-loading">Đang tải hồ sơ...</div>
    </div>
  );

  if (notFound || !data) return (
    <div className="pp-page">
      <div className="container pp-not-found">
        <p>Không tìm thấy người dùng</p>
        <Link to="/tickets" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
          Quay lại danh sách vé
        </Link>
      </div>
    </div>
  );

  const { user, stats, reviews = [], activeListings = [] } = data;
  const avatarUrl  = user.avatar ? resolveMediaUrl(user.avatar) : null;
  const trustScore = user.trustScore ?? 50;

  return (
    <div className="pp-page">
      <div className="container">

        {/* ── Profile header ─────────────────────────────── */}
        <div className="pp-header">
          <div className="pp-header__avatar-wrap">
            {avatarUrl
              ? <img src={avatarUrl} alt={user.name} className="pp-header__avatar" />
              : <div className="pp-header__avatar pp-header__avatar--placeholder">{user.name?.charAt(0).toUpperCase()}</div>
            }
            {user.isPro && (
              <span className="pp-pro-badge">{user.proBadge || "GoTix Pro"}</span>
            )}
          </div>

          <div className="pp-header__info">
            <div className="pp-header__name-row">
              <h1 className="pp-header__name">{user.name}</h1>
              {user.verified && (
                <span className="pp-verified">Đã xác minh</span>
              )}
            </div>
            <p className="pp-header__joined">Tham gia {formatDate(user.createdAt)}</p>

            {user.rating > 0 && (
              <div className="pp-header__rating">
                <StarRating rating={user.rating} />
                <span className="pp-header__rating-num">{user.rating.toFixed(1)}</span>
                <span className="pp-header__review-count">({user.reviewCount} đánh giá)</span>
              </div>
            )}

            <div className="pp-header__trust">
              <TrustBar score={trustScore} />
            </div>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────── */}
        <div className="pp-stats">
          <div className="pp-stat">
            <span className="pp-stat__val">{stats.totalPosted}</span>
            <span className="pp-stat__lbl">Vé đã đăng</span>
          </div>
          <div className="pp-stat">
            <span className="pp-stat__val">{stats.totalSold}</span>
            <span className="pp-stat__lbl">Đã bán thành công</span>
          </div>
          <div className="pp-stat">
            <span className="pp-stat__val">{activeListings.length}</span>
            <span className="pp-stat__lbl">Đang bán</span>
          </div>
          {user.reviewCount > 0 && (
            <div className="pp-stat">
              <span className="pp-stat__val">{user.rating?.toFixed(1) ?? "—"}</span>
              <span className="pp-stat__lbl">Điểm đánh giá</span>
            </div>
          )}
        </div>

        {/* ── 2-column body ──────────────────────────────── */}
        <div className="pp-body">

          {/* Cột trái: vé + reviews */}
          <div className="pp-main">

            {activeListings.length > 0 ? (
              <div className="pp-section">
                <h2 className="pp-section__title">Vé đang bán ({activeListings.length})</h2>
                <div className="pp-tickets-grid">
                  {activeListings.map(t => <TicketCard key={t._id} ticket={t} />)}
                </div>
              </div>
            ) : (
              <div className="pp-section pp-section--empty">
                <p>Người dùng này hiện không có vé nào đang bán</p>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="pp-section">
                <h2 className="pp-section__title">Đánh giá từ người mua ({reviews.length})</h2>
                <div className="pp-reviews-list">
                  {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: bio + thông tin */}
          <aside className="pp-aside">
            <div className="pp-aside-card">
              <h4 className="pp-aside-card__title">Thông tin</h4>
              {user.bio && (
                <p className="pp-aside-card__bio">{user.bio}</p>
              )}
              <div className="pp-aside-card__rows">
                {user.location && (
                  <div className="pp-aside-card__row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="pp-aside-card__row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Tham gia {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              to={`/chat?sellerId=${id}`}
              className="btn btn-outline btn-sm pp-chat-btn"
            >
              Nhắn tin
            </Link>
          </aside>
        </div>

      </div>
    </div>
  );
}
