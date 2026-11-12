import { OAuth2Client } from 'google-auth-library';

const clean = (v) => String(v || '').trim().replace(/^["']|["']$/g, '');
const GOOGLE_CLIENT_ID = clean(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!GOOGLE_CLIENT_ID) return res.status(501).json({ error: 'Google sign-in is not configured (GOOGLE_CLIENT_ID).' });
  try {
    const t = await new OAuth2Client(GOOGLE_CLIENT_ID).verifyIdToken({ idToken: (req.body || {}).credential, audience: GOOGLE_CLIENT_ID });
    const p = t.getPayload();
    if (!p.email_verified) return res.status(400).json({ error: 'Google email is not verified.' });
    res.json({ email: p.email, name: p.name || p.email.split('@')[0], picture: p.picture });
  } catch {
    res.status(401).json({ error: 'Google sign-in failed. Try again.' });
  }
}
