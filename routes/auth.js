const express = require('express');
const { generateOTP, saveOTP, verifyOTP } = require('../otpService');
const { sendEmail } = require('../mailer');
const { sendSMS } = require('../smsService');

const router = express.Router();

const users = []; // Replace with real DB later

router.post('/signup', async (req, res) => {
  const { name, identifier, password, role } = req.body;

  if (!name || !identifier || !password || !role) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  const exists = users.find(
    (u) => u.email === identifier.toLowerCase() || u.phone === identifier
  );
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
  };

  users.push(user);

  const otp = generateOTP();
  saveOTP(identifier, otp);

  try {
    if (isEmail) {
      await sendEmail(user.email, 'Your OTP for Zipper', `Your OTP is: ${otp}`);
    } else {
      await sendSMS(user.phone, `Your OTP for Zipper is: ${otp}`);
    }

    res.json({ message: 'OTP sent, please verify your account.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

router.post('/verify-otp', (req, res) => {
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

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.verified = true;

  res.json({ message: 'Account verified successfully', userId: user.id });
});

module.exports = router;
