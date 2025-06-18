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

// Default route
app.get('/', (req, res) => {
  res.send('Zipper Backend is running 🚐');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
