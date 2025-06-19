require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

async function sendSMS(to, body) {
  try {
    await client.messages.create({
      body,
      from: twilioNumber,
      to,
    });
    console.log(`SMS sent to ${to}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
  }
}

module.exports = { sendSMS };
