// Stateless one-time codes for Vercel (serverless functions cannot keep a Map in memory).
// The 6-digit code is derived from OTP_SECRET + email + purpose + a 10-minute time window,
// so any function instance can create and later verify it without a database.
import crypto from 'node:crypto';

const WINDOW = 10 * 60 * 1000;
const win = () => Math.floor(Date.now() / WINDOW);

function codeFor(email, purpose, w) {
  const h = crypto.createHmac('sha256', process.env.OTP_SECRET || '').update(`${email}|${purpose}|${w}`).digest();
  return String(100000 + (h.readUInt32BE(0) % 900000));
}

export const hasSecret = () => !!process.env.OTP_SECRET;
export const makeCode = (email, purpose) => codeFor(email, purpose, win());
export function checkCode(email, purpose, code) {
  const c = String(code || '').trim();
  const w = win();
  return [w, w - 1].some((x) => {
    const good = codeFor(email, purpose, x);
    return good.length === c.length && crypto.timingSafeEqual(Buffer.from(good), Buffer.from(c));
  });
}
