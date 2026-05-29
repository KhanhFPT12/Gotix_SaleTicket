import AppRoutes from "./routes/AppRoutes";
import AIChatBot from "./components/common/AIChatBot";
import ScrollToTop from "./components/common/ScrollToTop";
import PageTransition from "./components/common/PageTransition";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <PageTransition />
      <AppRoutes />
      <AIChatBot />
    </>
  );
}
