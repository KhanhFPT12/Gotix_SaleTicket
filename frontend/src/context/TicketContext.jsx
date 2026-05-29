import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  apiGet, apiPost, apiPatch, apiDel, apiFetch,
  normalizeTicket, normalizeTransaction, normalizeReport, normalizeReview, normalizeUser,
  normalizeProSubscription, apiUpgradePro, apiCancelPro, apiGetMySubscription,
  normalizeWithdrawal, normalizeTopUp,
  apiGetMyWallet, apiGetWalletHistory, apiCreateWithdrawal, apiGetMyWithdrawals,
  apiCreateTopUp, apiGetMyTopUps,
  apiConfirmUserPaid, apiAdminConfirmTransaction, apiAdminRejectTransaction,
  apiCancelTransaction,
  apiConfirmUserPaidPro, apiAdminConfirmPro, apiAdminRejectPro,
} from "../api/client";
import { useAuth } from "./AuthContext";

const TicketContext = createContext(null);

export function TicketProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();

  const [tickets,     setTickets]     = useState([]);
  const [myPosted,    setMyPosted]    = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [mySales,     setMySales]     = useState([]);
  const [reviews,     setReviews]     = useState([]);
  const [reports,     setReports]     = useState([]);
  const [transactions,setTransactions]= useState([]);
  const [users,       setUsers]       = useState([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [wallet,         setWallet]         = useState(null);
  const [walletHistory,  setWalletHistory]  = useState([]);
  const [myWithdrawals,  setMyWithdrawals]  = useState([]);
  const [myTopUps,       setMyTopUps]       = useState([]);
  const [adminTopUps,    setAdminTopUps]    = useState([]);

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const loadTickets = useCallback(async () => {
    const res = await apiGet("/tickets?limit=100");
    if (res.success) setTickets((res.data.tickets || []).map(normalizeTicket));
  }, []);

  const loadMyPosted = useCallback(async () => {
    const res = await apiGet("/tickets/my-posted");
    if (res.success) setMyPosted((res.data.tickets || []).map(normalizeTicket));
  }, []);

  const loadMyPurchases = useCallback(async () => {
    const res = await apiGet("/transactions/my-purchases");
    if (res.success) setMyPurchases((res.data.transactions || []).map(normalizeTransaction));
  }, []);

  const loadMySales = useCallback(async () => {
    const res = await apiGet("/transactions/my-sales");
    if (res.success) setMySales((res.data.transactions || []).map(normalizeTransaction));
  }, []);

  const loadMyReviews = useCallback(async () => {
    const res = await apiGet("/reviews/my-reviews");
    if (res.success) setReviews((res.data.reviews || []).map(normalizeReview));
  }, []);

  const loadWallet = useCallback(async () => {
    const [wRes, hRes, wdRes, tuRes] = await Promise.all([
      apiGetMyWallet(),
      apiGetWalletHistory(),
      apiGetMyWithdrawals(),
      apiGetMyTopUps(),
    ]);
    if (wRes.success)  setWallet(wRes.data);
    if (hRes.success)  setWalletHistory(hRes.data.history || []);
    if (wdRes.success) setMyWithdrawals((wdRes.data.withdrawals || []).map(normalizeWithdrawal));
    if (tuRes.success) setMyTopUps((tuRes.data.topUps || []).map(normalizeTopUp));
  }, []);

  const loadMySubscription = useCallback(async () => {
    const res = await apiGetMySubscription();
    if (res.success) setMySubscription(res.data.subscription ? normalizeProSubscription(res.data.subscription) : null);
  }, []);

  const loadAdminData = useCallback(async () => {
    const [txRes, rpRes, usrRes, wdRes] = await Promise.all([
      apiGet("/admin/transactions?limit=200"),
      apiGet("/admin/reports?limit=200"),
      apiGet("/admin/users?limit=500"),
      apiGet("/admin/withdrawals?status=pending&limit=200"),
    ]);
    if (txRes.success)  setTransactions((txRes.data.transactions || []).map(normalizeTransaction));
    if (rpRes.success)  setReports((rpRes.data.reports || []).map(normalizeReport));
    if (usrRes.success) setUsers((usrRes.data.users || []).map(normalizeUser));
    if (wdRes.success)  setAdminWithdrawals((wdRes.data.withdrawals || []).map(normalizeWithdrawal));
    const tuAdminRes = await apiGet("/admin/topups?status=pending&limit=200");
    if (tuAdminRes.success) setAdminTopUps((tuAdminRes.data.topUps || []).map(normalizeTopUp));
  }, []);

  // ── Reload on auth change ─────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    loadTickets();

    if (currentUser) {
      loadMyPosted();
      loadMyPurchases();
      loadMySales();
      loadMyReviews();
      loadMySubscription();
      loadWallet();
      if (currentUser.role === "admin") loadAdminData();
    } else {
      setMyPosted([]);
      setMyPurchases([]);
      setMySales([]);
      setReviews([]);
      setReports([]);
      setTransactions([]);
      setUsers([]);
      setMySubscription(null);
      setWallet(null);
      setWalletHistory([]);
      setMyWithdrawals([]);
      setMyTopUps([]);
      setAdminTopUps([]);
    }
  }, [currentUser, authLoading]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  async function addTicket(formData) {
    const res = await apiFetch("/tickets", { method: "POST", body: formData });
    if (!res.success) throw new Error(res.message || "Đăng vé thất bại");
    const ticket = normalizeTicket(res.data.ticket);
    setMyPosted((prev) => [ticket, ...prev]);
    return ticket;
  }

  async function deleteTicket(ticketId) {
    const res = await apiDel(`/tickets/${ticketId}`);
    if (!res.success) throw new Error(res.message);
    setMyPosted((prev) => prev.filter((t) => t.id !== ticketId));
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  }

  // Admin: approve / reject ticket
  async function updateTicketStatus(ticketId, frontendStatus) {
    const verifyStatus =
      frontendStatus === "approved" ? "verified" :
      frontendStatus === "rejected" ? "rejected" : frontendStatus;
    const res = await apiPatch(`/admin/tickets/${ticketId}/verify`, { verifyStatus });
    if (!res.success) throw new Error(res.message);
    const updated = normalizeTicket(res.data.ticket);
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    return updated;
  }

  async function addTransaction(data) {
    const res = await apiPost("/transactions", {
      ticketId:      data.ticketId,
      quantity:      data.quantity,
      paymentMethod: data.paymentMethod,
    });
    if (!res.success) throw new Error(res.message || "Tạo giao dịch thất bại");
    const tx = normalizeTransaction(res.data.transaction);
    setMyPurchases((prev) => [tx, ...prev]);
    return tx;
  }

  async function addReview(data) {
    const res = await apiPost("/reviews", data);
    if (!res.success) throw new Error(res.message);
    const review = normalizeReview(res.data.review);
    setReviews((prev) => [review, ...prev]);
    return review;
  }

  // User clicks "Tôi đã chuyển khoản"
  async function confirmPayment(txId) {
    const res = await apiConfirmUserPaid(txId);
    if (!res.success) throw new Error(res.message || "Xác nhận thất bại");
    const updated = normalizeTransaction(res.data.transaction);
    setMyPurchases(prev => prev.map(t => t.id === txId ? updated : t));
    return updated;
  }

  // Admin confirms money received
  async function adminConfirmTx(txId) {
    const res = await apiAdminConfirmTransaction(txId);
    if (!res.success) throw new Error(res.message || "Xác nhận thất bại");
    const updated = normalizeTransaction(res.data.transaction);
    setTransactions(prev => prev.map(t => t.id === txId ? updated : t));
    return updated;
  }

  // Admin rejects transaction
  async function adminRejectTx(txId) {
    const res = await apiAdminRejectTransaction(txId);
    if (!res.success) throw new Error(res.message || "Từ chối thất bại");
    const updated = normalizeTransaction(res.data.transaction);
    setTransactions(prev => prev.map(t => t.id === txId ? updated : t));
    return updated;
  }

  async function cancelTransactionById(txId) {
    const res = await apiCancelTransaction(txId);
    if (!res.success) throw new Error(res.message);
    const updated = normalizeTransaction(res.data.transaction);
    setMyPurchases(prev => prev.map(t => t.id === txId ? updated : t));
    await loadTickets();
    return updated;
  }

  async function createTopUp(amount) {
    const res = await apiCreateTopUp(amount);
    if (!res.success) throw new Error(res.message || "Tạo lệnh nạp tiền thất bại");
    const tu = normalizeTopUp(res.data.topUp);
    setMyTopUps(prev => [tu, ...prev]);
    return { topUp: tu, transferCode: res.data.transferCode, url: res.data.url };
  }

  async function createWithdrawal(data) {
    const res = await apiCreateWithdrawal(data);
    if (!res.success) throw new Error(res.message || "Tạo yêu cầu rút tiền thất bại");
    const wd = normalizeWithdrawal(res.data.withdrawal);
    setMyWithdrawals(prev => [wd, ...prev]);
    await loadWallet();
    return wd;
  }

  async function upgradePro(plan) {
    const res = await apiUpgradePro(plan);
    if (!res.success) throw new Error(res.message || "Nâng cấp thất bại");
    // Subscription is pending_payment — don't update mySubscription yet
    return res.data; // { subscription, paymentNote }
  }

  async function confirmProPayment(subId) {
    const res = await apiConfirmUserPaidPro(subId);
    if (!res.success) throw new Error(res.message || "Xác nhận thất bại");
    return res.data;
  }

  async function adminConfirmProSub(subId) {
    const res = await apiAdminConfirmPro(subId);
    if (!res.success) throw new Error(res.message || "Xác nhận thất bại");
    return res.data;
  }

  async function adminRejectProSub(subId) {
    const res = await apiAdminRejectPro(subId);
    if (!res.success) throw new Error(res.message || "Từ chối thất bại");
    return res.data;
  }

  async function cancelPro() {
    const res = await apiCancelPro();
    if (!res.success) throw new Error(res.message || "Hủy gói thất bại");
    setMySubscription(null);
  }

  async function addReport(data) {
    const res = await apiPost("/reports", data);
    if (!res.success) throw new Error(res.message);
    return res.data.report;
  }

  async function resolveReport(reportId, status) {
    const res = await apiPatch(`/admin/reports/${reportId}/resolve`, { status });
    if (!res.success) throw new Error(res.message);
    const updated = normalizeReport(res.data.report);
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
  }

  function incrementViews() {
    // Views are incremented server-side in getTicketById
  }

  return (
    <TicketContext.Provider
      value={{
        // Public marketplace
        tickets,
        // User-specific
        myPosted,
        myPurchases,
        mySales,
        reviews,
        // Admin
        reports,
        transactions,
        users,
        adminWithdrawals,
        // Mutations
        addTicket,
        deleteTicket,
        updateTicketStatus,
        addTransaction,
        addReview,
        addReport,
        resolveReport,
        incrementViews,
        // Pro
        mySubscription,
        upgradePro,
        cancelPro,
        confirmProPayment,
        adminConfirmProSub,
        adminRejectProSub,
        refreshSubscription: loadMySubscription,
        // Wallet
        wallet,
        walletHistory,
        myWithdrawals,
        myTopUps,
        adminTopUps,
        createTopUp,
        confirmPayment,
        adminConfirmTx,
        adminRejectTx,
        cancelTransactionById,
        createWithdrawal,
        refreshWallet: loadWallet,
        // Refresh helpers
        refreshTickets: loadTickets,
        refreshMyPosted: loadMyPosted,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTickets must be used within TicketProvider");
  return ctx;
}
