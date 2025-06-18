const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const busRoutes = require('./routes/buses');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/buses', busRoutes);
app.use('/bookings', bookingRoutes);
app.use('/admin', adminRoutes);

// Mock login route
app.post('/login', (req, res) => {
  const { identifier, password } = req.body;

  // Mock check: allow any identifier/password combo
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  console.log('Login request received:', req.body);

  res.json({
    token: 'mock-token-123',
    name: identifier,
    role: 'Traveler' // You can change this depending on your test
  });
});

// Mock signup route
app.post('/signup', (req, res) => {
  const { name, identifier, password, role } = req.body;

  if (!name || !identifier || !password || !role) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  console.log('Signup request received:', req.body);

  res.json({
    id: Date.now(),
    name,
    role
  });
});

// Default test route
app.get('/', (req, res) => {
  res.send('Zipper Backend is running 🚐');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
