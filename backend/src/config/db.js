const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const dropStaleIndexes = async () => {
  try {
    const users = mongoose.connection.collection('users');
    const indexes = await users.indexes();
    if (indexes.some(i => i.name === 'username_1')) {
      await users.dropIndex('username_1');
      console.log('Dropped stale index: username_1');
    }
  } catch (_) {
    // non-critical — ignore if collection doesn't exist yet
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await dropStaleIndexes();
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
