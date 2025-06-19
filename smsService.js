// smsService.js
require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN;   // Your Twilio Auth Token
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Your Twilio phone number

const client = twilio(accountSid, authToken);

/**
 * Send an SMS message using Twilio.
 * @param {string} to - Recipient phone number (with country code, e.g., +2609xxxxxxx)
 * @param {string} body - SMS text message
 */
async function sendSMS(to, body) {
  try {
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });
    console.log(`SMS sent to ${to}: SID ${message.sid}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
  }
}

module.exports = { sendSMS };

const { sendSMS } = require('./smsService');

const otp = '123456';
const userPhone = '+2609XXXXXXX'; // Include country code

sendSMS(userPhone, `Your OTP for Zipper is: ${otp}`)
  .then(() => console.log('OTP SMS sent'))
  .catch(err => console.error('Failed to send OTP SMS:', err));
