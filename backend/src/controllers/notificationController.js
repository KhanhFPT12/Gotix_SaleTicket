const Notification = require('../models/Notification');
const { success, error } = require('../utils/apiResponse');

const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unread] = await Promise.all([
      Notification.find({ receiverId: req.user.id })
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Notification.countDocuments({ receiverId: req.user.id }),
      Notification.countDocuments({ receiverId: req.user.id, isRead: false }),
    ]);
    return res.json(success('Thông báo', { notifications, unread, pagination: { total, page: Number(page), limit: Number(limit) } }));
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, receiverId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!n) return res.status(404).json(error('Không tìm thấy thông báo'));
    return res.json(success('Đã đánh dấu đọc', { notification: n }));
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ receiverId: req.user.id, isRead: false }, { isRead: true });
    return res.json(success('Đã đánh dấu tất cả đã đọc'));
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, receiverId: req.user.id });
    return res.json(success('Đã xóa thông báo'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyNotifications, markRead, markAllRead, deleteNotification };
