const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gotix';

const Ticket = require('../models/Ticket');

async function run() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    const tickets = await Ticket.find({});
    console.log(`🔍 Found ${tickets.length} tickets to process...`);

    let updatedCount = 0;
    for (const ticket of tickets) {
      const title = (ticket.title || '') + ' ' + (ticket.details?.movieTitle || '');
      let imagePath = '/private_uploads/mock_ticket.png';

      if (title.match(/Lật Mặt/i)) {
        imagePath = '/private_uploads/ticket_latmat.png';
      } else if (title.match(/Avengers|Spider-Man|Demon Slayer/i)) {
        imagePath = '/private_uploads/ticket_avengers.png';
      } else if (title.match(/Deadpool/i)) {
        imagePath = '/private_uploads/ticket_deadpool.png';
      } else if (title.match(/Interstellar|Conjuring|Ma Sơ/i)) {
        imagePath = '/private_uploads/ticket_interstellar.png';
      }

      ticket.ticketImage = imagePath;
      ticket.qrImage = '/private_uploads/mock_qr.png';
      await ticket.save();
      updatedCount++;
    }

    console.log(`✅ Updated ${updatedCount} tickets with diverse image mappings.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating tickets:', err);
    process.exit(1);
  }
}

run();
