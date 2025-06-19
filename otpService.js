const otps = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveOTP(identifier, otp) {
  otps.set(identifier, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // expires in 5 minutes
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
