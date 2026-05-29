const SupportTicket  = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');
const { success, error } = require('../utils/apiResponse');
const { getIo } = require('../config/socket');

// ── USER endpoints ────────────────────────────────────────────────────────────

const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });
    return res.json(success('Danh sách yêu cầu hỗ trợ', { tickets }));
  } catch (err) { next(err); }
};

const createTicket = async (req, res, next) => {
  try {
    const { subject, topic, message } = req.body;
    if (!subject?.trim()) return res.status(400).json(error('Vui lòng nhập tiêu đề'));
    if (!topic)           return res.status(400).json(error('Vui lòng chọn chủ đề'));

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      subject: subject.trim(),
      topic,
    });

    if (message?.trim()) {
      const msg = await SupportMessage.create({
        ticketId: ticket._id,
        senderId: req.user.id,
        senderRole: 'user',
        content: message.trim(),
      });
      ticket.lastMessage   = msg.content;
      ticket.lastMessageAt = msg.createdAt;
      ticket.unreadByAdmin = 1;
      await ticket.save();
    }

    return res.status(201).json(success('Tạo yêu cầu hỗ trợ thành công', { ticket }));
  } catch (err) { next(err); }
};

const getTicketMessages = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    if (ticket.userId.toString() !== req.user.id) return res.status(403).json(error('Không có quyền'));

    const messages = await SupportMessage.find({ ticketId: req.params.id })
      .populate('senderId', 'name avatar role')
      .sort({ createdAt: 1 });

    await SupportTicket.findByIdAndUpdate(req.params.id, { unreadByUser: 0 });

    return res.json(success('Tin nhắn hỗ trợ', { messages, ticket }));
  } catch (err) { next(err); }
};

const sendUserMessage = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    if (ticket.userId.toString() !== req.user.id) return res.status(403).json(error('Không có quyền'));
    if (ticket.status === 'closed') return res.status(400).json(error('Yêu cầu đã đóng, vui lòng tạo yêu cầu mới'));

    const content = req.body.content?.trim() || '';
    const image   = req.file ? `/uploads/${req.file.filename}` : '';
    if (!content && !image) return res.status(400).json(error('Vui lòng nhập nội dung'));

    const msg = await SupportMessage.create({
      ticketId: ticket._id, senderId: req.user.id, senderRole: 'user', content, image,
    });
    await msg.populate('senderId', 'name avatar role');

    if (ticket.status === 'resolved') ticket.status = 'pending';
    ticket.lastMessage   = content || '[Hình ảnh]';
    ticket.lastMessageAt = msg.createdAt;
    ticket.unreadByAdmin += 1;
    await ticket.save();

    getIo()?.to(`support:${ticket._id}`).emit('support_message', {
      ...msg.toObject(), ticket: { _id: ticket._id, status: ticket.status },
    });

    return res.status(201).json(success('Gửi tin nhắn thành công', { message: msg }));
  } catch (err) { next(err); }
};

// ── ADMIN endpoints ───────────────────────────────────────────────────────────

const adminGetAllTickets = async (req, res, next) => {
  try {
    const { status, topic, search, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (topic)  filter.topic  = topic;
    if (search) filter.subject = new RegExp(search, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId', 'name email avatar')
        .sort({ updatedAt: -1 })
        .skip(skip).limit(Number(limit)),
      SupportTicket.countDocuments(filter),
    ]);

    return res.json(success('Danh sách yêu cầu hỗ trợ', {
      tickets, pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) { next(err); }
};

const adminGetMessages = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'name email avatar');
    if (!ticket) return res.status(404).json(error('Không tìm thấy yêu cầu'));

    const messages = await SupportMessage.find({ ticketId: req.params.id })
      .populate('senderId', 'name avatar role')
      .sort({ createdAt: 1 });

    await SupportTicket.findByIdAndUpdate(req.params.id, { unreadByAdmin: 0 });

    return res.json(success('Tin nhắn hỗ trợ', { messages, ticket }));
  } catch (err) { next(err); }
};

const adminSendMessage = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    if (ticket.status === 'closed') return res.status(400).json(error('Yêu cầu đã đóng'));

    const content = req.body.content?.trim() || '';
    const image   = req.file ? `/uploads/${req.file.filename}` : '';
    if (!content && !image) return res.status(400).json(error('Vui lòng nhập nội dung'));

    if (ticket.status === 'pending') ticket.status = 'in_progress';

    const msg = await SupportMessage.create({
      ticketId: ticket._id, senderId: req.user.id, senderRole: 'admin', content, image,
    });
    await msg.populate('senderId', 'name avatar role');

    ticket.lastMessage   = content || '[Hình ảnh]';
    ticket.lastMessageAt = msg.createdAt;
    ticket.unreadByUser += 1;
    await ticket.save();

    getIo()?.to(`support:${ticket._id}`).emit('support_message', {
      ...msg.toObject(), ticket: { _id: ticket._id, status: ticket.status },
    });

    return res.status(201).json(success('Gửi tin nhắn thành công', { message: msg }));
  } catch (err) { next(err); }
};

const adminUpdateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending','in_progress','resolved','closed'].includes(status)) {
      return res.status(400).json(error('Trạng thái không hợp lệ'));
    }
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate('userId', 'name email avatar');
    if (!ticket) return res.status(404).json(error('Không tìm thấy yêu cầu'));

    getIo()?.to(`support:${ticket._id}`).emit('support_status_change', {
      ticketId: ticket._id, status: ticket.status,
    });

    return res.json(success('Cập nhật trạng thái thành công', { ticket }));
  } catch (err) { next(err); }
};

module.exports = {
  getMyTickets, createTicket, getTicketMessages, sendUserMessage,
  adminGetAllTickets, adminGetMessages, adminSendMessage, adminUpdateStatus,
};
