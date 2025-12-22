const otps = new Map();

const DEV_MODE = true; // 🔥 change to false when SMS goes live
const DEV_OTP = '123456';

function normalizeIdentifier(identifier) {
  return identifier.startsWith('+') ? identifier : `+${identifier}`;
}

function generateOTP() {
  if (DEV_MODE) return DEV_OTP;
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveOTP(identifier, otp) {
  const id = normalizeIdentifier(identifier);

  otps.set(id, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  if (DEV_MODE) {
    console.log(`📲 DEV OTP for ${id}: ${otp}`);
  }
}

function verifyOTP(identifier, otp) {
  const id = normalizeIdentifier(identifier);
  const record = otps.get(id);

  if (!record) return false;
  if (record.otp !== otp) return false;

  if (!DEV_MODE && Date.now() > record.expiresAt) {
    otps.delete(id);
    return false;
  }

  otps.delete(id);
  return true;
}

module.exports = { generateOTP, saveOTP, verifyOTP };
