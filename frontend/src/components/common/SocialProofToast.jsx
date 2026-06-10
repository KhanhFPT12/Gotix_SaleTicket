import { useState, useEffect, useRef } from "react";
import { apiGet } from "../../api/client";
import "./SocialProofToast.css";

// ──────────────────────────────────────────────────────────────────────────────
// Mock fallback — dùng khi DB chưa đủ dữ liệu
// ──────────────────────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  { buyerName: "Minh T.",     movieTitle: "Avengers: Secret Wars",  cinema: "CGV Vincom",    city: "Đà Nẵng", quantity: 2, completedAt: new Date(Date.now() - 2 * 60 * 1000) },
  { buyerName: "Thu H.",      movieTitle: "Inside Out 3",           cinema: "Lotte Cinema",  city: "Đà Nẵng", quantity: 1, completedAt: new Date(Date.now() - 5 * 60 * 1000) },
  { buyerName: "Quốc B.",     movieTitle: "Avengers: Secret Wars",  cinema: "BHD Star",      city: "Đà Nẵng", quantity: 2, completedAt: new Date(Date.now() - 8 * 60 * 1000) },
  { buyerName: "Lan A.",      movieTitle: "Mission Impossible 8",   cinema: "Galaxy Cinema", city: "Đà Nẵng", quantity: 1, completedAt: new Date(Date.now() - 14 * 60 * 1000) },
  { buyerName: "Đức H.",      movieTitle: "Inside Out 3",           cinema: "CGV Vincom",    city: "Đà Nẵng", quantity: 2, completedAt: new Date(Date.now() - 19 * 60 * 1000) },
  { buyerName: "Ngọc M.",     movieTitle: "Avengers: Secret Wars",  cinema: "Mega GS",       city: "Đà Nẵng", quantity: 1, completedAt: new Date(Date.now() - 24 * 60 * 1000) },
  { buyerName: "Hoàng N.",    movieTitle: "Deadpool & Wolverine",   cinema: "Lotte Cinema",  city: "Đà Nẵng", quantity: 2, completedAt: new Date(Date.now() - 31 * 60 * 1000) },
  { buyerName: "Phương L.",   movieTitle: "Inside Out 3",           cinema: "BHD Star",      city: "Đà Nẵng", quantity: 1, completedAt: new Date(Date.now() - 38 * 60 * 1000) },
  { buyerName: "Trọng K.",    movieTitle: "Avengers: Secret Wars",  cinema: "CGV Vincom",    city: "Đà Nẵng", quantity: 2, completedAt: new Date(Date.now() - 45 * 60 * 1000) },
  { buyerName: "Bảo C.",      movieTitle: "Mission Impossible 8",   cinema: "Galaxy Cinema", city: "Đà Nẵng", quantity: 1, completedAt: new Date(Date.now() - 52 * 60 * 1000) },
];

// Định dạng thời gian tương đối
function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs  = Math.floor(mins / 60);
  if (mins < 1)  return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  if (hrs  < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

// Tạo màu avatar nhất quán theo tên
const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#0ea5e9", "#3b82f6",
];
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const POLL_INTERVAL = 30_000; // poll mỗi 30 giây
const MIN_ITEMS     = 8;      // đảm bảo tối thiểu 8 item cho ticker chạy đẹp

// ──────────────────────────────────────────────────────────────────────────────
// Component chính
// ──────────────────────────────────────────────────────────────────────────────
export default function SocialProofToast() {
  const [items, setItems] = useState(MOCK_EVENTS);
  const pollRef = useRef(null);

  async function fetchRecent() {
    try {
      const res = await apiGet("/transactions/recent-public?limit=15");
      if (res.success && Array.isArray(res.data?.transactions) && res.data.transactions.length > 0) {
        const real = res.data.transactions;
        // Nếu DB chưa đủ items, ghép thêm mock để ticker chạy liền mạch
        if (real.length < MIN_ITEMS) {
          const needed = MIN_ITEMS - real.length;
          setItems([...real, ...MOCK_EVENTS.slice(0, needed)]);
        } else {
          setItems(real);
        }
      }
      // Nếu API lỗi hoặc trống → giữ mock
    } catch {
      // Giữ nguyên mock data nếu API fail
    }
  }

  useEffect(() => {
    fetchRecent(); // Fetch ngay khi mount

    pollRef.current = setInterval(fetchRecent, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Nhân đôi danh sách để ticker chạy liền mạch (seamless loop)
  const tickerItems = [...items, ...items];

  return (
    <div className="sp-ticker" role="marquee" aria-label="Hoạt động mua vé gần đây">
      {/* Label bên trái */}
      <div className="sp-ticker__label">
        <span className="sp-ticker__live-dot" />
        <span>Đang mua</span>
      </div>

      {/* Track chạy ngang */}
      <div className="sp-ticker__track-wrap">
        <div className="sp-ticker__track">
          {tickerItems.map((ev, idx) => {
            const color = getAvatarColor(ev.buyerName);
            return (
              <div className="sp-ticker__item" key={idx}>
                {/* Avatar */}
                <div className="sp-ticker__avatar" style={{ background: color }}>
                  {ev.buyerName?.charAt(0) || "?"}
                </div>

                {/* Text */}
                <span className="sp-ticker__text">
                  <strong>{ev.buyerName}</strong>
                  {" vừa mua "}
                  <strong>{ev.quantity} vé</strong>
                  {" "}
                  <span className="sp-ticker__movie">"{ev.movieTitle}"</span>
                  {" · "}
                  <span className="sp-ticker__cinema">{ev.cinema}</span>
                  {" · "}
                  <span className="sp-ticker__time">{timeAgo(ev.completedAt)}</span>
                </span>

                {/* Verified badge */}
                <span className="sp-ticker__verified">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Xác minh
                </span>

                {/* Separator */}
                <span className="sp-ticker__sep">✦</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
