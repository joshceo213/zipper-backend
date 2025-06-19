const express = require('express');
const router = express.Router();

// Mock admin tasks
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard - coming soon' });
});

module.exports = router;
