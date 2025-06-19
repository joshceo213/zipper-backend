const express = require('express');
const router = express.Router();

// In-memory bookings list
const bookings = [];

router.post('/', (req, res) => {
  const { userId, busId, travelDate } = req.body;

  if (!userId || !busId || !travelDate) {
    return res.status(400).json({ message: 'Missing booking info' });
  }

  const booking = {
    id: bookings.length + 1,
    userId,
    busId,
    travelDate,
    createdAt: new Date(),
  };

  bookings.push(booking);
  return res.status(201).json({ message: 'Booking successful', booking });
});

router.get('/', (req, res) => {
  res.json(bookings);
});

module.exports = router;
