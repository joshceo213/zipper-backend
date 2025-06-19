// index.js
require('dotenv').config(); // Load .env first

const express = require('express');
const cors = require('cors');

const { generateOTP, saveOTP, verifyOTP } = require('./otpService');
const { sendEmail } = require('./mailer');
const { sendSMS } = require('./smsService');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory DB (replace with actual DB later)
const users = [];

// 🔐 Signup
app.post('/signup', async (req, res) => {
  try {
    const { name, identifier, password, role, busCompany, accountManager } = req.body;

    if (!name || !identifier || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
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
      ...(role === 'BusOwner' && {
        busCompany,
        accountManager,
      }),
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

      return res.status(200).json({ message: 'OTP sent, please verify your account.' });
    } catch (err) {
      console.error('OTP Send Error:', err.message);
      return res.status(500).json({ message: 'Failed to send OTP.' });
    }
  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ message: 'Internal server error during signup.' });
  }
});

// ✅ Verify OTP
app.post('/verify-otp', (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP required.' });
    }

    if (!verifyOTP(identifier, otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const user = users.find(
      (u) => u.email === identifier.toLowerCase() || u.phone === identifier
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.verified = true;
    res.json({ message: 'Account verified successfully ✅', userId: user.id });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Internal server error during OTP verification.' });
  }
});

// 🔁 Resend OTP
app.post('/resend-otp', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: 'Identifier is required' });
    }

    const user = users.find(
      (u) => u.email === identifier.toLowerCase() || u.phone === identifier
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    saveOTP(identifier, otp);

    try {
      if (user.email) {
        await sendEmail(user.email, 'Your OTP for Zipper', `Your OTP is: ${otp}`);
      } else {
        await sendSMS(user.phone, `Your OTP for Zipper is: ${otp}`);
      }

      return res.status(200).json({ message: 'OTP resent successfully.' });
    } catch (err) {
      console.error('OTP Resend Error:', err.message);
      return res.status(500).json({ message: 'Failed to resend OTP.' });
    }
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ message: 'Internal server error during resend OTP.' });
  }
});

// 🔓 Login
app.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide identifier and password' });
    }

    const user = users.find(
      (u) => (u.email === identifier.toLowerCase() || u.phone === identifier) && u.password === password
    );

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.verified) return res.status(403).json({ message: 'Account not verified. Please verify your OTP.' });

    return res.json({ id: user.id, name: user.name, role: user.role });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// 🌐 Default
app.get('/', (req, res) => {
  res.send('Zipper Backend is running 🚐');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
