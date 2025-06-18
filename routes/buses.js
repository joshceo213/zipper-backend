const express = require('express');
const router = express.Router();

// Mock data
const buses = [
  { id: 1, operator: 'Power Tools', from: 'Lusaka', to: 'Kitwe', time: '08:00', price: 250 },
  { id: 2, operator: 'Juldan Motors', from: 'Ndola', to: 'Lusaka', time: '09:30', price: 230 },
];

// GET all buses
router.get('/', (req, res) => {
  res.json(buses);
});

module.exports = router;
