import { makeCode, hasSecret } from '../../lib/otp.js';
import { configured, sendMail, niceError } from '../../lib/mail.js';

const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const WHY = { signup: 'verify your email', reset: 'reset your password', code: 'log in', login: 'log in' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const purpose = String(body.purpose || 'login');
  if (!okEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!hasSecret()) return res.status(500).json({ error: 'Server setup missing: add OTP_SECRET in Vercel Environment Variables.' });

  const code = makeCode(email, purpose);
  if (!configured) return res.json({ ok: true, sent: false, devCode: code });

  try {
    await sendMail({
      to: email,
      subject: `FieldShift code: ${code}`,
      text: `Your FieldShift code to ${WHY[purpose] || 'continue'} is ${code}. It expires in about 10 minutes. If you did not ask for it, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif"><h2>🌾 FieldShift</h2><p>Use this code to ${WHY[purpose] || 'continue'}:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>Expires in about 10 minutes. If you did not ask for it, ignore this email.</p></div>`,
    });
    res.json({ ok: true, sent: true });
  } catch (e) {
    console.error('Mail error:', e.message);
    res.status(502).json({ error: niceError(e) });
  }
}
