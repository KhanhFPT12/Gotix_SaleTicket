const express = require('express');
const router = express.Router();

// Mock API endpoint for Cinema Verification
router.get('/verify', (req, res) => {
  const { cinema, bookingCode } = req.query;

  // Simulate network delay of 1.5 seconds to make it look like a real API call
  setTimeout(() => {
    // Generate a random valid response
    res.json({
      success: true,
      valid: true,
      data: {
        movie: "Avengers: Secret Wars",
        cinema: cinema || "CGV Vincom Đà Nẵng",
        showtime: "2026-07-15T20:30:00",
        seats: ["H1", "H2"],
        bookingCode: bookingCode || "MOCK-CODE-12345",
        status: "TICKET_VALID"
      },
      message: "API Rạp chiếu phim trả về: Mã vé hợp lệ."
    });
  }, 1500);
});

module.exports = router;
