// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: ['traveler', 'busOwner', 'admin'], required: true },
  isVerified: { type: Boolean, default: false },
  companyName: { type: String },
  agentName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
