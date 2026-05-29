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
    const { subject, topic, priority, message } = req.body;
    if (!subject?.trim()) return res.status(400).json(error('Vui lòng nhập tiêu đề'));
    if (!topic)           return res.status(400).json(error('Vui lòng chọn chủ đề'));

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      subject: subject.trim(),
      topic,
      priority: priority || 'medium',
      status: 'new',
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
      ticket.unreadByStaff = 1;
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
    if (ticket.status === 'closed') return res.status(400).json(error('Yêu cầu đã đóng'));

    const content = req.body.content?.trim() || '';
    const image   = req.file ? `/uploads/${req.file.filename}` : '';
    if (!content && !image) return res.status(400).json(error('Vui lòng nhập nội dung'));

    const msg = await SupportMessage.create({
      ticketId: ticket._id, senderId: req.user.id, senderRole: 'user', content, image,
    });
    await msg.populate('senderId', 'name avatar role');

    if (ticket.status === 'resolved' || ticket.status === 'waiting_customer') ticket.status = 'pending';
    if (ticket.status === 'new') ticket.status = 'pending';
    ticket.lastMessage   = content || '[Hình ảnh]';
    ticket.lastMessageAt = msg.createdAt;
    ticket.unreadByStaff += 1;
    await ticket.save();

    getIo()?.to(`support:${ticket._id}`).emit('support_message', {
      ...msg.toObject(), ticket: { _id: ticket._id, status: ticket.status },
    });

    return res.status(201).json(success('Gửi tin nhắn thành công', { message: msg }));
  } catch (err) { next(err); }
};

// ── STAFF / ADMIN endpoints ───────────────────────────────────────────────────

const staffGetAllTickets = async (req, res, next) => {
  try {
    const { status, topic, priority, assignedTo, search, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (status)     filter.status   = status;
    if (topic)      filter.topic    = topic;
    if (priority)   filter.priority = priority;
    if (assignedTo === 'me') filter.assignedTo = req.user.id;
    if (search)     filter.subject  = new RegExp(search, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId',     'name email avatar')
        .populate('assignedTo', 'name avatar')
        .sort({ updatedAt: -1 })
        .skip(skip).limit(Number(limit)),
      SupportTicket.countDocuments(filter),
    ]);

    // Stats
    const [newCount, pendingCount, inProgressCount, waitingCount, resolvedCount] = await Promise.all([
      SupportTicket.countDocuments({ status: 'new' }),
      SupportTicket.countDocuments({ status: 'pending' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'waiting_customer' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
    ]);

    return res.json(success('Danh sách yêu cầu hỗ trợ', {
      tickets,
      stats: { newCount, pendingCount, inProgressCount, waitingCount, resolvedCount },
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) { next(err); }
};

const staffGetMessages = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId',     'name email avatar')
      .populate('assignedTo', 'name avatar');
    if (!ticket) return res.status(404).json(error('Không tìm thấy yêu cầu'));

    const messages = await SupportMessage.find({ ticketId: req.params.id })
      .populate('senderId', 'name avatar role')
      .sort({ createdAt: 1 });

    await SupportTicket.findByIdAndUpdate(req.params.id, { unreadByStaff: 0 });

    return res.json(success('Tin nhắn hỗ trợ', { messages, ticket }));
  } catch (err) { next(err); }
};

const staffSendMessage = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    if (ticket.status === 'closed') return res.status(400).json(error('Yêu cầu đã đóng'));

    const content = req.body.content?.trim() || '';
    const image   = req.file ? `/uploads/${req.file.filename}` : '';
    if (!content && !image) return res.status(400).json(error('Vui lòng nhập nội dung'));

    // Auto assign to current staff member if unassigned
    if (!ticket.assignedTo) ticket.assignedTo = req.user.id;
    // Auto set status
    if (ticket.status === 'new' || ticket.status === 'pending') ticket.status = 'in_progress';

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

const staffUpdateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['new','pending','in_progress','waiting_customer','resolved','closed'];
    if (!valid.includes(status)) return res.status(400).json(error('Trạng thái không hợp lệ'));

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

const staffUpdatePriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    if (!['low','medium','high','urgent'].includes(priority)) {
      return res.status(400).json(error('Độ ưu tiên không hợp lệ'));
    }
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id, { priority }, { new: true }
    );
    if (!ticket) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    return res.json(success('Cập nhật độ ưu tiên thành công', { ticket }));
  } catch (err) { next(err); }
};

const staffAssign = async (req, res, next) => {
  try {
    const assignedTo = req.body.assignedTo || req.user.id;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id, { assignedTo }, { new: true }
    ).populate('assignedTo', 'name avatar');
    if (!ticket) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    return res.json(success('Phân công thành công', { ticket }));
  } catch (err) { next(err); }
};

module.exports = {
  getMyTickets, createTicket, getTicketMessages, sendUserMessage,
  staffGetAllTickets, staffGetMessages, staffSendMessage,
  staffUpdateStatus, staffUpdatePriority, staffAssign,
  // backward compat
  adminGetAllTickets: staffGetAllTickets,
  adminGetMessages:   staffGetMessages,
  adminSendMessage:   staffSendMessage,
  adminUpdateStatus:  staffUpdateStatus,
};
