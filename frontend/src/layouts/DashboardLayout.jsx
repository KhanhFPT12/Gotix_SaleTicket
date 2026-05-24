import { Outlet } from "react-router-dom";
import Header from "../components/common/Header";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Header />
      <main className="dashboard-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
