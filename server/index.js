// FieldShift mail + Google backend. Run with `npm run dev` (starts together with the web app).
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

const clean = (v) => String(v || '').trim().replace(/^["']|["']$/g, '');
const { PORT = 3001 } = process.env;
const SMTP_HOST = clean(process.env.SMTP_HOST) || 'smtp.gmail.com';
const SMTP_PORT = +clean(process.env.SMTP_PORT) || 587;
const SMTP_USER = clean(process.env.SMTP_USER);
const SMTP_PASS = clean(process.env.SMTP_PASS).replace(/\s+/g, ''); // Google shows app passwords with spaces
const MAIL_FROM = clean(process.env.MAIL_FROM) || SMTP_USER;
const GOOGLE_CLIENT_ID = clean(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID); // either name works
if (GOOGLE_CLIENT_ID && !/\.apps\.googleusercontent\.com$/.test(GOOGLE_CLIENT_ID)) console.warn('Warning: GOOGLE_CLIENT_ID does not end with .apps.googleusercontent.com. Did you paste the Client Secret by mistake?');
const app = express();
app.use(cors());
app.use(express.json());

// Placeholder values from .env.example must count as "not set".
const looksFake = (u) => !u || /your@|youremail|example\.com|xxxx/i.test(u);
const configured = !looksFake(SMTP_USER) && SMTP_PASS.length > 0;

// Some networks (ISPs/firewalls) block port 587. For Gmail we automatically fall back to 465 (SSL) and back.
const ports = [SMTP_PORT, ...(SMTP_HOST === 'smtp.gmail.com' ? [SMTP_PORT === 587 ? 465 : 587] : [])];
const makeTransport = (port) => nodemailer.createTransport({
  host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS },
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
});
const niceError = (e) => e.code === 'EAUTH'
  ? 'Login rejected. For Gmail you must use a 16-letter App Password (2-Step Verification ON), not your normal password.'
  : ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'ECONNREFUSED'].includes(e.code)
    ? `Could not reach ${SMTP_HOST}. Check your internet/VPN/firewall (tried ports ${ports.join(' and ')}).` : e.message;

let mailer = null; // the transport that actually works
let mailError = configured ? 'Checking mail login...' : '';
async function initMail() {
  if (!configured) return;
  let last;
  for (const port of ports) {
    const t = makeTransport(port);
    try { await t.verify(); mailer = t; mailError = ''; console.log(`SMTP login OK (${SMTP_HOST}:${port}) as ${SMTP_USER}`); return; }
    catch (e) { last = e; if (e.code === 'EAUTH') break; } // wrong password: another port will not help
  }
  mailError = niceError(last);
  console.error('SMTP check failed:', mailError);
}
initMail();
const google = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const store = new Map(); // "email|purpose" -> { h, exp, tries, last }
const hash = (c) => crypto.createHash('sha256').update(c).digest('hex');
const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const WHY = { signup: 'verify your email', reset: 'reset your password', code: 'log in', login: 'log in' };

app.get('/api/health', (_q, r) => r.json({ mail: !!mailer, configured, mailError, google: !!google }));

app.post('/api/otp/send', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const purpose = String(req.body.purpose || 'login');
  if (!okEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  const k = `${email}|${purpose}`, old = store.get(k);
  if (old && Date.now() - old.last < 30000) return res.status(429).json({ error: 'Please wait 30 seconds before asking for another code.' });
  const code = String(crypto.randomInt(100000, 1000000));
  store.set(k, { h: hash(code), exp: Date.now() + 10 * 60000, tries: 0, last: Date.now() });
  if (!configured) { console.log(`[DEV OTP] ${email} (${purpose}): ${code}`); return res.json({ ok: true, sent: false, devCode: code }); }
  if (!mailer) await initMail(); // retry (e.g. internet came back after server start)
  if (!mailer) { store.delete(k); return res.status(502).json({ error: mailError || 'Mail server is not ready.' }); }
  try {
    await mailer.sendMail({
      from: MAIL_FROM, to: email, subject: `FieldShift code: ${code}`,
      text: `Your FieldShift code to ${WHY[purpose] || 'continue'} is ${code}. It expires in 10 minutes. If you did not ask for it, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif"><h2>🌾 FieldShift</h2><p>Use this code to ${WHY[purpose] || 'continue'}:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>Expires in 10 minutes. If you did not ask for it, ignore this email.</p></div>`,
    });
    res.json({ ok: true, sent: true });
  } catch (e) {
    console.error('Mail error:', e.message);
    mailer = null; // force a fresh check on the next try
    store.delete(k); // do not make the user wait 30s after a failed send
    const why = niceError(e);
    res.status(502).json({ error: why });
  }
});

app.post('/api/otp/verify', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const k = `${email}|${req.body.purpose || 'login'}`, o = store.get(k);
  if (!o || Date.now() > o.exp) return res.status(400).json({ error: 'Code expired. Ask for a new one.' });
  if (++o.tries > 5) { store.delete(k); return res.status(429).json({ error: 'Too many attempts. Ask for a new code.' }); }
  if (hash(String(req.body.code || '').trim()) !== o.h) return res.status(400).json({ error: 'Wrong code. Try again.' });
  store.delete(k);
  res.json({ ok: true });
});

app.post('/api/google', async (req, res) => {
  if (!google) return res.status(501).json({ error: 'Google sign-in is not configured (GOOGLE_CLIENT_ID).' });
  try {
    const t = await google.verifyIdToken({ idToken: req.body.credential, audience: GOOGLE_CLIENT_ID });
    const p = t.getPayload();
    if (!p.email_verified) return res.status(400).json({ error: 'Google email is not verified.' });
    res.json({ email: p.email, name: p.name || p.email.split('@')[0], picture: p.picture });
  } catch { res.status(401).json({ error: 'Google sign-in failed. Try again.' }); }
});

app.listen(PORT, () => console.log(`FieldShift API on :${PORT} | email: ${configured ? 'SMTP configured' : 'DEV mode (no SMTP in .env; code shown in app + this terminal)'} | google: ${google ? 'on' : 'demo chooser'}`));
