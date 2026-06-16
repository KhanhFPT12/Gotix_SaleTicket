import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HeroBanner.css";

const BANNERS = [
  {
    id: 1,
    tag: "🎬 Marketplace vé phim #1 Đà Nẵng",
    title: "Pass vé xem phim dư",
    titleSub: "An toàn · Nhanh chóng",
    desc: "Mua lại vé phim từ người dùng khác. Vé được xác minh, giao dịch qua GoTix — minh bạch từ đầu đến cuối.",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1d4ed8 100%)",
    accent: "#60a5fa",
    emoji: "🎟️",
    stats: [
      { value: "500+", label: "Vé đã bán" },
      { value: "100%", label: "Xác minh thật" },
      { value: "98%",  label: "Thành công" },
    ],
  },
  {
    id: 2,
    tag: "🔒 Giao dịch bảo mật",
    title: "Thanh toán qua GoTix",
    titleSub: "Tiền giữ đến khi nhận vé",
    desc: "Không lo mất tiền oan. GoTix giữ tiền trung gian và chỉ chuyển cho người bán khi bạn nhận vé thành công.",
    gradient: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #16a34a 100%)",
    accent: "#4ade80",
    emoji: "🛡️",
    stats: [
      { value: "0đ",   label: "Phí ẩn" },
      { value: "15p",  label: "Xác nhận" },
      { value: "100%", label: "Bảo vệ" },
    ],
  },
  {
    id: 3,
    tag: "💰 Dành cho người có vé dư",
    title: "Đăng vé phim miễn phí",
    titleSub: "Tiền về ví nhanh chóng",
    desc: "Chỉ 5 phút để đăng vé lên GoTix. Tiếp cận hàng trăm người mua và nhận tiền ngay khi giao dịch hoàn tất.",
    gradient: "linear-gradient(135deg, #431407 0%, #9a3412 55%, #f97316 100%)",
    accent: "#fb923c",
    emoji: "📤",
    stats: [
      { value: "5p",   label: "Đăng vé" },
      { value: "200+", label: "Người mua" },
      { value: "Free", label: "Hoàn toàn miễn phí" },
    ],
  },
  {
    id: 4,
    tag: "👑 GoTix Pro — Bán ưu tiên",
    title: "Nâng cấp tài khoản Pro",
    titleSub: "Hiển thị đầu danh sách",
    desc: "Badge xác thực nổi bật, vé ưu tiên hiển thị, hỗ trợ VIP 24/7. Bán nhanh hơn gấp 3 lần với GoTix Pro.",
    gradient: "linear-gradient(135deg, #2e1065 0%, #5b21b6 55%, #7c3aed 100%)",
    accent: "#c4b5fd",
    emoji: "👑",
    stats: [
      { value: "3×",   label: "Hiển thị nhiều hơn" },
      { value: "VIP",  label: "Hỗ trợ ưu tiên" },
      { value: "Pro",  label: "Badge đặc biệt" },
    ],
  },
];

const AUTO_DELAY = 6000;

export default function HeroBanner() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity,  setSearchCity]  = useState("");
  const [current,  setCurrent]  = useState(0);
  const timerRef = useRef(null);

  const goTo = useCallback((idx) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => goTo((current + 1) % BANNERS.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + BANNERS.length) % BANNERS.length), [current, goTo]);

  useEffect(() => {
    timerRef.current = setInterval(next, AUTO_DELAY);
    return () => clearInterval(timerRef.current);
  }, [next]);

  function resetTimer() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, AUTO_DELAY);
  }

  function handlePrev() { prev(); resetTimer(); }
  function handleNext() { next(); resetTimer(); }
  function handleDot(i) {
    if (i !== current) { goTo(i); resetTimer(); }
  }

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchCity)  params.set("city", searchCity);
    navigate(`/tickets?${params.toString()}`);
  }

  const b = BANNERS[current];

  return (
    <section className="hb-section">
      <div className="hb-root">
        {/* Background crossfade — map over all banners so they transition smoothly */}
        {BANNERS.map((banner, i) => (
          <div
            key={`bg-${banner.id}`}
            className={`hb-slide-bg ${i === current ? "hb-slide-bg--active" : ""}`}
            style={{ background: banner.gradient }}
          >
            <div className="hb-blob hb-blob--1" style={{ background: banner.accent }} />
            <div className="hb-blob hb-blob--2" style={{ background: banner.accent }} />
            <div className="hb-blob hb-blob--3" style={{ background: banner.accent }} />
          </div>
        ))}

        {/* Content — overlay on top of slide */}
        <div className="hb-content">
          <div className="container">
            {/* The key on layout triggers a smooth CSS fade-in animation */}
            <div className="hb-layout" key={`layout-${b.id}`}>

              {/* Left */}
              <div className="hb-left">
                <span className="hb-tag">{b.tag}</span>
                <h1 className="hb-title">
                  {b.title}<br />
                  <span className="hb-title-sub" style={{ color: b.accent }}>{b.titleSub}</span>
                </h1>
                <p className="hb-desc">{b.desc}</p>

                {/* Stats */}
                <div className="hb-stats">
                  {b.stats.map((s, i) => (
                    <div className="hb-stat" key={i}>
                      <strong style={{ color: b.accent }}>{s.value}</strong>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Emoji visual */}
              <div className="hb-right">
                <div className="hb-emoji-ring" style={{ borderColor: b.accent + "44", background: b.accent + "14" }}>
                  <div className="hb-emoji-inner" style={{ borderColor: b.accent + "33" }}>
                    <span className="hb-emoji">{b.emoji}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Search bar — nằm dưới text */}
            <form className="hb-search" onSubmit={handleSearch}>
              <div className="hb-search-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hb-search-icon">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Tìm theo tên phim, rạp, địa điểm..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="hb-search-input"
                />
              </div>
              <select
                value={searchCity}
                onChange={e => setSearchCity(e.target.value)}
                className="hb-search-select"
              >
                <option value="">Tất cả khu vực</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
              </select>
              <button type="submit" className="hb-search-btn" style={{ background: b.accent, color: "#111" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Tìm vé
              </button>
            </form>

            {/* Trust row */}
            <div className="hb-trust">
              <span className="hb-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={b.accent} strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                Vé xác minh thật
              </span>
              <span className="hb-trust-sep">·</span>
              <span className="hb-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={b.accent} strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Thanh toán bảo mật
              </span>
              <span className="hb-trust-sep">·</span>
              <span className="hb-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={b.accent} strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Hỗ trợ 24/7
              </span>
              <span className="hb-trust-sep">·</span>
              <span className="hb-trust-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={b.accent} strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Hoàn tiền nếu có sự cố
              </span>
            </div>
          </div>
        </div>

        {/* Arrows */}
        <button className="hb-arrow hb-arrow--prev" onClick={handlePrev} aria-label="Banner trước">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button className="hb-arrow hb-arrow--next" onClick={handleNext} aria-label="Banner tiếp">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {/* Dots */}
        <div className="hb-dots">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              className={`hb-dot ${i === current ? "hb-dot--active" : ""}`}
              onClick={() => handleDot(i)}
              style={i === current ? { background: b.accent } : {}}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="hb-progress" key={`prog-${b.id}-${current}`}>
          <div className="hb-progress__bar" style={{ animationDuration: `${AUTO_DELAY}ms`, background: b.accent }} />
        </div>
      </div>
    </section>
  );
}
