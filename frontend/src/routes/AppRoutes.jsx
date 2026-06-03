import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import GuestOnlyRoute from "./GuestOnlyRoute";

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
import SavedTickets from "../pages/SavedTickets";
import Unauthorized from "../pages/Unauthorized";
import VerifyEmail from "../pages/VerifyEmail";
import NotFound from "../pages/NotFound";

import AdminOverview     from "../pages/admin/AdminOverview";
import AdminTickets      from "../pages/admin/AdminTickets";
import AdminUsers        from "../pages/admin/AdminUsers";
import AdminTransactions from "../pages/admin/AdminTransactions";
import AdminReports      from "../pages/admin/AdminReports";
import AdminAuditLogs    from "../pages/admin/AdminAuditLogs";
import AdminWithdrawals        from "../pages/admin/AdminWithdrawals";
import AdminTopUps             from "../pages/admin/AdminTopUps";
import AdminProSubscriptions   from "../pages/admin/AdminProSubscriptions";
import Support                 from "../pages/Support";
import SupportLayout           from "../layouts/SupportLayout";
import StaffLayout             from "../layouts/StaffLayout";
import StaffSupport            from "../pages/staff/StaffSupport";

const USER_ONLY    = ["user"];
const SUPPORT_ONLY = ["support", "admin"];
const ADMIN_ONLY = ["admin"];

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public + user routes ── */}
      <Route element={<MainLayout />}>
        {/* Public — no auth required */}
        <Route path="/"            element={<Home />} />
        <Route path="/tickets"     element={<TicketList />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/users/:id"   element={<PublicProfile />} />
        <Route path="/unauthorized"  element={<Unauthorized />} />
        <Route path="/verify-email"  element={<VerifyEmail />} />

        {/* Guest-only — redirect if already logged in */}
        <Route path="/login"    element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
        <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />

        {/* User-only marketplace pages */}
        <Route path="/post-ticket"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><PostTicket /></ProtectedRoute>} />
        <Route path="/profile"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><Profile /></ProtectedRoute>} />
        <Route path="/chat"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><Chat /></ProtectedRoute>} />
        <Route path="/payment/:ticketId"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><Payment /></ProtectedRoute>} />
        <Route path="/payment-result"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><PaymentResult /></ProtectedRoute>} />
        <Route path="/pro-payment-result"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><ProPaymentResult /></ProtectedRoute>} />
        <Route path="/topup-payment-result"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><TopUpPaymentResult /></ProtectedRoute>} />
        <Route path="/transactions"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><TransactionHistory /></ProtectedRoute>} />
        <Route path="/upgrade-pro"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><UpgradePro /></ProtectedRoute>} />
        <Route path="/wallet"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><Wallet /></ProtectedRoute>} />
        <Route path="/saved-tickets"
          element={<ProtectedRoute allowedRoles={USER_ONLY}><SavedTickets /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ── Support — standalone layout, opens in new tab ── */}
      <Route element={
        <ProtectedRoute allowedRoles={USER_ONLY}>
          <SupportLayout />
        </ProtectedRoute>
      }>
        <Route path="/support" element={<Support />} />
      </Route>

      {/* ── Staff Support Center ── */}
      <Route element={
        <ProtectedRoute allowedRoles={SUPPORT_ONLY}>
          <StaffLayout />
        </ProtectedRoute>
      }>
        <Route path="/staff/support" element={<StaffSupport />} />
      </Route>

      {/* ── User dashboard — user only ── */}
      <Route element={
        <ProtectedRoute allowedRoles={USER_ONLY}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/buyer"  element={<UserDashboard />} />
        <Route path="/seller" element={<Navigate to="/buyer" replace />} />
      </Route>

      {/* ── Admin-only routes ── */}
      <Route element={
        <ProtectedRoute allowedRoles={ADMIN_ONLY}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="/admin"              element={<AdminOverview />} />
        <Route path="/admin/tickets"      element={<AdminTickets />} />
        <Route path="/admin/users"        element={<AdminUsers />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/reports"      element={<AdminReports />} />
        <Route path="/admin/withdrawals"  element={<AdminWithdrawals />} />
        <Route path="/admin/topups"             element={<AdminTopUps />} />
        <Route path="/admin/pro-subscriptions"  element={<AdminProSubscriptions />} />
        <Route path="/admin/audit-logs"         element={<AdminAuditLogs />} />
      </Route>
    </Routes>
  );
}
