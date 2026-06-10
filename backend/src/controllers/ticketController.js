const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { notify } = require('../services/notificationService');
const { success, error } = require('../utils/apiResponse');

// ── Secure Helper Functions ───────────────────────────────────────────────

const formatTicketResponse = async (ticket, user, isList = false) => {
  if (!ticket) return null;
  const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
  
  let hasAccess = false;
  if (user) {
    if (user.role === 'admin') {
      hasAccess = true;
    } else if (ticketObj.ownerId && (ticketObj.ownerId._id?.toString() === user.id || ticketObj.ownerId.toString() === user.id)) {
      hasAccess = true;
    } else if (!isList) {
      const tx = await Transaction.findOne({
        ticketId: ticketObj._id,
        buyerId: user.id,
        status: { $in: ['completed', 'paid'] }
      });
      if (tx) {
        hasAccess = true;
      }
    }
  }

  // ticketImage is public and can be viewed by anyone
  ticketObj.ticketImage = ticketObj.ticketImage ? `/api/tickets/${ticketObj._id}/media/ticketImage` : '';

  // qrImage is restricted and can only be viewed by admin, owner, or buyer
  if (hasAccess) {
    ticketObj.qrImage = ticketObj.qrImage ? `/api/tickets/${ticketObj._id}/media/qrImage` : '';
  } else {
    ticketObj.qrImage = '';
  }

  return ticketObj;
};

const formatTicketsResponse = async (tickets, user, isList = false) => {
  return Promise.all(tickets.map(t => formatTicketResponse(t, user, isList)));
};

// ── Controller Methods ─────────────────────────────────────────────────────

const getTickets = async (req, res, next) => {
  try {
    const {
      search, category, location, city, cinema, verifyStatus, status: statusFilter,
      minPrice, maxPrice, sort,
      dateFrom, dateTo,
      page = 1, limit = 12,
    } = req.query;

    const filter = {};

    if (!req.user || req.user.role !== 'admin') {
      filter.verifyStatus = 'verified';
      filter.status = 'available';
    } else {
      if (verifyStatus) filter.verifyStatus = verifyStatus;
      if (statusFilter) filter.status = statusFilter;
    }

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (location) filter.location = new RegExp(location, 'i');
    if (city)   filter.city = new RegExp(city, 'i');
    if (cinema) filter['details.cinemaName'] = new RegExp(cinema, 'i');

    if (minPrice || maxPrice) {
      filter.resalePrice = {};
      if (minPrice) filter.resalePrice.$gte = Number(minPrice);
      if (maxPrice) filter.resalePrice.$lte = Number(maxPrice);
    }

    if (dateFrom || dateTo) {
      filter.eventDate = {};
      if (dateFrom) filter.eventDate.$gte = dateFrom;
      if (dateTo)   filter.eventDate.$lte = dateTo;
    }

    const sortMap = {
      priceAsc:      { resalePrice: 1 },
      priceDesc:     { resalePrice: -1 },
      oldest:        { createdAt: 1 },
      eventDateAsc:  { eventDate: 1 },
      eventDate:     { eventDate: 1 },
      newest:        { createdAt: -1 },
    };
    const secondarySort = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      Ticket.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'users',
            localField: 'ownerId',
            foreignField: '_id',
            as: '_ownerArr',
          },
        },
        {
          $addFields: {
            _ownerIsPro: { $ifNull: [{ $arrayElemAt: ['$_ownerArr.isPro', 0] }, false] },
            ownerId: {
              $let: {
                vars: { o: { $arrayElemAt: ['$_ownerArr', 0] } },
                in: {
                  _id: '$$o._id',
                  name: '$$o.name',
                  avatar: '$$o.avatar',
                  rating: '$$o.rating',
                  reviewCount: '$$o.reviewCount',
                  verified: '$$o.verified',
                  isPro: '$$o.isPro',
                  proBadge: '$$o.proBadge',
                },
              },
            },
          },
        },
        { $sort: { _ownerIsPro: -1, ...secondarySort } },
        { $skip: skip },
        { $limit: Number(limit) },
        { $project: { _ownerArr: 0, _ownerIsPro: 0 } },
      ]),
      Ticket.countDocuments(filter),
    ]);

    const formattedTickets = await formatTicketsResponse(tickets, req.user, true);

    return res.json(
      success('Danh sách vé', {
        tickets: formattedTickets,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(
      'ownerId',
      'name avatar rating reviewCount verified isPro proBadge'
    );
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));
    await Ticket.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    const formattedTicket = await formatTicketResponse(ticket, req.user, false);
    return res.json(success('Chi tiết vé', { ticket: formattedTicket }));
  } catch (err) {
    next(err);
  }
};

