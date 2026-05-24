import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      textAlign: "center",
      padding: "40px 20px",
    }}>
      <p style={{ fontSize: 72, fontWeight: 800, color: "var(--color-primary)", lineHeight: 1 }}>404</p>
      <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 600, margin: "16px 0 8px", color: "var(--text-primary)" }}>
        Trang không tồn tại
      </h2>
      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: 24 }}>
        Trang bạn tìm không tồn tại hoặc đã bị xóa.
      </p>
      <Link to="/" className="btn btn-primary">Về trang chủ</Link>
    </div>
  );
}
