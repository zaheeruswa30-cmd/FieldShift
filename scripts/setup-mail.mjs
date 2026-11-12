// One-time helper:  npm run setup:mail
// Asks for your email + App Password, sends a TEST email (trying a backup port if needed),
// and only if it works writes the values into .env.
import readline from 'node:readline/promises';
import fs from 'node:fs';
import nodemailer from 'nodemailer';

const PROVIDERS = {
  1: { name: 'Gmail', host: 'smtp.gmail.com', port: 587, backup: 465 },
  2: { name: 'Outlook / Hotmail', host: 'smtp-mail.outlook.com', port: 587 },
  3: { name: 'Brevo (free 300 emails/day)', host: 'smtp-relay.brevo.com', port: 587 },
  4: { name: 'Other (enter host yourself)', host: '', port: 587 },
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log(`
FieldShift email setup (real OTP emails)

Gmail (most common) - 2 minutes:
  1. Open https://myaccount.google.com/security and turn ON "2-Step Verification".
  2. Open https://myaccount.google.com/apppasswords , create an app password named FieldShift.
  3. Copy the 16 letters Google shows (spaces are fine).
`);
console.log('Mail provider:'); Object.entries(PROVIDERS).forEach(([k, v]) => console.log(`  ${k}) ${v.name}`));
const pick = PROVIDERS[(await rl.question('Choose [1]: ')).trim() || '1'] || PROVIDERS[1];
let { host, port } = pick;
if (!host) { host = (await rl.question('SMTP host: ')).trim(); port = +(await rl.question('SMTP port [587]: ')) || 587; }
const user = (await rl.question('Login email/username: ')).trim();
const pass = (await rl.question('App password / SMTP key: ')).replace(/\s+/g, '');
const from = (await rl.question(`Sender address shown on emails [${user}]: `)).trim() || user;
const to = (await rl.question(`Send a test email to [${user}]: `)).trim() || user;
rl.close();

const attempt = async (p) => {
  const t = nodemailer.createTransport({ host, port: p, secure: p === 465, auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000 });
  await t.verify();
  await t.sendMail({ from: `FieldShift <${from}>`, to, subject: 'FieldShift email works', text: 'Your FieldShift OTP emails are now set up.' });
};
let used = null, lastErr;
for (const p of [port, pick.backup].filter(Boolean)) {
  try { process.stdout.write(`\nTrying ${host}:${p} ... `); await attempt(p); console.log('OK'); used = p; break; }
  catch (e) { lastErr = e; console.log('failed'); if (e.code === 'EAUTH') break; }
}
if (!used) {
  console.error('\nFailed:', lastErr.code === 'EAUTH'
    ? 'Login rejected. For Gmail use the 16-letter App Password (NOT your normal password) and make sure 2-Step Verification is ON.'
    : ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS'].includes(lastErr.code)
      ? 'Could not reach the mail server. Check internet/VPN/firewall, or try a different network (e.g. mobile hotspot).' : lastErr.message);
  process.exit(1);
}

const upsert = (txt, k, v) => (new RegExp(`^${k}=.*$`, 'm').test(txt) ? txt.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`) : txt + `\n${k}=${v}`);
let env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : fs.existsSync('.env.example') ? fs.readFileSync('.env.example', 'utf8') : '';
env = upsert(env, 'SMTP_HOST', host); env = upsert(env, 'SMTP_PORT', String(used));
env = upsert(env, 'SMTP_USER', user); env = upsert(env, 'SMTP_PASS', pass); env = upsert(env, 'MAIL_FROM', `FieldShift <${from}>`);
fs.writeFileSync('.env', env);
console.log(`\nDone. Test email sent to ${to} and .env updated.\nNow STOP the app (Ctrl+C) and start it again:  npm run dev`);
