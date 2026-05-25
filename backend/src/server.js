require('dotenv').config();
const http = require('http');
const cron = require('node-cron');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const Ticket = require('./models/Ticket');

const server = http.createServer(app);
initSocket(server);

async function expireTickets() {
  try {
    const today = new Date().toISOString().slice(0, 10);
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
  expireTickets();
  cron.schedule('0 0 * * *', expireTickets);

  server.listen(PORT, () => {
    console.log(`GoTix server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
