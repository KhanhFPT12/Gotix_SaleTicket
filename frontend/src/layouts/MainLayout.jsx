import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import "./MainLayout.css";

const NO_FOOTER_ROUTES = ["/chat"];

export default function MainLayout() {
  const location = useLocation();
  const hideFooter = NO_FOOTER_ROUTES.includes(location.pathname);

  return (
    <div className={`main-layout${hideFooter ? " main-layout--fullscreen" : ""}`}>
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
