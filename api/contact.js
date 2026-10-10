// Vercel serverless function: receives the contact form and relays it over SMTP.
// Credentials live in environment variables only — never in the client bundle.
//   SMTP_USER  Gmail address used to send (e.g. durrezahmed01@gmail.com)
//   SMTP_PASS  Gmail app password (Google Account → Security → App passwords)
//   SMTP_HOST  optional, defaults to smtp.gmail.com
//   SMTP_PORT  optional, defaults to 465
//   CONTACT_TO optional, defaults to durrezahmed01@gmail.com
const nodemailer = require('nodemailer');

const MAX = { name: 120, email: 254, message: 5000 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name = '', email = '', message = '', company = '' } = req.body || {};
  // Honeypot: real visitors never see the "company" field.
  if (company) return res.status(200).json({ ok: true });

  const cleanName = String(name).trim().slice(0, MAX.name);
  const cleanEmail = String(email).trim().slice(0, MAX.email);
  const cleanMessage = String(message).trim().slice(0, MAX.message);
  if (!cleanMessage || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return res.status(400).json({ error: 'A message and a valid email are required' });

  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return res.status(500).json({ error: 'Mailer is not configured' });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"Portfolio contact" <${SMTP_USER}>`,
      to: process.env.CONTACT_TO || 'durrezahmed01@gmail.com',
      replyTo: cleanEmail,
      subject: `Portfolio contact — ${cleanName || cleanEmail}`,
      text: `From: ${cleanName || 'Anonymous'} <${cleanEmail}>\n\n${cleanMessage}\n`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact mail failed:', err.message);
    return res.status(502).json({ error: 'Could not send the message' });
  }
};
