import { configured } from '../lib/mail.js';

export default function handler(_req, res) {
  res.json({ mail: configured, configured, google: !!(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID), otpSecret: !!process.env.OTP_SECRET });
}
