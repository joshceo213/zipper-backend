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

    res.json({ message: 'Account verified successfully ✅', userId: user.id });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Internal server error during OTP verification.' });
  }
});
