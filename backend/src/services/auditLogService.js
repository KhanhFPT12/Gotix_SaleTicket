const AuditLog = require('../models/AuditLog');

async function log({ adminId, action, targetType, targetId, description }) {
  try {
    return await AuditLog.create({ adminId, action, targetType, targetId: String(targetId), description });
  } catch (err) {
    console.error('[auditLog] error:', err.message);
  }
}

module.exports = { log };
