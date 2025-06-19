require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generateOTP, saveOTP, verifyOTP } = require('./otpService');
const { sendEmail } = require('./mailer');
const { sendSMS } = require('./smsService');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory "database"
const users = [];
const otps = new Map(); // simple Map to hold OTPs keyed by identifier

app.post('/signup', async (req, res) => {
  try {
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
      password, // TODO: hash this in a real app
      role,
      verified: false,
    };

    users.push(user);

    const otp = generateOTP();
    saveOTP(identifier, otp);

    if (isEmail) {
      await sendEmail(user.email, 'Your OTP for Zipper', `Your OTP is: ${otp}`);
    } else {
      await sendSMS(user.phone, `Your OTP for Zipper is: ${otp}`);
    }

    return res.json({ message: 'OTP sent, please verify your account.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/verify-otp', (req, res) => {
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
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verified = true;
    return res.json({ message: 'Account verified successfully', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide identifier and password' });
    }

    const user = users.find(
      (u) => (u.email === identifier.toLowerCase() || u.phone === identifier) && u.password === password
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Account not verified. Please verify your OTP.' });
    }

    // TODO: issue JWT token or session here

    return res.json({ id: user.id, name: user.name, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// otpService.js example for your reference:

/*
// otpService.js
const otps = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveOTP(identifier, otp) {
  otps.set(identifier, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 minutes expiry
}

function verifyOTP(identifier, otp) {
  const record = otps.get(identifier);
  if (!record) return false;
  if (record.otp !== otp) return false;
  if (Date.now() > record.expiresAt) {
    otps.delete(identifier);
    return false;
  }
  otps.delete(identifier);
  return true;
}

module.exports = { generateOTP, saveOTP, verifyOTP };
*/

// Similar minimal implementations needed for mailer.js and smsService.js (using your Resend and SMS provider APIs)
