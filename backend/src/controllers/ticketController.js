const { validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { success, error } = require('../utils/apiResponse');

const getTickets = async (req, res, next) => {
  try {
    const {
      search, category, location, verifyStatus, status: statusFilter,
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

    return res.json(
      success('Danh sách vé', {
        tickets,
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
    return res.json(success('Chi tiết vé', { ticket }));
  } catch (err) {
    next(err);
  }
};

// Vé do user hiện tại đăng (bao gồm cả pending/rejected)
const getMyPosted = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    return res.json(success('Vé đã đăng', { tickets }));
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
      data.ticketImage = `/uploads/${req.files.ticketImage[0].filename}`;
    }
    if (req.files?.qrImage?.[0]) {
      data.qrImage = `/uploads/${req.files.qrImage[0].filename}`;
    }
    const ticket = await Ticket.create(data);

    await notify({
      receiverId: req.user.id,
      title: 'Đăng vé thành công',
      message: `Vé "${ticket.title}" đã được gửi, đang chờ admin xét duyệt.`,
      type: 'ticket_submitted',
      relatedId: ticket._id.toString(),
    });

    // Also notify all admins
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

    return res.status(201).json(success('Đăng vé thành công, đang chờ admin duyệt', { ticket }));
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
    if (req.files?.ticketImage?.[0]) data.ticketImage = `/uploads/${req.files.ticketImage[0].filename}`;
    if (req.files?.qrImage?.[0]) data.qrImage = `/uploads/${req.files.qrImage[0].filename}`;

    const updated = await Ticket.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    return res.json(success('Cập nhật vé thành công', { ticket: updated }));
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
    return res.json(success('Cập nhật trạng thái thành công', { ticket }));
  } catch (err) {
    next(err);
  }
};

const verifyTicket = async (req, res, next) => {
  try {
    const { verifyStatus } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { verifyStatus }, { new: true });
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));
    return res.json(success('Xác minh vé thành công', { ticket }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTickets, getTicketById, getMyPosted,
  createTicket, updateTicket, deleteTicket,
  updateTicketStatus, verifyTicket,
};
