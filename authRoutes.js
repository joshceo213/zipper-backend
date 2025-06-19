const express = require('express');
const router = express.Router();
const { generateOTP, saveOTP, verifyOTP } = require('../services/otpService');
const { sendEmail } = require('../services/mailer');
const { sendSMS } = require('../services/smsService');

const users = [];
const otps = new Map();

router.post('/signup', async (req, res) => {
  try {
    const { name, identifier, password, role, busCompany, handlerName } = req.body;
    if (!name || !identifier || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

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
      busCompany,
      handlerName,
    };

    users.push(user);

    const otp = generateOTP();
    saveOTP(identifier, otp);

    if (isEmail) await sendEmail(user.email, 'Zipper OTP Verification', `Your OTP is: ${otp}`);
    else await sendSMS(user.phone, `Your OTP for Zipper is: ${otp}`);

    return res.json({ message: 'OTP sent, please verify your account.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

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
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

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

    if (user.email) await sendEmail(user.email, 'Zipper OTP Verification', `Your OTP is: ${otp}`);
    if (user.phone) await sendSMS(user.phone, `Your OTP for Zipper is: ${otp}`);

    return res.json({ message: 'OTP resent successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

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

    return res.json({ id: user.id, name: user.name, role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
