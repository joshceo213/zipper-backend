// mailer.js
require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content of the email
 * @param {string} [html] - Optional HTML content of the email
 */
async function sendEmail(to, subject, text, html = null) {
  try {
    const emailData = {
      from: 'noreply@yourdomain.com', // Replace with your verified sender email
      to,
      subject,
      text,
    };

    if (html) {
      emailData.html = html;
    }

    await resend.emails.send(emailData);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

module.exports = { sendEmail };
