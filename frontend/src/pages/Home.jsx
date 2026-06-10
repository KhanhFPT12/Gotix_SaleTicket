import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import TicketCard from "../components/tickets/TicketCard";
import "./Home.css";

const CINEMA_QUICKLINKS = [
  { label: "Tất cả",       cinema: "" },
  { label: "CGV",          cinema: "CGV" },
  { label: "BHD Star",     cinema: "BHD" },
  { label: "Lotte Cinema", cinema: "Lotte" },
  { label: "Galaxy",       cinema: "Galaxy" },
  { label: "Mega GS",      cinema: "Mega" },
];

export default function Home() {
  const navigate = useNavigate();
  const { tickets } = useTickets();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity]   = useState("");

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchCity)  params.set("city", searchCity);
    navigate(`/tickets?${params.toString()}`);
  }

  const latestTickets = tickets.filter(t => t.status === "approved").slice(0, 8);

  return (
    <div className="home">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">

            <h1 className="hero-title">
              Pass vé xem phim dư<br />An toàn · Nhanh chóng
            </h1>
            <p className="hero-subtitle">
              Mua lại vé phim từ người dùng khác. Vé được xác minh, giao dịch qua GoTix — minh bạch từ đầu đến cuối.
            </p>

            <form className="search-bar" onSubmit={handleSearch}>
              <div className="search-input-wrap">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Tìm theo tên phim, rạp..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                value={searchCity}
                onChange={e => setSearchCity(e.target.value)}
                className="search-select"
              >
                <option value="">Tất cả khu vực</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
              </select>
              <button type="submit" className="btn btn-primary btn-lg search-btn">
                Tìm vé
              </button>
            </form>


          </div>
        </div>
      </section>

      {/* ── Cinema quick filters ── */}
      <section className="section section-tight">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Tìm theo rạp</h2>
            <Link to="/tickets" className="section-link">Xem tất cả</Link>
          </div>
          <div className="cinema-quicklinks">
            {CINEMA_QUICKLINKS.map(ql => (
              <Link
                key={ql.label}
                to={ql.cinema ? `/tickets?cinema=${ql.cinema}` : "/tickets"}
                className="cinema-chip"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                  <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5"/>
                </svg>
                {ql.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest tickets ── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Vé phim mới đăng</h2>
            <Link to="/tickets" className="section-link">Xem tất cả</Link>
          </div>
          {latestTickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
              <p>Chưa có vé phim nào. Hãy là người đầu tiên đăng vé!</p>
              <Link to="/post-ticket" className="btn btn-primary mt-md">Đăng vé phim</Link>
            </div>
          ) : (
            <div className="tickets-grid">
              {latestTickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Mua vé phim pass lại — 3 bước đơn giản</h2>
            <p className="section-desc">An toàn, minh bạch, có GoTix đảm bảo mỗi giao dịch</p>
          </div>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Đăng vé phim</h3>
              <p>Người có vé dư đăng thông tin, upload ảnh vé hoặc mã QR để xác minh.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>GoTix xác minh</h3>
              <p>Đội ngũ GoTix kiểm tra vé trước khi hiển thị — đảm bảo vé hợp lệ, không giả mạo.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Thanh toán & Nhận vé</h3>
              <p>Người mua chuyển khoản QR, admin xác nhận và vé được chuyển cho bạn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-box">
            <div>
              <h3>Có vé phim muốn pass lại?</h3>
              <p>Đăng vé miễn phí, tiếp cận hàng nghìn người mua vé phim ngay hôm nay.</p>
            </div>
            <div className="cta-actions">
              <Link to="/register"    className="btn btn-primary btn-lg">Đăng ký miễn phí</Link>
              <Link to="/post-ticket" className="btn btn-outline btn-lg">Đăng vé phim</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
