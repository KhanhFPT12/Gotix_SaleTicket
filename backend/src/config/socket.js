const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Ticket = require('../models/Ticket');
const { notify } = require('../services/notificationService');

const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const RECALL_LIMIT_MS   = 5 * 60 * 1000; // 5 phút

const onlineUsers = new Map(); // userId -> socketId
let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatar isActive');
      if (!user || !user.isActive) return next(new Error('Unauthorized'));
      socket.userId = decoded.id.toString();
      socket.userName = user.name;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit('user_online', { userId });

    socket.on('send_message', async (data, callback) => {
      try {
        const { receiverId, ticketId, message } = data || {};

        if (!receiverId || !message?.trim()) {
          return callback?.({ error: 'Thiếu thông tin bắt buộc' });
        }
        if (receiverId === userId) {
          return callback?.({ error: 'Không thể nhắn tin cho chính mình' });
        }

        const receiver = await User.findById(receiverId).select('name');
        if (!receiver) return callback?.({ error: 'Người nhận không tồn tại' });

        if (ticketId) {
          const ticket = await Ticket.findById(ticketId);
          if (!ticket) return callback?.({ error: 'Vé không tồn tại' });
        }

        const chat = await Chat.create({
          senderId: userId,
          receiverId,
          ticketId: ticketId || null,
          message: message.trim(),
        });

        await chat.populate([
          { path: 'senderId', select: 'name avatar' },
          { path: 'receiverId', select: 'name avatar' },
          { path: 'ticketId', select: 'title category' },
        ]);

        const msgObj = chat.toObject();

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', msgObj);
        }

        callback?.({ success: true, message: msgObj });

        // Notify receiver
        notify({
          receiverId,
          title: 'Tin nhắn mới',
          message: `${socket.userName} đã gửi tin nhắn cho bạn`,
          type: 'chat_message',
          relatedId: chat._id.toString(),
        }).catch(() => {});
      } catch (err) {
        callback?.({ error: 'Lỗi server khi gửi tin nhắn' });
      }
    });

    socket.on('typing', ({ receiverId }) => {
      const sid = onlineUsers.get(receiverId);
      if (sid) io.to(sid).emit('typing', { senderId: userId });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      const sid = onlineUsers.get(receiverId);
      if (sid) io.to(sid).emit('stop_typing', { senderId: userId });
    });

    socket.on('mark_read', async ({ senderId, ticketId }) => {
      try {
        const query = { senderId, receiverId: userId, isRead: false };
        if (ticketId) query.ticketId = ticketId;
        else query.ticketId = null;

        const result = await Chat.updateMany(query, { isRead: true, readAt: new Date() });
        if (result.modifiedCount > 0) {
          const senderSid = onlineUsers.get(senderId);
          if (senderSid) {
            io.to(senderSid).emit('messages_read', { readBy: userId, senderId, ticketId });
          }
        }
      } catch { /* ignore */ }
    });

    // ── Thu hồi tin nhắn ──────────────────────────────────────
    socket.on('recall_message', async ({ messageId } = {}, callback) => {
      try {
        if (!messageId) return callback?.({ error: 'Thiếu messageId' });
        const chat = await Chat.findById(messageId);
        if (!chat) return callback?.({ error: 'Tin nhắn không tồn tại' });
        if (chat.senderId.toString() !== userId) return callback?.({ error: 'Không có quyền thu hồi tin nhắn này' });
        if (chat.isRecalled) return callback?.({ success: true });
        if (Date.now() - new Date(chat.createdAt).getTime() > RECALL_LIMIT_MS) {
          return callback?.({ error: 'Đã quá 5 phút, không thể thu hồi tin nhắn' });
        }
        chat.isRecalled = true;
        await chat.save();
        const payload = { messageId };
        const receiverSid = onlineUsers.get(chat.receiverId.toString());
        if (receiverSid) io.to(receiverSid).emit('message_recalled', payload);
        socket.emit('message_recalled', payload);
        callback?.({ success: true });
      } catch {
        callback?.({ error: 'Lỗi server' });
      }
    });

    // ── Xóa tin nhắn phía mình ────────────────────────────────
    socket.on('delete_message_for_me', async ({ messageId } = {}, callback) => {
      try {
        if (!messageId) return callback?.({ error: 'Thiếu messageId' });
        const chat = await Chat.findById(messageId);
        if (!chat) return callback?.({ error: 'Tin nhắn không tồn tại' });
        if (chat.senderId.toString() !== userId && chat.receiverId.toString() !== userId) {
          return callback?.({ error: 'Không có quyền xóa tin nhắn này' });
        }
        const alreadyDeleted = chat.deletedFor.some(id => id.toString() === userId);
        if (!alreadyDeleted) {
          chat.deletedFor.push(new mongoose.Types.ObjectId(userId));
          await chat.save();
        }
        callback?.({ success: true, messageId });
      } catch {
        callback?.({ error: 'Lỗi server' });
      }
    });

    // ── Thả reaction ──────────────────────────────────────────
    socket.on('react_message', async ({ messageId, emoji } = {}, callback) => {
      try {
        if (!messageId) return callback?.({ error: 'Thiếu messageId' });
        if (emoji !== null && emoji !== undefined && !ALLOWED_REACTIONS.includes(emoji)) {
          return callback?.({ error: 'Emoji không hợp lệ' });
        }
        const chat = await Chat.findById(messageId);
        if (!chat) return callback?.({ error: 'Tin nhắn không tồn tại' });
        if (chat.senderId.toString() !== userId && chat.receiverId.toString() !== userId) {
          return callback?.({ error: 'Không có quyền' });
        }
        if (chat.isRecalled) return callback?.({ error: 'Không thể react tin nhắn đã thu hồi' });

        const existingIdx = chat.reactions.findIndex(r => r.userId.toString() === userId);
        if (!emoji) {
          if (existingIdx !== -1) chat.reactions.splice(existingIdx, 1);
        } else if (existingIdx !== -1) {
          if (chat.reactions[existingIdx].emoji === emoji) {
            chat.reactions.splice(existingIdx, 1); // toggle off
          } else {
            chat.reactions[existingIdx].emoji = emoji;
          }
        } else {
          chat.reactions.push({ userId: new mongoose.Types.ObjectId(userId), emoji });
        }
        await chat.save();

        const reactions = chat.reactions.map(r => ({ userId: r.userId.toString(), emoji: r.emoji }));
        const payload = { messageId, reactions };
        const otherUserId = chat.senderId.toString() === userId ? chat.receiverId.toString() : chat.senderId.toString();
        const otherSid = onlineUsers.get(otherUserId);
        if (otherSid) io.to(otherSid).emit('message_reacted', payload);
        callback?.({ success: true, messageId, reactions });
      } catch {
        callback?.({ error: 'Lỗi server' });
      }
    });

    // ── Support chat rooms ────────────────────────────────────
    socket.on('join_support_room', ({ ticketId }) => {
      if (ticketId) socket.join(`support:${ticketId}`);
    });
    socket.on('leave_support_room', ({ ticketId }) => {
      if (ticketId) socket.leave(`support:${ticketId}`);
    });
    socket.on('support_typing', ({ ticketId }) => {
      if (ticketId) socket.to(`support:${ticketId}`).emit('support_typing', {
        senderId: userId, senderName: socket.userName,
      });
    });
    socket.on('support_stop_typing', ({ ticketId }) => {
      if (ticketId) socket.to(`support:${ticketId}`).emit('support_stop_typing', { senderId: userId });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user_offline', { userId });
    });
  });

  return io;
}

function getIo() { return io; }
function isOnline(userId) { return onlineUsers.has(userId.toString()); }

module.exports = { initSocket, getIo, isOnline, onlineUsers };
