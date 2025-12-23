const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['traveler', 'bus_owner'], // Standardized for your dashboards
    required: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  otp: {
    code: String,
    expiry: Date
  },
  // Details for Bus Owners and Agents
  companyName: { type: String },
  isAgent: { type: Boolean, default: false },
  agentName: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
