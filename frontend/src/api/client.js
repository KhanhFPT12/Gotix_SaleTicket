const BASE        = 'http://localhost:5000/api';
const MEDIA_BASE  = 'http://localhost:5000';

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
  return {
    ...t,
    id: t._id?.toString() || t.id,
    // Map ownerId → sellerId so existing frontend code keeps working
    sellerId: ownerObj?._id?.toString() ?? t.ownerId?.toString?.() ?? '',
    sellerName: ownerObj?.name ?? '',
    sellerRating: ownerObj?.rating ?? 0,
    sellerVerified: ownerObj?.verified ?? false,
    sellerIsPro: ownerObj?.isPro ?? false,
    sellerBadge: ownerObj?.proBadge ?? 'GoTix Pro',
    // Map backend price/date field names to frontend names
    passPrice: t.resalePrice ?? t.passPrice ?? 0,
    date: t.eventDate ?? t.date ?? '',
    time: t.eventTime ?? t.time ?? '',
    // Map ticketImage/qrImage → images[] with full URL
    images: [
      t.ticketImage ? resolveMediaUrl(t.ticketImage) : null,
      t.qrImage     ? resolveMediaUrl(t.qrImage)     : null,
    ].filter(Boolean),
    // Map verifyStatus → frontend status string
    status:
      t.status === 'sold' ? 'sold' :
      t.verifyStatus === 'verified' ? 'approved' :
      t.verifyStatus === 'rejected' ? 'rejected' :
      'pending',
    verifyStatus: t.verifyStatus,
    originalStatus: t.status,
  };
}

export function normalizeTransaction(tx) {
  if (!tx) return null;
  const buyerObj  = tx.buyerId  && typeof tx.buyerId  === 'object' ? tx.buyerId  : null;
  const sellerObj = tx.sellerId && typeof tx.sellerId === 'object' ? tx.sellerId : null;
  const ticketObj = tx.ticketId && typeof tx.ticketId === 'object' ? tx.ticketId : null;
  return {
    ...tx,
    id:          tx._id?.toString() || tx.id,
    buyerId:     buyerObj?._id?.toString()  ?? tx.buyerId?.toString?.()  ?? '',
    sellerId:    sellerObj?._id?.toString() ?? tx.sellerId?.toString?.() ?? '',
    buyer:       buyerObj,
    seller:      sellerObj,
    ticketId:    ticketObj?._id?.toString() ?? tx.ticketId?.toString?.() ?? '',
    ticketTitle: ticketObj?.title ?? tx.ticketTitle ?? '',
    ticketData:  ticketObj,
    amount:        tx.totalPrice ?? tx.amount ?? 0,
    platformFee:   tx.platformFee ?? 0,
    sellerAmount:  tx.sellerAmount ?? 0,
    sellerCredited: tx.sellerCredited ?? false,
    paymentStatus: tx.paymentStatus ?? 'pending',
    status:
      tx.transactionStatus === 'completed' ? 'completed' :
      tx.transactionStatus === 'cancelled' ? 'cancelled' :
      'pending',
    paymentMethod: tx.paymentMethod,
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
export const apiPayTransaction      = (id)    => apiPatch(`/transactions/${id}/payment`, {});
export const apiCompleteTransaction = (id)    => apiPatch(`/transactions/${id}/complete`, {});
export const apiCancelTransaction   = (id)    => apiPatch(`/transactions/${id}/cancel`, {});

export function normalizeProSubscription(s) {
  if (!s) return null;
  return { ...s, id: s._id?.toString() || s.id };
}

// ── Pro API calls ─────────────────────────────────────────────────────────────
export const apiGetProPlans        = ()       => apiGet('/pro/plans');
export const apiGetMySubscription  = ()       => apiGet('/pro/my-subscription');
export const apiUpgradePro         = (plan)   => apiPost('/pro/upgrade', { plan });
export const apiCancelPro          = ()       => apiPost('/pro/cancel', {});
export const apiGetPublicProfile   = (id)     => apiGet(`/users/public/${id}`);

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
