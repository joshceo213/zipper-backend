require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { generateOTP, saveOTP, verifyOTP } = require('./otpService');
const { sendSMS } = require('./smsService');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory DB (to be replaced with a real DB)
const users = [];

/**
 * 🔐 SIGNUP ROUTE
 * Accepts:
 *  - name, identifier (phone), password, role
 *  - if BusOwner: companyName, handlerName, contactNumber
 */
app.post('/signup', async (req, res) => {
  try {
    const { name, identifier, password, role, companyName, handlerName, contactNumber } = req.body;

    if (!name || !identifier || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    const existingUser = users.find(u => u.phone === formattedPhone);
    if (existingUser) {
      return res.status(409).json({ message: 'This account is already in the system.' });
    }

    const newUser = {
      id: users.length + 1,
      name,
      phone: formattedPhone,
      password,
      role,
      verified: false,
      ...(role === 'BusOwner' && {
        companyName,
        handlerName,
        contactNumber,
      }),
    };

    users.push(newUser);

    const otp = generateOTP();
    saveOTP(formattedPhone, otp);

    try {
      await sendSMS(formattedPhone, `Your OTP for Tumina is: ${otp}`);
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

/**
 * ✅ VERIFY OTP
 */
app.post('/verify-otp', (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    if (!verifyOTP(formattedPhone, otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const user = users.find(u => u.phone === formattedPhone);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.verified = true;
    return res.json({ message: 'Account verified successfully ✅', userId: user.id });

  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    res.status(500).json({ message: 'Internal server error during OTP verification.' });
  }
});

/**
 * 🔁 RESEND OTP
 */
app.post('/resend-otp', async (req, res) => {
  try {
    const { identifier } = req.body;
    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    const user = users.find(u => u.phone === formattedPhone);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    saveOTP(formattedPhone, otp);

    try {
      await sendSMS(formattedPhone, `Your OTP for Tumina is: ${otp}`);
      return res.status(200).json({ message: 'OTP resent successfully.' });
    } catch (err) {
      console.error('OTP Resend Error:', err.message);
      return res.status(500).json({ message: 'Failed to resend OTP.' });
    }

  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    res.status(500).json({ message: 'Internal server error during resend OTP.' });
  }
});

/**
 * 🔓 LOGIN ROUTE
 */
app.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    const formattedPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;

    const user = users.find(
      (u) => u.phone === formattedPhone && u.password === password
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Account not verified. Please verify your OTP.' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      ...(user.role === 'BusOwner' && {
        companyName: user.companyName,
        handlerName: user.handlerName,
        contactNumber: user.contactNumber,
      })
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

/**
 * 🌐 HOME
 */
app.get('/', (req, res) => {
  res.send('🚍 Tumina Backend is running.');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Tumina backend server running on port ${PORT}`);
});
