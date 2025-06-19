// smsService.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

async function sendSMS(to, message) {
  try {
    const msg = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });
    console.log('Twilio SMS sent:', msg.sid);
  } catch (error) {
    console.error('Twilio SMS error:', error.message);
  }
}

module.exports = { sendSMS };
