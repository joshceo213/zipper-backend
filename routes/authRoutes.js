const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Path to your new model
const { generateOTP } = require('../services/otpService');
const { sendEmail } = require('../services/mailer');
const { sendSMS } = require('../services/smsService');

/**
 * @route POST /signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, identifier, password, role, busCompany, handlerName } = req.body;

    if (!name || !identifier || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // 1. Check if user already exists in DB
    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier };
    const exists = await User.findOne(query);
    
    if (exists) {
      return res.status(409).json({ message: 'This account is already in the system.' });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 mins

    // 4. Create User in MongoDB
    const newUser = new User({
      phone: isEmail ? null : identifier,
      email: isEmail ? identifier.toLowerCase() : null,
      password: hashedPassword,
      role: role, // Ensure this matches 'traveler' or 'bus_owner' from your model
      isVerified: false,
      otp: { code: otp, expiry: otpExpiry },
      companyName: busCompany,
      agentName: handlerName
    });

    await newUser.save();

    // 5. Send OTP
    if (isEmail) {
      await sendEmail(identifier, 'Tumina OTP Verification', `Your OTP is: ${otp}`);
    } else {
      await sendSMS(identifier, `Your OTP for Tumina is: ${otp}`);
    }

    return res.json({ message: 'OTP sent, please verify your account.', identifier });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /verify-otp
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify code and expiry
    if (user.otp.code !== otp || new Date() > user.otp.expiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp.code = undefined; // Clear OTP after use
    await user.save();

    return res.json({ 
      message: 'Account verified successfully', 
      role: user.role,
      userId: user._id 
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /login
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please verify your OTP.' });
    }

    return res.json({
      id: user._id,
      role: user.role,
      companyName: user.companyName
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
