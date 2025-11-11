// api/send-otp.js
// Serverless handler for Vercel /api/send-otp
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import { Redis } from '@upstash/redis';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Upstash Redis (serverless-friendly)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const OTP_TTL_SECONDS = 300; // 5 minutes

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // create 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  try {
    // store OTP with TTL using Upstash
    await redis.set(`otp:${email}`, otp, { ex: OTP_TTL_SECONDS });

    // send email via SendGrid
    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER, // verified sender in SendGrid
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; color:#111">
          <h3>Your verification code</h3>
          <p style="font-size:20px; font-weight:700;">${otp}</p>
          <p>This code expires in 5 minutes.</p>
        </div>
      `
    };

    await sgMail.send(msg);

    return res.status(200).json({ message: 'OTP sent' });
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
}
