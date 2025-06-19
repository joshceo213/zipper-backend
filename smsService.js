async function sendSMS(phone, message) {
  console.log(`[MOCK SMS to ${phone}]: ${message}`);
  // Replace with real API integration (e.g., Twilio)
}

module.exports = { sendSMS };
