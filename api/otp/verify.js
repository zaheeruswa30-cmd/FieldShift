import { checkCode, hasSecret } from '../../lib/otp.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!hasSecret()) return res.status(500).json({ error: 'Server setup missing: add OTP_SECRET in Vercel Environment Variables.' });
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const purpose = String(body.purpose || 'login');
  if (!checkCode(email, purpose, body.code)) return res.status(400).json({ error: 'Wrong or expired code. Ask for a new one.' });
  res.json({ ok: true });
}
