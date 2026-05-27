import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiToggleFavorite, apiUnfavorite } from "../../api/client";
import { TICKET_CATEGORIES } from "../../data/mockData";
import "./TicketCard.css";

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const categoryColors = {
  concert: "badge-info", movie: "badge-neutral", sport: "badge-success",
  workshop: "badge-warning", event: "badge-info", bus: "badge-neutral",
};
const categoryPlaceholders = {
  concert: "#1a2744", movie: "#2c3e50", sport: "#1e5631",
  workshop: "#7d4608", event: "#1a3a5c", bus: "#4a4a4a",
};

export default function TicketCard({ ticket, initialSaved = false }) {
  const { currentUser } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const category = TICKET_CATEGORIES.find((c) => c.id === ticket.category);
  const discount = Math.round(((ticket.originalPrice - ticket.passPrice) / ticket.originalPrice) * 100);

  const handleCardClick = (e) => {
    if (e.target.closest('.ticket-fav-btn') || e.target.closest('.seller-link')) {
      return;
    }
    navigate(`/tickets/${ticket.id}`);
  };

  async function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || saving) return;
    setSaving(true);
    try {
      if (saved) {
        await apiUnfavorite(ticket.id);
        setSaved(false);
      } else {
        await apiToggleFavorite(ticket.id);
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={handleCardClick} className="ticket-card" style={{ cursor: "pointer" }}>
      <div className="ticket-card-image">
        {ticket.images?.[0] ? (
          <img src={ticket.images[0]} alt={ticket.title} />
        ) : (
          <div
            className="ticket-card-placeholder"
            style={{ backgroundColor: categoryPlaceholders[ticket.category] || "#333" }}
          >
            <span>{category?.icon}</span>
            <p>{category?.label}</p>
          </div>
        )}
        {discount > 0 && <div className="ticket-discount-tag">-{discount}%</div>}

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
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
      </div>

      <div className="ticket-card-body">
        <div className="ticket-card-meta">
          <span className={`badge ${categoryColors[ticket.category] || "badge-neutral"}`}>
            {category?.label}
          </span>
          {ticket.verified && <span className="badge badge-success verified-badge">Đã xác minh</span>}
        </div>

        <h3 className="ticket-card-title">{ticket.title}</h3>

        <div className="ticket-card-info">
          <div className="ticket-info-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span>{ticket.location}</span>
          </div>
          <div className="ticket-info-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{ticket.date ? formatDate(ticket.date) : '—'} · {ticket.time}</span>
          </div>
        </div>

        <div className="ticket-card-price">
          <div className="price-pass">{formatPrice(ticket.passPrice)}</div>
          <div className="price-original">{formatPrice(ticket.originalPrice)}</div>
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
        </div>
      </div>
    </div>
  );
}
