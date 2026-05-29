/**
 * One-time migration: drop stale username_1 index from users collection.
 * Run once with: node src/scripts/dropUsernameIndex.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('users');
    const indexes = await collection.indexes();
    const hasIndex = indexes.some(idx => idx.name === 'username_1');

    if (hasIndex) {
      await collection.dropIndex('username_1');
      console.log('✅ Dropped stale index: username_1');
    } else {
      console.log('ℹ️  Index username_1 not found — nothing to drop');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
})();
