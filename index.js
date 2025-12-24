require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
const { generateOTP } = require('./otpService');

const app = express();
app.use(cors());
app.use(express.json());

// 🗄️ CONNECT TO MONGODB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (Tumina DB)'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

/**
 * 🔐 SIGNUP ROUTE
 */
app.post('/signup', async (req, res) => {
  try {
    const { name, identifier, password, role, companyName, handlerName } = req.body;

    if (!name || !identifier || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    // Clean phone formatting
    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    // 1. Check if user exists
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return res.status(409).json({ message: 'This account is already in the system.' });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60000); 

    // 4. Create User
    const newUser = new User({
      name: name,
      phone: formattedPhone,
      password: hashedPassword,
      role: role,
      isVerified: false,
      otp: {
        code: otp,
        expiry: otpExpiry
      },
      companyName: role === 'bus_owner' ? companyName : null,
      agentName: role === 'bus_owner' ? handlerName : null,
    });

    await newUser.save();

    // 🚀 DEV MODE: Log the OTP to Render console instead of sending SMS via Twilio
    console.log(`\n***************************************`);
    console.log(`🚀 NEW SIGNUP: ${name} (${formattedPhone})`);
    console.log(`🔑 DEV OTP: ${otp}`);
    console.log(`***************************************\n`);

    // We return 'devOtp' so the frontend can use it to auto-verify during testing
    return res.status(200).json({ 
      message: 'Signup successful! (Dev Mode: OTP logged to console)', 
      identifier: formattedPhone,
      devOtp: otp 
    });

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

    // DEBUG/DEV LOGIC: Allow '123456' as a universal bypass code for testing
    const isMasterCode = otp === '123456';
    const isValidCode = user.otp.code === otp && new Date() < user.otp.expiry;

    if (isMasterCode || isValidCode) {
      user.isVerified = true;
      user.otp.code = undefined; // Clear code
      await user.save();

      return res.json({ 
        message: 'Account verified successfully ✅', 
        userId: user._id, 
        role: user.role 
      });
    } else {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

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
    const { identifier } = req.params;
    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    const user = await User.findOne({ phone: formattedPhone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    user.otp.code = otp;
    user.otp.expiry = new Date(Date.now() + 10 * 60000);
    await user.save();

    console.log(`🚀 RESENT OTP for ${formattedPhone}: ${otp}`);
    
    return res.status(200).json({ message: 'OTP resent! Check logs.', devOtp: otp });
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

    const user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please verify your OTP.' });
    }

    return res.json({
      id: user._id,
      name: user.name,
      role: user.role,
      companyName: user.companyName,
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.get('/', (req, res) => {
  res.send('🚍 Tumina Backend is running on MongoDB (Dev Mode).');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Tumina backend server running on port ${PORT}`);
});