const getMyPosted = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    const formattedTickets = await formatTicketsResponse(tickets, req.user, false);
    return res.json(success('Vé đã đăng', { tickets: formattedTickets }));
  } catch (err) {
    next(err);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(error('Validation thất bại', errors.array()));
    }
    const data = { ...req.body, ownerId: req.user.id };
    if (typeof data.details === 'string') {
      try { data.details = JSON.parse(data.details); } catch { delete data.details; }
    }
    if (req.files?.ticketImage?.[0]) {
      data.ticketImage = `/private_uploads/${req.files.ticketImage[0].filename}`;
    }
    if (req.files?.qrImage?.[0]) {
      data.qrImage = `/private_uploads/${req.files.qrImage[0].filename}`;
    }
    const ticket = await Ticket.create(data);

    await notify({
      receiverId: req.user.id,
      title: 'Đăng vé thành công',
      message: `Vé "${ticket.title}" đã được gửi, đang chờ admin xét duyệt.`,
      type: 'ticket_submitted',
      relatedId: ticket._id.toString(),
    });

    const admins = await User.find({ role: 'admin' }, '_id');
    for (const admin of admins) {
      await notify({
        receiverId: admin._id,
        title: 'Vé mới chờ duyệt',
        message: `Có vé mới "${ticket.title}" cần xét duyệt.`,
        type: 'ticket_submitted',
        relatedId: ticket._id.toString(),
      });
    }

    const formattedTicket = await formatTicketResponse(ticket, req.user, false);
    return res.status(201).json(success('Đăng vé thành công, đang chờ admin duyệt', { ticket: formattedTicket }));
  } catch (err) {
    next(err);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));

    const isOwner = ticket.ownerId.toString() === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json(error('Không có quyền chỉnh sửa vé này'));
    }
    if (ticket.status === 'sold') {
      return res.status(400).json(error('Không thể chỉnh sửa vé đã bán'));
    }

    const data = { ...req.body };
    if (typeof data.details === 'string') {
      try { data.details = JSON.parse(data.details); } catch { delete data.details; }
    }
    if (req.files?.ticketImage?.[0]) data.ticketImage = `/private_uploads/${req.files.ticketImage[0].filename}`;
    if (req.files?.qrImage?.[0]) data.qrImage = `/private_uploads/${req.files.qrImage[0].filename}`;

    const updated = await Ticket.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    const formattedTicket = await formatTicketResponse(updated, req.user, false);
    return res.json(success('Cập nhật vé thành công', { ticket: formattedTicket }));
  } catch (err) {
    next(err);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));

    const isOwner = ticket.ownerId.toString() === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json(error('Không có quyền xóa vé này'));
    }
    if (ticket.status === 'sold') {
      return res.status(400).json(error('Không thể xóa vé đã bán'));
    }
    await ticket.deleteOne();
    return res.json(success('Xóa vé thành công'));
  } catch (err) {
    next(err);
  }
};

const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));

    const isOwner = ticket.ownerId.toString() === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json(error('Không có quyền'));
    }
    ticket.status = status;
    await ticket.save();
    
    const formattedTicket = await formatTicketResponse(ticket, req.user, false);
    return res.json(success('Cập nhật trạng thái thành công', { ticket: formattedTicket }));
  } catch (err) {
    next(err);
  }
};

const verifyTicket = async (req, res, next) => {
  try {
    const { verifyStatus } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { verifyStatus }, { new: true });
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));
    
    const formattedTicket = await formatTicketResponse(ticket, req.user, false);
    return res.json(success('Xác minh vé thành công', { ticket: formattedTicket }));
  } catch (err) {
    next(err);
  }
};

const getTicketMedia = async (req, res, next) => {
  try {
    const { id, type } = req.params;
    if (type !== 'ticketImage' && type !== 'qrImage') {
      return res.status(400).json(error('Loại file không hợp lệ'));
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));

    if (type !== 'ticketImage') {
      let tokenUser = req.user;
      if (!tokenUser) {
        let token;
        if (req.headers.authorization?.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.token) {
          token = req.cookies.token;
        } else if (req.query.token) {
          token = req.query.token;
        }
        if (token) {
          try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user && user.isActive) {
              tokenUser = { id: user._id.toString(), role: user.role, email: user.email };
            }
          } catch (err) {
            // ignore
          }
        }
      }

      if (!tokenUser) {
        return res.status(401).json(error('Chưa đăng nhập'));
      }

      let hasAccess = false;
      if (tokenUser.role === 'admin') {
        hasAccess = true;
      } else if (ticket.ownerId.toString() === tokenUser.id) {
        hasAccess = true;
      } else {
        const tx = await Transaction.findOne({
          ticketId: ticket._id,
          buyerId: tokenUser.id,
          status: { $in: ['completed', 'paid'] },
        });
        if (tx) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return res.status(403).json(error('Không có quyền truy cập file này'));
      }
    }

    const relativePath = ticket[type];
    if (!relativePath) {
      return res.status(404).json(error('File không tồn tại'));
    }

    let absolutePath;
    if (relativePath.startsWith('/private_uploads/')) {
      const filename = relativePath.replace('/private_uploads/', '');
      absolutePath = path.join(__dirname, '../private_uploads', filename);
    } else if (relativePath.startsWith('/uploads/')) {
      const filename = relativePath.replace('/uploads/', '');
      absolutePath = path.join(__dirname, '../uploads', filename);
    } else {
      absolutePath = path.resolve(relativePath);
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json(error('File vật lý không tồn tại'));
    }

    return res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTickets, getTicketById, getMyPosted,
  createTicket, updateTicket, deleteTicket,
  updateTicketStatus, verifyTicket, getTicketMedia,
  formatTicketResponse, formatTicketsResponse,
};
