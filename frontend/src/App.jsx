import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import AIChatBot from "./components/common/AIChatBot";
import ScrollToTop from "./components/common/ScrollToTop";
import { apiPost } from "./api/client";

function PublicGuard({ children }) {
  const { pathname } = useLocation();
  // Ẩn trên trang admin và nhân viên
  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) return null;
  return children;
}

function getClientId() {
  let cid = localStorage.getItem("gotix_client_id");
  if (!cid) {
    cid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("gotix_client_id", cid);
  }
  return cid;
}

export default function App() {
  useEffect(() => {
    // Check if this is a new visit (session based)
    let isNewVisit = !sessionStorage.getItem("gotix_visited");
    if (isNewVisit) {
      sessionStorage.setItem("gotix_visited", "true");
    }

    const ping = () => {
      apiPost("/tracking/ping", { isNewVisit, clientId: getClientId() }).catch(() => {});
      isNewVisit = false; // Set to false after first ping so it doesn't increment on every interval
    };

    // Initial ping
    ping();

    // Ping every 10 seconds
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, []);

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
