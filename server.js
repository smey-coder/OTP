require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const otpStore = {};

app.use(cors());
app.use(express.json());

// Nodemailer config (Gmail) - dev-friendly
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,       // use 465 for SSL
  secure: true,    // true for port 465 (SMTPS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    // << Development only: ignore self-signed in chain >>
    rejectUnauthorized: false
  }
});

transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Gmail connection failed:', err);
  } else {
    console.log('✅ Gmail transporter is ready to send emails.');
  }
});

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'សូមបញ្ចូលអ៊ីមែល' });

  const otp = crypto.randomInt(100000, 999999).toString();
  otpStore[email] = { code: otp, expiry: Date.now() + 5*60*1000 };

  const mailOptions = {
    from: `"OTP Demo" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP',
    html: `<p>Your OTP: <b>${otp}</b></p><p>Valid for 5 minutes.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
    res.json({ message: 'OTP sent' });
  } catch (error) {
    console.error('❌ sendMail error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Check App Password or TLS.' });
  }
});

// verify endpoint (same as before)
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore[email];
  if (!stored) return res.status(400).json({ error: 'No OTP requested for this email.' });
  if (Date.now() > stored.expiry) { delete otpStore[email]; return res.status(400).json({ error: 'OTP expired' }); }
  if (stored.code === otp) { delete otpStore[email]; return res.json({ message: 'Verified' }); }
  return res.status(401).json({ error: 'Wrong OTP' });
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
