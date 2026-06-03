import { Link } from "react-router-dom";
import GoTixLogo from "./GoTixLogo";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <GoTixLogo height={36} />
            <p className="footer-tagline">
              Nền tảng mua và pass vé an toàn, minh bạch cho người Việt.
            </p>
          </div>

          <div className="footer-col">
            <h4>Khám phá</h4>
            <ul>
              <li><Link to="/tickets?category=movie">Vé xem phim</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Tài khoản</h4>
            <ul>
              <li><Link to="/register">Đăng ký</Link></li>
              <li><Link to="/login">Đăng nhập</Link></li>
              <li><Link to="/post-ticket">Đăng vé</Link></li>
              <li><Link to="/buyer">Lịch sử mua</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Hỗ trợ</h4>
            <ul>
              <li><a href="#">Hướng dẫn mua vé</a></li>
              <li><a href="#">Quy định đăng vé</a></li>
              <li><a href="#">Chính sách hoàn tiền</a></li>
              <li><a href="#">Liên hệ</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 GoTix. Bản quyền thuộc về GoTix Vietnam.</p>
          <div className="footer-legal">
            <a href="#">Điều khoản sử dụng</a>
            <a href="#">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
