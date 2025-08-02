const express = require('express');
const router = express.Router();
const { generateOTP, saveOTP, verifyOTP } = require('../services/otpService');
const { sendEmail } = require('../services/mailer');
const { sendSMS } = require('../services/smsService');

// In-memory user and OTP stores
const users = [];
const otps = new Map();

/**
 * @route POST /signup
 * @desc Register new user and send OTP
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, identifier, password, role, busCompany, handlerName } = req.body;

    if (!name || !identifier || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Check if user already exists
    const exists = users.find(u => u.email === identifier.toLowerCase() || u.phone === identifier);
    if (exists) {
      return res.status(409).json({ message: 'This account is already in the system.' });
    }

    const isEmail = identifier.includes('@');

    const user = {
      id: users.length + 1,
      name,
      email: isEmail ? identifier.toLowerCase() : null,
      phone: isEmail ? null : identifier,
      password,
      role,
      verified: false,
      busCompany: role === 'Bus Owner' ? busCompany : null,
      handlerName: role === 'Bus Owner' ? handlerName : null,
    };

    users.push(user);

    // Generate and save OTP
    const otp = generateOTP();
    saveOTP(identifier, otp);

    // Send OTP via email or SMS
    if (isEmail) {
      await sendEmail(user.email, 'Tumina OTP Verification', `Your OTP is: ${otp}`);
    } else {
      await sendSMS(user.phone, `Your OTP for Tumina is: ${otp}`);
    }

    return res.json({ message: 'OTP sent, please verify your account.' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /verify-otp
 * @desc Verify OTP for account
 */
router.post('/verify-otp', (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP required' });
    }

    if (!verifyOTP(identifier, otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = users.find(
      (u) => u.email === identifier.toLowerCase() || u.phone === identifier
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verified = true;

    return res.json({ message: 'Account verified successfully', userId: user.id });
  } catch (err) {
    console.error('OTP verification error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /resend-otp
 * @desc Resend OTP to user
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Identifier required' });

    const user = users.find(
      (u) => u.email === identifier.toLowerCase() || u.phone === identifier
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    saveOTP(identifier, otp);

    if (user.email) {
      await sendEmail(user.email, 'Tumina OTP Verification', `Your OTP is: ${otp}`);
    } else if (user.phone) {
      await sendSMS(user.phone, `Your OTP for Tumina is: ${otp}`);
    }

    return res.json({ message: 'OTP resent successfully' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /login
 * @desc Login with phone or email and password
 */
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide identifier and password' });
    }

    const user = users.find(
      (u) =>
        (u.email === identifier.toLowerCase() || u.phone === identifier) &&
        u.password === password
    );

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.verified) {
      return res.status(403).json({ message: 'Account not verified. Please verify your OTP.' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      busCompany: user.busCompany || null,
      handlerName: user.handlerName || null
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
