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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
