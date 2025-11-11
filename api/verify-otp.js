// api/verify-otp.js
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, otp } = req.body || {};
  if (!email || !otp) return res.status(400).json({ error: 'Email and otp are required' });

  try {
    const stored = await redis.get(`otp:${email}`);
    if (!stored) return res.status(400).json({ error: 'No OTP found or it expired' });

    if (stored === otp) {
      // delete OTP key after successful verification
      await redis.del(`otp:${email}`);
      return res.status(200).json({ message: 'Verified' });
    } else {
      return res.status(401).json({ error: 'Wrong OTP' });
    }
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
