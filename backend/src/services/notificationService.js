const Notification = require('../models/Notification');

const LINK_MAP = {
  ticket_submitted:      (id) => `/buyer`,
  ticket_approved:       (id) => `/tickets/${id}`,
  ticket_rejected:       (id) => `/buyer`,
  ticket_sold:           (id) => `/buyer`,
  ticket_expired:        (id) => `/buyer`,
  transaction_paid:      (id) => `/transactions`,
  transaction_completed: (id) => `/transactions`,
  transaction_cancelled: (id) => `/transactions`,
  wallet_credited:       (id) => `/wallet`,
  withdrawal_approved:   (id) => `/wallet`,
  withdrawal_rejected:   (id) => `/wallet`,
  chat_message:          (id) => `/chat`,
  report_submitted:      (id) => `/admin/reports`,
  report_resolved:       (id) => `/transactions`,
};

async function notify({ receiverId, title, message, type, relatedId = '' }) {
  try {
    const link = (LINK_MAP[type] || (() => '/'))(relatedId);
    return await Notification.create({ receiverId, title, message, type, relatedId, link });
  } catch (err) {
    console.error('[notify] error:', err.message);
  }
}

async function notifyMany(receiverIds, payload) {
  return Promise.all(receiverIds.map((id) => notify({ ...payload, receiverId: id })));
}

module.exports = { notify, notifyMany };
