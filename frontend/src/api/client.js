const BASE        = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';
const MEDIA_BASE  = import.meta.env.VITE_API_URL  || 'http://localhost:5000';

export function resolveMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${MEDIA_BASE}${path}`;
}

export function getToken() {
  return localStorage.getItem('gotix_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('gotix_token', token);
  else localStorage.removeItem('gotix_token');
}

export async function apiFetch(path, opts = {}) {
  const token = getToken();
  const isFormData = opts.body instanceof FormData;

  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opts.headers,
  };

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    credentials: 'include',
  });

  const json = await res.json();
  return json;
}

// Helpers
export const apiGet  = (path)         => apiFetch(path);
export const apiPost = (path, body)   => apiFetch(path, { method: 'POST',   body: body instanceof FormData ? body : JSON.stringify(body) });
export const apiPut  = (path, body)   => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) });
export const apiPatch= (path, body)   => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) });
export const apiDel  = (path)         => apiFetch(path, { method: 'DELETE' });

// ── Normalizers ──────────────────────────────────────────────────────────────

export function normalizeTicket(t) {
  if (!t) return null;
  const ownerObj = t.ownerId && typeof t.ownerId === 'object' ? t.ownerId : null;
  const details  = t.details || {};
  return {
    ...t,
    id: t._id?.toString() || t.id,
    sellerId:      ownerObj?._id?.toString() ?? t.ownerId?.toString?.() ?? '',
    sellerName:    ownerObj?.name ?? '',
    sellerRating:  ownerObj?.rating ?? 0,
    sellerVerified: ownerObj?.verified ?? false,
    sellerIsPro:   ownerObj?.isPro ?? false,
    sellerBadge:   ownerObj?.proBadge ?? 'GoTix Pro',
    passPrice:     t.resalePrice ?? t.passPrice ?? 0,
    date:          t.eventDate ?? t.date ?? '',
    time:          t.eventTime ?? t.time ?? '',
    images: [
      t.ticketImage ? resolveMediaUrl(t.ticketImage) : null,
      t.qrImage     ? resolveMediaUrl(t.qrImage)     : null,
    ].filter(Boolean),
    status:
      t.status === 'sold' ? 'sold' :
      t.verifyStatus === 'verified' ? 'approved' :
      t.verifyStatus === 'rejected' ? 'rejected' :
      'pending',
    verifyStatus:   t.verifyStatus,
    originalStatus: t.status,
    // Movie-specific fields
    movieTitle:    details.movieTitle  || t.title    || '',
    cinema:        details.cinemaName  || t.location || '',
    cinemaAddress: details.cinemaAddress || '',
    room:          details.room        || '',
    seats:         details.seats       || [],
    city:          t.city              || '',
  };
}

export function normalizeTransaction(tx) {
  if (!tx) return null;
  const buyerObj  = tx.buyerId  && typeof tx.buyerId  === 'object' ? tx.buyerId  : null;
  const sellerObj = tx.sellerId && typeof tx.sellerId === 'object' ? tx.sellerId : null;
  const ticketObj = tx.ticketId && typeof tx.ticketId === 'object' ? tx.ticketId : null;
  return {
    ...tx,
    id:               tx._id?.toString() || tx.id,
    buyerId:          buyerObj?._id?.toString()  ?? tx.buyerId?.toString?.()  ?? '',
    sellerId:         sellerObj?._id?.toString() ?? tx.sellerId?.toString?.() ?? '',
    buyer:            buyerObj,
    seller:           sellerObj,
    ticketId:         ticketObj?._id?.toString() ?? tx.ticketId?.toString?.() ?? '',
    ticketTitle:      ticketObj?.title ?? tx.ticketTitle ?? '',
    ticketData:       ticketObj,
    amount:           tx.totalPrice ?? tx.amount ?? 0,
    platformFee:      tx.platformFee ?? 0,
    sellerAmount:     tx.sellerAmount ?? 0,
    sellerCredited:   tx.sellerCredited ?? false,
    paymentNote:      tx.paymentNote ?? '',
    paymentExpiredAt: tx.paymentExpiredAt ?? null,
    status:           tx.status ?? 'pending_payment',
    paymentMethod:    tx.paymentMethod,
  };
}

export function normalizeReport(r) {
  if (!r) return null;
  const reporterObj = r.reporterId && typeof r.reporterId === 'object' ? r.reporterId : null;
  const ticketObj   = r.ticketId   && typeof r.ticketId   === 'object' ? r.ticketId   : null;
  return {
    ...r,
    id:          r._id?.toString() || r.id,
    reporterId:  reporterObj?._id?.toString() ?? r.reporterId?.toString?.() ?? '',
    reporter:    reporterObj,
    ticketId:    ticketObj?._id?.toString() ?? r.ticketId?.toString?.() ?? '',
    ticketTitle: ticketObj?.title ?? '',
    ticket:      ticketObj,
  };
}

export function normalizeReview(r) {
  if (!r) return null;
  const buyerObj  = r.buyerId  && typeof r.buyerId  === 'object' ? r.buyerId  : null;
  const sellerObj = r.sellerId && typeof r.sellerId === 'object' ? r.sellerId : null;
  return {
    ...r,
    id:           r._id?.toString() || r.id,
    reviewerId:   buyerObj?._id?.toString() ?? r.buyerId?.toString?.() ?? '',
    reviewerName: buyerObj?.name ?? '',
    sellerId:     sellerObj?._id?.toString() ?? r.sellerId?.toString?.() ?? '',
  };
}

export function normalizeUser(u) {
  if (!u) return null;
  return { ...u, id: u._id?.toString() || u.id };
}

export function normalizeWithdrawal(w) {
  if (!w) return null;
  const userObj = w.userId && typeof w.userId === 'object' ? w.userId : null;
  return {
    ...w,
    id:       w._id?.toString() || w.id,
    userId:   userObj?._id?.toString() ?? w.userId?.toString?.() ?? '',
    user:     userObj,
  };
}

// ── Wallet / Withdrawal API ───────────────────────────────────────────────────
export const apiGetMyWallet       = ()        => apiGet('/wallet/me');
export const apiGetWalletHistory  = ()        => apiGet('/wallet/history');
export const apiCreateWithdrawal  = (data)    => apiPost('/withdrawals', data);
export const apiGetMyWithdrawals  = ()        => apiGet('/withdrawals/me');
export const apiGetAdminBankInfo  = ()        => apiGet('/topups/bank-info');
export const apiCreateTopUp       = (amount)  => apiPost('/topups', { amount });
export const apiGetMyTopUps       = ()        => apiGet('/topups/me');

export function normalizeTopUp(t) {
  if (!t) return null;
  const userObj = t.userId && typeof t.userId === 'object' ? t.userId : null;
  return { ...t, id: t._id?.toString() || t.id, user: userObj };
}

// ── Transaction actions ───────────────────────────────────────────────────────
export const apiConfirmUserPaid         = (id) => apiPatch(`/transactions/${id}/user-confirmed`, {});
export const apiAdminConfirmTransaction = (id) => apiPatch(`/transactions/${id}/admin-confirm`, {});
export const apiAdminRejectTransaction  = (id) => apiPatch(`/transactions/${id}/admin-reject`, {});
export const apiCancelTransaction       = (id) => apiPatch(`/transactions/${id}/cancel`, {});

export function normalizeProSubscription(s) {
  if (!s) return null;
  return { ...s, id: s._id?.toString() || s.id };
}

// ── Pro API calls ─────────────────────────────────────────────────────────────
export const apiGetProPlans           = ()    => apiGet('/pro/plans');
export const apiGetMySubscription     = ()    => apiGet('/pro/my-subscription');
export const apiUpgradePro            = (plan)=> apiPost('/pro/upgrade', { plan });
export const apiCancelPro             = ()    => apiPost('/pro/cancel', {});
export const apiConfirmUserPaidPro    = (id)  => apiPatch(`/pro/${id}/user-confirmed`, {});
export const apiAdminConfirmPro       = (id)  => apiPatch(`/pro/${id}/admin-confirm`, {});
export const apiAdminRejectPro        = (id)  => apiPatch(`/pro/${id}/admin-reject`, {});
export const apiGetPublicProfile      = (id)  => apiGet(`/users/public/${id}`);

// ── Support / Customer care ───────────────────────────────────────────────────
export const apiGetMyTickets        = ()            => apiGet('/support/my-tickets');
export const apiCreateSupportTicket = (data)        => apiPost('/support/tickets', data);
export const apiGetSupportMessages  = (id)          => apiGet(`/support/tickets/${id}/messages`);
export const apiSendSupportMessage  = (id, data)    => apiFetch(`/support/tickets/${id}/messages`, { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) });
export const apiStaffGetTickets     = (params = {}) => apiGet('/support/staff/tickets?' + new URLSearchParams(params));
export const apiStaffGetMessages    = (id)          => apiGet(`/support/staff/tickets/${id}/messages`);
export const apiStaffSendMessage    = (id, data)    => apiFetch(`/support/staff/tickets/${id}/messages`, { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) });
export const apiStaffUpdateStatus   = (id, status)  => apiPatch(`/support/staff/tickets/${id}/status`, { status });
export const apiStaffUpdatePriority = (id, priority)=> apiPatch(`/support/staff/tickets/${id}/priority`, { priority });
export const apiStaffAssign         = (id, staffId) => apiPatch(`/support/staff/tickets/${id}/assign`, { assignedTo: staffId });
// backward compat
export const apiAdminGetTickets     = apiStaffGetTickets;
export const apiAdminGetMessages    = apiStaffGetMessages;
export const apiAdminSendMessage    = apiStaffSendMessage;
export const apiAdminUpdateStatus   = apiStaffUpdateStatus;

// ── Auth OTP verification ─────────────────────────────────────────────────────
export const apiVerifyOtp          = (email, otp) => apiPost('/auth/verify-otp', { email, otp });
export const apiResendOtp          = (email)      => apiPost('/auth/resend-otp',  { email });
// Backward compat
export const apiVerifyEmail        = (token) => apiGet(`/auth/verify-email/${token}`);
export const apiResendVerification = ()      => apiPost('/auth/resend-verification', {});

// ── Admin user management ─────────────────────────────────────────────────────
export const apiAdminSetUserActive = (id, isActive) => apiPatch(`/admin/users/${id}/status`, { isActive });

// ── Notifications ─────────────────────────────────────────────────────────────
export const apiGetNotifications  = (page = 1) => apiGet(`/notifications?page=${page}&limit=20`);
export const apiMarkRead          = (id)       => apiPatch(`/notifications/${id}/read`, {});
export const apiMarkAllRead       = ()         => apiPatch('/notifications/read-all', {});
export const apiDeleteNotification= (id)       => apiDel(`/notifications/${id}`);

export function normalizeNotification(n) {
  if (!n) return null;
  return { ...n, id: n._id?.toString() || n.id };
}

// ── Favorites ─────────────────────────────────────────────────────────────────
export const apiToggleFavorite   = (ticketId) => apiPost(`/favorites/${ticketId}`, {});
export const apiUnfavorite       = (ticketId) => apiDel(`/favorites/${ticketId}`);
export const apiGetMyFavorites   = ()         => apiGet('/favorites/me');
export const apiCheckFavorite    = (ticketId) => apiGet(`/favorites/check/${ticketId}`);
