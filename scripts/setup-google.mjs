// One-time helper:  npm run setup:google
// Saves your Google OAuth Client ID into .env (both names) so "Continue with Google" becomes real.
import readline from 'node:readline/promises';
import fs from 'node:fs';

console.log(`
FieldShift Google sign-in setup (about 5 minutes, free)
  1. Open https://console.cloud.google.com/ and create/select a project.
  2. APIs & Services > OAuth consent screen: choose External, fill app name + your email, Save.
     (Under "Test users" add your own Gmail while the app is in Testing mode.)
  3. APIs & Services > Credentials > Create credentials > OAuth client ID > "Web application".
  4. Authorised JavaScript origins: add BOTH
         http://localhost:5173
         http://localhost
     (No redirect URI is needed.)
  5. Create, then copy the Client ID (ends with .apps.googleusercontent.com).
`);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const id = (await rl.question('Paste Client ID: ')).trim().replace(/^["']|["']$/g, '');
rl.close();
if (!/^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(id)) {
  console.error('\nThat does not look like a Google Client ID. It should look like 1234567890-abc123.apps.googleusercontent.com (not the Client Secret).');
  process.exit(1);
}
const upsert = (t, k, v) => (new RegExp(`^${k}=.*$`, 'm').test(t) ? t.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`) : t + `\n${k}=${v}`);
let env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : fs.existsSync('.env.example') ? fs.readFileSync('.env.example', 'utf8') : '';
env = upsert(upsert(env, 'GOOGLE_CLIENT_ID', id), 'VITE_GOOGLE_CLIENT_ID', id);
fs.writeFileSync('.env', env);
console.log('\nSaved to .env. Now STOP the app (Ctrl+C) and start it again:  npm run dev\nThen open http://localhost:5173 (use exactly this address) and hard-refresh (Ctrl+Shift+R).');
