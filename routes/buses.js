const express = require('express');
const router = express.Router();

// Mock buses for now
const buses = [
  { id: 1, name: 'UBZ', route: 'Lusaka to Ndola', price: 200 },
  { id: 2, name: 'Power Tools', route: 'Lusaka to Kitwe', price: 250 },
  { id: 3, name: 'Jonda', route: 'Lusaka to Livingstone', price: 280 },
  { id: 4, name: 'Juldan Motors', route: 'Lusaka to Chipata', price: 230 },
  { id: 5, name: 'Shalom', route: 'Lusaka to Mongu', price: 300 },
  { id: 6, name: 'Likili', route: 'Lusaka to Solwezi', price: 290 },
  { id: 7, name: 'Sam Logix', route: 'Lusaka to Kasama', price: 310 },
];

router.get('/', (req, res) => {
  res.json(buses);
});

module.exports = router;
