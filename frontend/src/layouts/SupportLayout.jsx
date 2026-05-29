import { Outlet, Link } from "react-router-dom";
import GoTixLogo from "../components/common/GoTixLogo";
import "./SupportLayout.css";

export default function SupportLayout() {
  return (
    <div className="sp-standalone">
      <header className="sp-standalone-header">
        <Link to="/" target="_blank" rel="noopener noreferrer">
          <GoTixLogo height={32} />
        </Link>
        <span className="sp-standalone-title">Trung tâm hỗ trợ</span>
        <button
          className="sp-standalone-close"
          onClick={() => window.close()}
          title="Đóng cửa sổ"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </header>
      <main className="sp-standalone-main">
        <Outlet />
      </main>
    </div>
  );
}
