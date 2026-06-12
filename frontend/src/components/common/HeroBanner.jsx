import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HeroBanner.css";

const QUICK_FILTERS = [
  { label: "CGV",          cinema: "CGV"      },
  { label: "BHD Star",     cinema: "BHD"      },
  { label: "Lotte Cinema", cinema: "Lotte"    },
  { label: "Galaxy",       cinema: "Galaxy"   },
  { label: "Metiz",        cinema: "Metiz"    },
  { label: "Starlight",    cinema: "Starlight"},
];

export default function HeroBanner() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity,  setSearchCity]  = useState("");

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q",    searchQuery);
    if (searchCity)  params.set("city", searchCity);
    navigate(`/tickets?${params.toString()}`);
  }

  return (
    <section className="hero-section">
      <div className="container hero-inner">

        {/* ── Left: copy + search ── */}
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Sàn pass vé phim #1 Đà Nẵng
          </div>

          <h1 className="hero-headline">
            Mua vé phim dư<br />
            <span className="hero-headline-sub">giá tốt · đã xác minh · bảo đảm giao dịch</span>
          </h1>

          <p className="hero-desc">
            Người bán đăng vé dư — GoTix xác minh — Bạn mua an toàn.
            Tiền được giữ qua nền tảng, hoàn tiền 100% nếu có sự cố.
          </p>

          {/* Search bar */}
          <form className="hero-searchbar" onSubmit={handleSearch}>
            <div className="hero-searchbar-field">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hero-searchbar-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Tên phim, rạp chiếu, ghế ngồi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="hero-searchbar-input"
              />
            </div>
            <div className="hero-searchbar-sep" />
            <select
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              className="hero-searchbar-city"
            >
              <option value="">Tất cả khu vực</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
            </select>
            <button type="submit" className="hero-searchbar-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Tìm vé
            </button>
          </form>

          {/* Quick cinema filters */}
          <div className="hero-quickfilter">
            <span className="hero-quickfilter-label">Rạp:</span>
            {QUICK_FILTERS.map(f => (
              <button
                key={f.cinema}
                className="hero-quickfilter-btn"
                onClick={() => navigate(`/tickets?cinema=${f.cinema}`)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: stats + trust panel ── */}
        <div className="hero-panel">
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>500+</strong>
              <span>Vé đã giao dịch thành công</span>
            </div>
            <div className="hero-stat-line" />
            <div className="hero-stat">
              <strong>100%</strong>
              <span>Vé được xác minh trước khi đăng</span>
            </div>
            <div className="hero-stat-line" />
            <div className="hero-stat">
              <strong>98%</strong>
              <span>Tỉ lệ giao dịch thành công</span>
            </div>
          </div>

          <ul className="hero-trust-list">
            <li>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Tiền giữ qua GoTix — nhận vé mới chuyển cho người bán
            </li>
            <li>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Vé kiểm duyệt kỹ trước khi được phép đăng bán
            </li>
            <li>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              Hoàn tiền 100% nếu giao dịch có sự cố
            </li>
            <li>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
                <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
              Hỗ trợ 24/7 · Phản hồi trong 15 phút
            </li>
          </ul>

          <Link to="/tickets" className="hero-panel-link">
            Xem tất cả vé đang bán
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
