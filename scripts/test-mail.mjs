// npm run test:mail  -> checks the SMTP values in .env and sends one test email. Prints exactly what is wrong.
import 'dotenv/config';
import nodemailer from 'nodemailer';
const c = (v) => String(v || '').trim().replace(/^["']|["']$/g, '');
const host = c(process.env.SMTP_HOST) || 'smtp.gmail.com', port = +c(process.env.SMTP_PORT) || 587;
const user = c(process.env.SMTP_USER), pass = c(process.env.SMTP_PASS).replace(/\s+/g, '');
if (!user || !pass || /your@/i.test(user)) { console.error('SMTP_USER / SMTP_PASS are empty in .env. Run: npm run setup:mail'); process.exit(1); }
const ports = [...new Set([port, ...(host === 'smtp.gmail.com' ? [587, 465] : [])])];
let ok = false;
for (const p of ports) {
  try {
    const t = nodemailer.createTransport({ host, port: p, secure: p === 465, auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000 });
    await t.verify();
    await t.sendMail({ from: c(process.env.MAIL_FROM) || user, to: user, subject: 'FieldShift test', text: 'SMTP works.' });
    console.log(`OK: test email sent to ${user} via ${host}:${p}. Restart "npm run dev" if it was already running.`); ok = true; break;
  } catch (e) { console.log(`${host}:${p} failed -> ${e.code || ''} ${e.message}`); if (e.code === 'EAUTH') break; }
}
if (!ok) { console.error('\nTip: Gmail needs a 16-letter App Password (2-Step Verification ON). Try a different network if ports are blocked.'); process.exit(1); }
