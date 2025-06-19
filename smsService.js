// smsService.js
require('dotenv').config();

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  console.error('❌ Missing Twilio environment variables!');
}

const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(to, message) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`✅ SMS sent to ${to}`);
    return result;
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
    throw new Error('Failed to send SMS');
  }
}

module.exports = { sendSMS };
