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
      password, // (Later we hash this)
      role,
      verified: false,
    };

    users.push(user);

    // Generate OTP
    const otp = generateOTP();
    saveOTP(identifier, otp);

    // Try to send OTP
    if (isEmail) {
      try {
        await sendEmail(user.email, 'Your OTP for Zipper', `Your OTP is: ${otp}`);
      } catch (err) {
        console.error('Email sending failed:', err.message);
        return res.status(500).json({ message: 'Signup failed. Email service unavailable.' });
      }
    } else {
      try {
        await sendSMS(user.phone, `Your OTP for Zipper is: ${otp}`);
      } catch (err) {
        console.error('SMS sending failed:', err.message);
        return res.status(500).json({ message: 'Signup failed. SMS service unavailable.' });
      }
    }

    return res.status(200).json({ message: 'OTP sent, please verify your account.' });

  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ message: 'Internal server error during signup.' });
  }
});
