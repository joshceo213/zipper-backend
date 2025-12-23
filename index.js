require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Import the DB model
const { generateOTP, saveOTP, verifyOTP } = require('./otpService');
const { sendSMS } = require('./smsService');

const app = express();
app.use(cors());
app.use(express.json());

// 🗄️ CONNECT TO MONGODB
// This uses the URI you saved in Render Environment Variables
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Tumina DB)'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

/**
 * 🔐 SIGNUP ROUTE
 */
app.post('/signup', async (req, res) => {
  try {
    const { name, identifier, password, role, companyName, handlerName, contactNumber } = req.body;

    if (!name || !identifier || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    // 1. Check if user already exists in Database
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return res.status(409).json({ message: 'This account is already in the system.' });
    }

    // 2. Hash Password (Security)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Generate OTP and Expiry
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes

    // 4. Create New User in MongoDB
    const newUser = new User({
      phone: formattedPhone,
      password: hashedPassword,
      role: role, // Ensure frontend sends 'traveler' or 'bus_owner'
      isVerified: false,
      otp: {
        code: otp,
        expiry: otpExpiry
      },
      // If BusOwner, add extra details
      companyName: role === 'bus_owner' ? companyName : null,
      agentName: role === 'bus_owner' ? handlerName : null,
    });

    await newUser.save();

    // 5. Send OTP via SMS
    try {
      await sendSMS(formattedPhone, `Your OTP for Tumina is: ${otp}`);
      return res.status(200).json({ message: 'OTP sent, please verify your account.', identifier: formattedPhone });
    } catch (err) {
      console.error('OTP Send Error:', err.message);
      return res.status(500).json({ message: 'User saved, but failed to send SMS OTP.' });
    }

  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ message: 'Internal server error during signup.' });
  }
});

/**
 * ✅ VERIFY OTP
 */
app.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if OTP matches and hasn't expired
    if (user.otp.code !== otp || new Date() > user.otp.expiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Mark as verified and clear OTP code
    user.isVerified = true;
    user.otp.code = undefined;
    await user.save();

    return res.json({ 
      message: 'Account verified successfully ✅', 
      userId: user._id, 
      role: user.role 
    });

  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    res.status(500).json({ message: 'Internal server error during verification.' });
  }
});

/**
 * 🔁 RESEND OTP
 */
app.post('/resend-otp', async (req, res) => {
  try {
    const { identifier } = req.body;
    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    user.otp.code = otp;
    user.otp.expiry = new Date(Date.now() + 10 * 60000);
    await user.save();

    try {
      await sendSMS(formattedPhone, `Your OTP for Tumina is: ${otp}`);
      return res.status(200).json({ message: 'OTP resent successfully.' });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to resend OTP.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * 🔓 LOGIN ROUTE
 */
app.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    // Find user
    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare Hashed Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please verify your OTP.' });
    }

    return res.json({
      id: user._id,
      role: user.role,
      companyName: user.companyName,
      agentName: user.agentName
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.get('/', (req, res) => {
  res.send('🚍 Tumina Backend is running on MongoDB.');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Tumina backend server running on port ${PORT}`);
});
