import { useState } from "react";
import { Link } from "react-router-dom";
import { useTickets } from "../context/TicketContext";
import TicketCard from "../components/tickets/TicketCard";
import HeroBanner from "../components/common/HeroBanner";
import "./Home.css";

const CINEMA_QUICKLINKS = [
  { label: "Tất cả",       cinema: "" },
  { label: "CGV",          cinema: "CGV" },
  { label: "Lotte Cinema", cinema: "Lotte" },
  { label: "BHD Star",     cinema: "BHD" },
  { label: "Galaxy",       cinema: "Galaxy" },
  { label: "Metiz",        cinema: "Metiz" },
  { label: "Starlight",    cinema: "Starlight" },
];

const TESTIMONIALS = [
  {
    text: "Mình hay bị kẹt lịch đột xuất nên dư vé suốt. Từ hồi có GoTix đăng vé lên bán lại cực nhanh. Điểm cộng lớn nhất là vé được Admin duyệt xác thực thủ công nên người mua tin tưởng chốt giao dịch liền!",
    author: "Hoàng Hải",
    avatar: "H",
    bg: "#fecdd3", color: "#e11d48"
  },
  {
    text: "Tuyệt vời! Lúc trước mua pass trên Facebook toàn sợ bị scam vì bắt chuyển khoản trước. Dùng GoTix tiền được giữ trung gian (Escrow) nên mình cực kỳ yên tâm, không lo bị mất tiền oan.",
    author: "Lê Ngọc",
    avatar: "L",
    bg: "#dbeafe", color: "#2563eb"
  },
  {
    text: "Săn được cặp vé Imax cuối tuần rạp chiếu phim với giá rẻ hơn 30% do có bạn pass lại gấp. Giao diện siêu mượt, bộ lọc rạp thông minh giúp tìm vé nhanh chóng. 5 sao!",
    author: "Trần Minh",
    avatar: "T",
    bg: "#fef3c7", color: "#d97706"
  },
  {
    text: "Giao diện website cực kỳ thân thiện và dễ sử dụng. Từ lúc biết đến GoTix, mình không còn phải lo đăng bài pass vé lắt nhắt trên các group Facebook nữa.",
    author: "Bùi Thịnh",
    avatar: "B",
    bg: "#e0e7ff", color: "#4f46e5"
  },
  {
    text: "Dự án có ý tưởng rất thiết thực. Tuy nhiên để đi vào thực tế, nhóm cần tập trung hoàn thiện khâu trung gian thanh toán và thắt chặt cơ chế kiểm duyệt vé để đảm bảo an toàn tuyệt đối.",
    author: "Cô Hoài (Trưởng bộ môn CF)",
    avatar: "C",
    bg: "#f3e8ff", color: "#9333ea"
  },
  {
    text: "Tính năng tìm kiếm theo rạp và khu vực hoạt động rất tốt. Mình có thể tìm mua vé đúng rạp gần nhà trong vài giây. Rất tiện lợi và tiết kiệm thời gian.",
    author: "Nguyễn Tiến Dầu",
    avatar: "N",
    bg: "#ccfbf1", color: "#0f766e"
  },
  {
    text: "Góp ý: Nhóm nên bổ sung thêm tính năng đánh giá (Rating) cho từng người bán sau khi giao dịch thành công để hệ thống minh bạch và uy tín hơn nữa nhé.",
    author: "Khách hàng Ẩn danh",
    avatar: "K",
    bg: "#e2e8f0", color: "#475569"
  },
  {
    text: "Hôm trước mình mua nhầm suất chiếu, may mà quy trình khiếu nại của hệ thống rõ ràng nên mình được giải quyết nhanh gọn. Cần cải thiện thêm thông báo qua SMS cho tiện.",
    author: "Thanh Huyền",
    avatar: "T",
    bg: "#dcfce7", color: "#15803d"
  },
  {
    text: "Trải nghiệm mua vé rất mượt, thanh toán nhanh. Tuy nhiên phần xem trước (Preview) bài đăng trên mobile bị che mất một góc, mong team sớm fix lỗi giao diện này.",
    author: "Tuấn Vũ",
    avatar: "V",
    bg: "#ffedd5", color: "#c2410c"
  },
  {
    text: "Giao diện thanh Navbar ban đầu lúc bấm qua lại các rạp hơi giật, nhưng bản cập nhật gần đây đã mượt mà và chuyển trang chính xác hơn hẳn.",
    author: "Người dùng Khuyết danh",
    avatar: "N",
    bg: "#f3f4f6", color: "#374151"
  },
  {
    text: "Font chữ ở một số mục mô tả phim trước đây hơi mờ và nhỏ. Mình vừa thấy team đổi font mới to rõ hơn, đọc trên điện thoại rất thoải mái.",
    author: "Phương Trang",
    avatar: "P",
    bg: "#fbcfe8", color: "#be185d"
  },
  {
    text: "Phần khung chọn (Select box) ở trang tìm kiếm trước đây nhìn hơi thô. Giao diện mới hiện tại đã được bo góc và nhìn chuyên nghiệp hơn rất nhiều.",
    author: "Đức Anh",
    avatar: "Đ",
    bg: "#bfdbfe", color: "#1d4ed8"
  },
  {
    text: "Hình ảnh banner lúc trước bị chớp nháy khá đau mắt, nay đã được chuyển sang hiệu ứng mờ dần (crossfade) rất êm ái. Rất tinh tế!",
    author: "Thu Thủy",
    avatar: "T",
    bg: "#fcd34d", color: "#b45309"
  },
  {
    text: "Giai đoạn đầu mình bị ngợp vì không biết lọc vé theo khu vực thế nào. May mà team đã bổ sung bộ quick-link ở trang chủ, bấm phát là lọc rạp ngay.",
    author: "Hải Đăng",
    avatar: "H",
    bg: "#c7d2fe", color: "#4338ca"
  },
  {
    text: "Mình từng góp ý là nên mặc định tìm kiếm ở Đà Nẵng trước vì sinh viên FPT chủ yếu ở đây. Tính năng này đã được cập nhật, team phản hồi rất nhanh.",
    author: "Quốc Khánh",
    avatar: "Q",
    bg: "#bbf7d0", color: "#15803d"
  },
  {
    text: "Banner trang chủ lúc trước khá đơn điệu. Hero Banner hiện tại đẹp và truyền tải được đầy đủ các giá trị của GoTix. Giao diện thực sự lột xác.",
    author: "Hoàng Tùng",
    avatar: "H",
    bg: "#fecaca", color: "#b91c1c"
  },
  {
    text: "Từng lo lắng khi không biết cách khiếu nại. Hiện tại mình thấy team đã thêm popup hướng dẫn quy định chỉ giải quyết tranh chấp trong vòng 30 phút, rất rõ ràng.",
    author: "Ngọc Diệp",
    avatar: "N",
    bg: "#e9d5ff", color: "#7e22ce"
  },
  {
    text: "Lúc đầu chưa hiểu làm sao để biết người bán có lừa đảo không. Giờ biết Admin duyệt thủ công từng mã vé thì mình mới thực sự an tâm giao dịch.",
    author: "Bảo Trâm",
    avatar: "B",
    bg: "#fef08a", color: "#a16207"
  },
  {
    text: "Mong muốn có tính năng xem trước vé trước khi đăng bài đã được đáp ứng. Chức năng Preview mới thêm vào giúp mình kiểm tra lại và đỡ bị đăng nhầm giá.",
    author: "Thành Đạt",
    avatar: "T",
    bg: "#fed7aa", color: "#c2410c"
  },
  {
    text: "Trên điện thoại, ảnh hiển thị lúc đầu chưa được tối ưu, load chậm và vỡ nét. Hiện tại hình ảnh vé và avatar đã hiển thị mượt và rõ ràng hơn hẳn.",
    author: "Mai Linh",
    avatar: "M",
    bg: "#a7f3d0", color: "#047857"
  }
];

export default function Home() {
  const { tickets } = useTickets();
  const [visibleTestimonials, setVisibleTestimonials] = useState(6);
  const latestTickets = tickets.filter(t => t.status === "approved").slice(0, 8);

  return (
    <div className="home">

      {/* ── Hero Banner Carousel — thay toàn bộ hero section ── */}
      <HeroBanner />

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

      {/* ── Testimonials ── */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Khách hàng nói gì về GoTix?</h2>
            <p className="section-desc">Hàng ngàn giao dịch thành công mỗi tháng</p>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.slice(0, visibleTestimonials).map((t, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="testimonial-stars">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: t.bg, color: t.color }}>{t.avatar}</div>
                  <div className="testimonial-info">
                    <strong>{t.author}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {visibleTestimonials < TESTIMONIALS.length && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <button 
                className="btn btn-outline"
                onClick={() => setVisibleTestimonials(TESTIMONIALS.length)}
              >
                Xem thêm góp ý
              </button>
            </div>
          )}
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
