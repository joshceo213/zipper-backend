// smsService.js
require('dotenv').config();

// TEMPORARY LOGS – Check if .env values are loaded properly
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN);
console.log("TWILIO_PHONE_NUMBER:", process.env.TWILIO_PHONE_NUMBER);

const twilio = require('twilio');

// Initialize Twilio client using credentials from .env
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(to, message) {
  try {
    // Ensure phone number is in E.164 format starting with +
    const formattedTo = to.startsWith('+') ? to : `+${to}`;

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo,
    });
    console.log(`SMS sent to ${formattedTo}`, result.sid);
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    throw new Error('Failed to send SMS');
  }
}

module.exports = { sendSMS };
