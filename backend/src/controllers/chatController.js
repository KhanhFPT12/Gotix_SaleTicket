const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const { success, error } = require('../utils/apiResponse');

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, ticketId, message } = req.body;
    if (receiverId === req.user.id) {
      return res.status(400).json(error('Không thể nhắn tin cho chính mình'));
    }
    const chat = await Chat.create({ senderId: req.user.id, receiverId, ticketId, message });
    await chat.populate([
      { path: 'senderId', select: 'name avatar' },
      { path: 'receiverId', select: 'name avatar' },
      { path: 'ticketId', select: 'title category' },
    ]);
    return res.status(201).json(success('Gửi tin nhắn thành công', { chat }));
  } catch (err) {
    next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const conversations = await Chat.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$senderId', '$receiverId'] },
              { u1: '$senderId', u2: '$receiverId' },
              { u1: '$receiverId', u2: '$senderId' },
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    await Chat.populate(conversations, [
      { path: 'lastMessage.senderId', select: 'name avatar' },
      { path: 'lastMessage.receiverId', select: 'name avatar' },
      { path: 'lastMessage.ticketId', select: 'title' },
    ]);

    return res.json(success('Danh sách hội thoại', { conversations }));
  } catch (err) {
    next(err);
  }
};

const getMessagesWith = async (req, res, next) => {
  try {
    const messages = await Chat.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id },
      ],
    })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .sort({ createdAt: 1 });
    return res.json(success('Lịch sử tin nhắn', { messages }));
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json(error('Không tìm thấy tin nhắn'));
    if (chat.receiverId.toString() !== req.user.id) {
      return res.status(403).json(error('Không có quyền'));
    }
    chat.isRead = true;
    await chat.save();
    return res.json(success('Đã đánh dấu đã đọc', { chat }));
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getConversations, getMessagesWith, markAsRead };
