const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // 1. Added password
  role: { 
    type: String, 
    enum: ['traveler', 'bus_owner'], // 2. Standardized naming
    required: true 
  },
  isVerified: { type: Boolean, default: false },
  
  // 3. Added OTP storage logic
  otp: {
    code: String,
    expiry: Date
  },

  // Company details for Bus Owners/Agents
  companyName: { type: String },
  isAgent: { type: Boolean, default: false }, // Distinguishes Owner vs Agent
  agentName: { type: String },
  
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
