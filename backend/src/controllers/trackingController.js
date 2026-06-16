const SiteStat = require('../models/SiteStat');
const { success, error } = require('../utils/apiResponse');

// In-memory map to store active connections
// Key: IP or identifier, Value: Timestamp
const activeUsersMap = new Map();

const pingTracking = async (req, res, next) => {
  try {
    const { isNewVisit, clientId } = req.body;
    // Use the client's provided ID or fallback to IP
    const identifier = clientId || req.ip || req.connection.remoteAddress;

    // Record the current time
    activeUsersMap.set(identifier, Date.now());

    // If the frontend reported this as a new session visit, increment DB totalVisits
    if (isNewVisit) {
      let stat = await SiteStat.findOne({ type: 'global' });
      if (!stat) {
        stat = await SiteStat.create({ type: 'global', totalVisits: 1 });
      } else {
        stat.totalVisits += 1;
        await stat.save();
      }
    }

    // Clean up old active users (who haven't pinged in the last 30 seconds)
    const thirtySecondsAgo = Date.now() - 30000;
    for (const [id, lastSeen] of activeUsersMap.entries()) {
      if (lastSeen < thirtySecondsAgo) {
        activeUsersMap.delete(id);
      }
    }

    res.json(success('Ping recorded', { activeUsers: activeUsersMap.size }));
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await getRealTimeStats();
    res.json(success('Tracking stats', {
      activeUsers: stats.realActiveUsers,
      totalVisits: stats.realTotalVisits
    }));
  } catch (err) {
    next(err);
  }
};

// Function to export to other controllers (e.g. Admin Controller)
const getRealTimeStats = async () => {
  // Clean up first
  const thirtySecondsAgo = Date.now() - 30000;
  for (const [id, lastSeen] of activeUsersMap.entries()) {
    if (lastSeen < thirtySecondsAgo) {
      activeUsersMap.delete(id);
    }
  }

  let stat = await SiteStat.findOne({ type: 'global' });
  const totalVisits = stat ? stat.totalVisits : 0;

  return {
    realActiveUsers: activeUsersMap.size,
    realTotalVisits: totalVisits
  };
};

module.exports = { pingTracking, getStats, getRealTimeStats };
