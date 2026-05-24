const Report = require('../models/Report');
const { success, error } = require('../utils/apiResponse');

const createReport = async (req, res, next) => {
  try {
    const { ticketId, reason, description } = req.body;
    const report = await Report.create({
      reporterId: req.user.id,
      ticketId,
      reason,
      description,
    });
    return res.status(201).json(success('Báo cáo thành công', { report }));
  } catch (err) {
    next(err);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reporterId: req.user.id })
      .populate('ticketId', 'title category location')
      .sort({ createdAt: -1 });
    return res.json(success('Báo cáo của tôi', { reports }));
  } catch (err) {
    next(err);
  }
};

module.exports = { createReport, getMyReports };
