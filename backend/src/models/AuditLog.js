const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    adminId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:      { type: String, required: true },
    targetType:  { type: String, required: true },
    targetId:    { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
