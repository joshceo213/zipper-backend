const express = require('express');
const router = express.Router();

const bookings = [];

// POST a new booking
router.post('/', (req, res) => {
  const booking = req.body;
  bookings.push(booking);
  res.status(201).json({ message: 'Booking confirmed', booking });
});

// GET all bookings
router.get('/', (req, res) => {
  res.json(bookings);
});

module.exports = router;
