const otps = new Map();

function normalizeIdentifier(identifier) {
  return identifier.startsWith('+') ? identifier : `+${identifier}`;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveOTP(identifier, otp) {
  const id = normalizeIdentifier(identifier);
  otps.set(id, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // expires in 5 minutes
}

function verifyOTP(identifier, otp) {
  const id = normalizeIdentifier(identifier);
  const record = otps.get(id);
  if (!record) return false;
  if (record.otp !== otp) return false;
  if (Date.now() > record.expiresAt) {
    otps.delete(id);
    return false;
  }
  otps.delete(id);
  return true;
}

module.exports = { generateOTP, saveOTP, verifyOTP };
