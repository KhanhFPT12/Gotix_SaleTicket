import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";

import Home from "../pages/Home";
import TicketList from "../pages/TicketList";
import TicketDetail from "../pages/TicketDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import PostTicket from "../pages/PostTicket";
import UserDashboard from "../pages/BuyerDashboard";
import Profile from "../pages/Profile";
import Chat from "../pages/Chat";
import Payment from "../pages/Payment";
import PaymentResult from "../pages/PaymentResult";
import ProPaymentResult from "../pages/ProPaymentResult";
import TopUpPaymentResult from "../pages/TopUpPaymentResult";
import TransactionHistory from "../pages/TransactionHistory";
import UpgradePro from "../pages/UpgradePro";
import PublicProfile from "../pages/PublicProfile";
import Wallet from "../pages/Wallet";
import AdminWithdrawals from "../pages/admin/AdminWithdrawals";
import AdminTopUps from "../pages/admin/AdminTopUps";
import NotFound from "../pages/NotFound";

import AdminOverview     from "../pages/admin/AdminOverview";
import AdminTickets      from "../pages/admin/AdminTickets";
import AdminUsers        from "../pages/admin/AdminUsers";
import AdminTransactions from "../pages/admin/AdminTransactions";
import AdminReports      from "../pages/admin/AdminReports";
import AdminAuditLogs    from "../pages/admin/AdminAuditLogs";
import SavedTickets      from "../pages/SavedTickets";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public + user routes ── */}
      <Route element={<MainLayout />}>
        <Route path="/"           element={<Home />} />
        <Route path="/tickets"    element={<TicketList />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/register"   element={<Register />} />

        <Route path="/post-ticket"     element={<ProtectedRoute><PostTicket /></ProtectedRoute>} />
        <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/chat"            element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/payment/:ticketId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/payment-result"  element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
        <Route path="/pro-payment-result" element={<ProtectedRoute><ProPaymentResult /></ProtectedRoute>} />
        <Route path="/topup-payment-result" element={<ProtectedRoute><TopUpPaymentResult /></ProtectedRoute>} />
        <Route path="/transactions"    element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
        <Route path="/upgrade-pro"     element={<ProtectedRoute><UpgradePro /></ProtectedRoute>} />
        <Route path="/wallet"          element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/saved-tickets"   element={<ProtectedRoute><SavedTickets /></ProtectedRoute>} />
        <Route path="/users/:id"       element={<PublicProfile />} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ── User dashboard (unified for all non-admin users) ── */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/buyer"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        {/* /seller redirects to the unified dashboard */}
        <Route path="/seller" element={<Navigate to="/buyer" replace />} />
      </Route>

      {/* ── Admin-only routes ── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin"              element={<AdminOverview />} />
        <Route path="/admin/tickets"      element={<AdminTickets />} />
        <Route path="/admin/users"        element={<AdminUsers />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/reports"      element={<AdminReports />} />
        <Route path="/admin/withdrawals"  element={<AdminWithdrawals />} />
        <Route path="/admin/topups"       element={<AdminTopUps />} />
        <Route path="/admin/audit-logs"   element={<AdminAuditLogs />} />
      </Route>
    </Routes>
  );
}
