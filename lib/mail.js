import nodemailer from 'nodemailer';

const clean = (v) => String(v || '').trim().replace(/^["']|["']$/g, '');
export const SMTP_HOST = clean(process.env.SMTP_HOST) || 'smtp.gmail.com';
const SMTP_PORT = +clean(process.env.SMTP_PORT) || 587;
export const SMTP_USER = clean(process.env.SMTP_USER);
const SMTP_PASS = clean(process.env.SMTP_PASS).replace(/\s+/g, '');
export const MAIL_FROM = clean(process.env.MAIL_FROM) || SMTP_USER;
export const configured = !!SMTP_USER && !/your@|youremail|example\.com|xxxx/i.test(SMTP_USER) && SMTP_PASS.length > 0;

const ports = [SMTP_PORT, ...(SMTP_HOST === 'smtp.gmail.com' ? [SMTP_PORT === 587 ? 465 : 587] : [])];
const transport = (port) => nodemailer.createTransport({
  host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS },
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
});

export const niceError = (e) => e.code === 'EAUTH'
  ? 'Login rejected. For Gmail you must use a 16-letter App Password (2-Step Verification ON), not your normal password.'
  : ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'ECONNREFUSED'].includes(e.code)
    ? `Could not reach ${SMTP_HOST}.` : e.message;

export async function sendMail(message) {
  let last;
  for (const port of ports) {
    try { return await transport(port).sendMail({ from: MAIL_FROM, ...message }); }
    catch (e) { last = e; if (e.code === 'EAUTH') break; }
  }
  throw last;
}
