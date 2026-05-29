import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiToggleFavorite, apiUnfavorite } from "../../api/client";
import "./TicketCard.css";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function TicketCard({ ticket, initialSaved = false }) {
  const { currentUser } = useAuth();
  const [saved,  setSaved]  = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const discount = ticket.originalPrice > 0
    ? Math.round(((ticket.originalPrice - ticket.passPrice) / ticket.originalPrice) * 100)
    : 0;

  const movieName = ticket.movieTitle || ticket.title || "Vé phim";
  const cinemaInfo = [ticket.cinema, ticket.city].filter(Boolean).join(" · ");
  const seatInfo   = [ticket.room, (ticket.seats || []).join(", ")].filter(Boolean).join(" · ");

  function handleCardClick(e) {
    if (e.target.closest(".ticket-fav-btn") || e.target.closest(".seller-link")) return;
    navigate(`/tickets/${ticket.id}`);
  }

  async function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || saving) return;
    setSaving(true);
    try {
      if (saved) { await apiUnfavorite(ticket.id); setSaved(false); }
      else        { await apiToggleFavorite(ticket.id); setSaved(true); }
    } finally { setSaving(false); }
  }

  return (
    <div onClick={handleCardClick} className="ticket-card" style={{ cursor: "pointer" }}>

      {/* Image / Placeholder */}
      <div className="ticket-card-image">
        {ticket.images?.[0] ? (
          <img src={ticket.images[0]} alt={movieName} />
        ) : (
          <div className="ticket-card-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2"/>
              <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5"/>
            </svg>
            <p>{movieName}</p>
          </div>
        )}

        {discount > 0 && <div className="ticket-discount-tag">-{discount}%</div>}

        {ticket.verified && (
          <div className="ticket-verified-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Đã xác minh
          </div>
        )}

        {currentUser && (
          <button
            className={`ticket-fav-btn ${saved ? "saved" : ""}`}
            onClick={handleFavorite}
            aria-label={saved ? "Bỏ lưu" : "Lưu vé"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor" strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="ticket-card-body">
        <h3 className="ticket-card-title">{movieName}</h3>

        <div className="ticket-card-info">
          {cinemaInfo && (
            <div className="ticket-info-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2"/>
                <path d="M7 2v20M17 2v20M2 12h20"/>
              </svg>
              <span>{cinemaInfo}</span>
            </div>
          )}
          {ticket.date && (
            <div className="ticket-info-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>{formatDate(ticket.date)}{ticket.time ? ` · ${ticket.time}` : ""}</span>
            </div>
          )}
          {seatInfo && (
            <div className="ticket-info-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/>
                <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/>
                <line x1="6" y1="18" x2="6" y2="22"/><line x1="18" y1="18" x2="18" y2="22"/>
              </svg>
              <span>{seatInfo}</span>
            </div>
          )}
        </div>

        <div className="ticket-card-price">
          <div className="price-pass">{formatPrice(ticket.passPrice)}</div>
          {ticket.originalPrice > ticket.passPrice && (
            <div className="price-original">{formatPrice(ticket.originalPrice)}</div>
          )}
        </div>

        <div className="ticket-card-footer">
          <span className="ticket-seller">
            {ticket.sellerId ? (
              <a href={`/users/${ticket.sellerId}`} className="seller-link" onClick={e => e.stopPropagation()}>
                {ticket.sellerName || "Ẩn danh"}
              </a>
            ) : (ticket.sellerName || "Ẩn danh")}
            {ticket.sellerRating > 0 && <span className="seller-rating">★ {ticket.sellerRating}</span>}
            {ticket.sellerIsPro && <span className="seller-pro-badge">{ticket.sellerBadge || "Pro"}</span>}
          </span>
          <span className="ticket-qty">{ticket.quantity} vé</span>
        </div>
      </div>

    </div>
  );
}
