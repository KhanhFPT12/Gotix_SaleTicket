import { useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import AIChatBot from "./components/common/AIChatBot";
import ScrollToTop from "./components/common/ScrollToTop";

function AIChatBotGuard() {
  const { pathname } = useLocation();
  // Hide on admin and support staff pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) return null;
  return <AIChatBot />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <AIChatBotGuard />
    </>
  );
}
