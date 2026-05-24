const Favorite = require('../models/Favorite');
const Ticket = require('../models/Ticket');
const { success, error } = require('../utils/apiResponse');

const toggleFavorite = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const existing = await Favorite.findOne({ userId: req.user.id, ticketId });
    if (existing) {
      await existing.deleteOne();
      return res.json(success('Đã bỏ lưu vé', { saved: false }));
    }
    await Favorite.create({ userId: req.user.id, ticketId });
    return res.json(success('Đã lưu vé', { saved: true }));
  } catch (err) {
    next(err);
  }
};

const getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate({
        path: 'ticketId',
        populate: { path: 'ownerId', select: 'name avatar rating isPro proBadge' },
      })
      .sort({ createdAt: -1 });
    const tickets = favorites
      .map((f) => f.ticketId)
      .filter((t) => t && t.status === 'available' && t.verifyStatus === 'verified');
    return res.json(success('Vé đã lưu', { tickets }));
  } catch (err) {
    next(err);
  }
};

const checkFavorite = async (req, res, next) => {
  try {
    const exists = await Favorite.exists({ userId: req.user.id, ticketId: req.params.ticketId });
    return res.json(success('', { saved: !!exists }));
  } catch (err) {
    next(err);
  }
};

module.exports = { toggleFavorite, getMyFavorites, checkFavorite };
