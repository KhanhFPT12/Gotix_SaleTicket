import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TICKET_CATEGORIES } from "../data/mockData";
import { useTickets } from "../context/TicketContext";
import TicketCard from "../components/tickets/TicketCard";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { tickets } = useTickets();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchCity) params.set("city", searchCity);
    navigate(`/tickets?${params.toString()}`);
  }

  const approvedTickets = tickets.filter((t) => t.status === "approved").slice(0, 8);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-tag">Nền tảng pass vé #1 Việt Nam</div>
            <h1 className="hero-title">
              Mua và pass vé<br />an toàn, minh bạch
            </h1>
            <p className="hero-subtitle">
              Hàng nghìn vé concert, phim, thể thao, workshop được xác minh và đăng bán mỗi ngày.
            </p>

            <form className="search-bar" onSubmit={handleSearch}>
              <div className="search-input-wrap">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm vé, sự kiện, địa điểm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="search-select"
              >
                <option value="">Tất cả khu vực</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Cần Thơ">Cần Thơ</option>
              </select>
              <button type="submit" className="btn btn-primary btn-lg search-btn">
                Tìm vé
              </button>
            </form>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>1,200+</strong>
                <span>Vé đang bán</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>8,500+</strong>
                <span>Giao dịch thành công</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>4.9/5</strong>
                <span>Độ tin cậy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Danh mục vé</h2>
          </div>
          <div className="categories-grid">
            {TICKET_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/tickets?category=${cat.id}`}
                className="category-item"
              >
                <div className="category-icon">{cat.icon}</div>
                <span className="category-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest tickets */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Vé mới đăng</h2>
            <Link to="/tickets" className="section-link">Xem tất cả</Link>
          </div>
          <div className="tickets-grid">
            {approvedTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Quy trình 3 bước đơn giản</h2>
            <p className="section-desc">Mua và bán vé dễ dàng, an toàn với GoTix</p>
          </div>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Đăng vé</h3>
              <p>Người bán đăng vé cần pass, mô tả chi tiết và tải lên ảnh vé hoặc mã QR để xác minh.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>Xác minh</h3>
              <p>Đội ngũ GoTix kiểm tra và xác minh tính hợp lệ của vé trước khi hiển thị công khai.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Giao dịch</h3>
              <p>Người mua đặt cọc, nhận vé sau khi xác nhận. Tiền được giải phóng cho người bán khi hoàn tất.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-box">
            <div>
              <h3>Có vé muốn pass lại?</h3>
              <p>Đăng vé miễn phí, tiếp cận hàng nghìn người mua ngay hôm nay.</p>
            </div>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Đăng ký miễn phí</Link>
              <Link to="/post-ticket" className="btn btn-outline btn-lg">Đăng vé ngay</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
