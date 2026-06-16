const mongoose = require('mongoose');

const siteStatSchema = new mongoose.Schema({
  type: { type: String, required: true, default: 'global' },
  totalVisits: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SiteStat', siteStatSchema);
