import AppRoutes from "./routes/AppRoutes";
import AIChatBot from "./components/common/AIChatBot";
import ScrollToTop from "./components/common/ScrollToTop";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      <AIChatBot />
    </>
  );
}
