const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { success, error } = require('../utils/apiResponse');

// POST /api/chats  — REST fallback (socket is primary)
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, ticketId, message } = req.body;
    if (!message?.trim()) return res.status(400).json(error('Tin nhắn không được rỗng'));
    if (receiverId === req.user.id) return res.status(400).json(error('Không thể nhắn tin cho chính mình'));

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json(error('Người nhận không tồn tại'));

    if (ticketId) {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) return res.status(404).json(error('Vé không tồn tại'));
    }

    const chat = await Chat.create({
      senderId: req.user.id,
      receiverId,
      ticketId: ticketId || null,
      message: message.trim(),
    });
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

// GET /api/chats/conversations
const getConversations = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await Chat.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            users: {
              $cond: [
                { $lt: ['$senderId', '$receiverId'] },
                { u1: '$senderId', u2: '$receiverId' },
                { u1: '$receiverId', u2: '$senderId' },
              ],
            },
            ticketId: { $ifNull: ['$ticketId', null] },
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
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.senderId',
          foreignField: '_id',
          pipeline: [{ $project: { name: 1, avatar: 1 } }],
          as: '_sender',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.receiverId',
          foreignField: '_id',
          pipeline: [{ $project: { name: 1, avatar: 1 } }],
          as: '_receiver',
        },
      },
      {
        $lookup: {
          from: 'tickets',
          localField: 'lastMessage.ticketId',
          foreignField: '_id',
          pipeline: [{ $project: { title: 1 } }],
          as: '_ticket',
        },
      },
      {
        $addFields: {
          'lastMessage.senderId':  { $ifNull: [{ $arrayElemAt: ['$_sender', 0] }, '$lastMessage.senderId'] },
          'lastMessage.receiverId': { $ifNull: [{ $arrayElemAt: ['$_receiver', 0] }, '$lastMessage.receiverId'] },
          'lastMessage.ticketId':  { $arrayElemAt: ['$_ticket', 0] },
        },
      },
      { $project: { _sender: 0, _receiver: 0, _ticket: 0 } },
    ]);

    return res.json(success('Danh sách hội thoại', { conversations }));
  } catch (err) {
    next(err);
  }
};

// GET /api/chats/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Chat.countDocuments({ receiverId: req.user.id, isRead: false });
    return res.json(success('Số tin nhắn chưa đọc', { count }));
  } catch (err) {
    next(err);
  }
};

// GET /api/chats/:ticketId/:userId  — history with pagination
const getMessages = async (req, res, next) => {
  try {
    const { ticketId, userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id },
      ],
    };
    if (ticketId && ticketId !== 'null') {
      query.ticketId = new mongoose.Types.ObjectId(ticketId);
    } else {
      query.ticketId = null;
    }

    const [messages, total] = await Promise.all([
      Chat.find(query)
        .populate('senderId', 'name avatar')
        .populate('receiverId', 'name avatar')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Chat.countDocuments(query),
    ]);

    return res.json(success('Lịch sử tin nhắn', { messages, total, page, limit }));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/chats/read/:ticketId/:userId
const markAllRead = async (req, res, next) => {
  try {
    const { ticketId, userId } = req.params;
    const query = { senderId: userId, receiverId: req.user.id, isRead: false };
    if (ticketId && ticketId !== 'null') {
      query.ticketId = new mongoose.Types.ObjectId(ticketId);
    } else {
      query.ticketId = null;
    }
    await Chat.updateMany(query, { isRead: true, readAt: new Date() });
    return res.json(success('Đã đánh dấu đã đọc'));
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getConversations, getUnreadCount, getMessages, markAllRead };
