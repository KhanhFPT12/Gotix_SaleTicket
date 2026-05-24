require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const connectDB = require('./config/db');
const Ticket = require('./models/Ticket');

async function expireTickets() {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const result = await Ticket.updateMany(
      {
        status: 'available',
        verifyStatus: 'verified',
        eventDate: { $lt: today, $exists: true, $ne: '' },
      },
      { status: 'expired' }
    );
    if (result.modifiedCount > 0) {
      console.log(`[cron] Expired ${result.modifiedCount} ticket(s)`);
    }
  } catch (err) {
    console.error('[cron] expireTickets error:', err.message);
  }
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // Run expire check on startup and every day at midnight
  expireTickets();
  cron.schedule('0 0 * * *', expireTickets);

  app.listen(PORT, () => {
    console.log(`GoTix server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
