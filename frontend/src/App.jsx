import { useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import AIChatBot from "./components/common/AIChatBot";
import ScrollToTop from "./components/common/ScrollToTop";

function PublicGuard({ children }) {
  const { pathname } = useLocation();
  // Ẩn trên trang admin và nhân viên
  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) return null;
  return children;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <PublicGuard>
        <AIChatBot />
      </PublicGuard>
    </>
  );
}

