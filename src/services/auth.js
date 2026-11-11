// DEMO AUTH: accounts live only in this browser (localStorage). Passwords are salted + SHA-256 hashed,
// but there is no server, so this is NOT production security. Swap these functions for a real backend later.
const K = { users: 'fieldshift:users', session: 'fieldshift:session' };
const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const wr = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const COLORS = ['#e8b04a', '#3cc3b0', '#5fd39a', '#e0644f', '#8aa8ff', '#c58af9'];
const DEF_PREFS = { lang: 'en', theme: 'dark', farmer: false, region: 'sindh', notify: true, motion: true };
const rand = () => Math.random().toString(36).slice(2, 10);
async function hash(pw, salt) {
  const s = salt + pw;
  if (!globalThis.crypto?.subtle) return btoa(unescape(encodeURIComponent(s)));
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const pub = (u) => { if (!u) return null; const { hash: _h, salt: _s, ...r } = u; return r; };
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const currentUser = () => { const s = rd(K.session, null); return s ? pub(rd(K.users, {})[s]) : null; };
export const knownAccounts = () => Object.values(rd(K.users, {})).map(({ name, email, color }) => ({ name, email, color }));

export async function signUp({ name, email, password, role, farm }) {
  email = (email || '').trim().toLowerCase();
  const us = rd(K.users, {});
  if (!name?.trim()) throw new Error('Enter your name.');
  if (!validEmail(email)) throw new Error('Enter a valid email address.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (us[email]) throw new Error('An account with this email already exists. Log in instead.');
  const salt = rand();
  us[email] = { name: name.trim(), email, salt, hash: await hash(password, salt), role: role || 'Farmer', farm: farm || '', color: COLORS[Object.keys(us).length % COLORS.length], created: Date.now(), prefs: { ...DEF_PREFS } };
  wr(K.users, us); wr(K.session, email);
  return pub(us[email]);
}
export async function logIn(email, password) {
  email = (email || '').trim().toLowerCase();
  const u = rd(K.users, {})[email];
  if (!u || (await hash(password, u.salt)) !== u.hash) throw new Error('Email or password is incorrect.');
  wr(K.session, email);
  return pub(u);
}
export const logOut = () => localStorage.removeItem(K.session);
export function updateUser(email, patch) {
  const us = rd(K.users, {}); us[email] = { ...us[email], ...patch }; wr(K.users, us); return pub(us[email]);
}
export async function changePassword(email, oldPw, newPw) {
  const us = rd(K.users, {}), u = us[email];
  if ((await hash(oldPw, u.salt)) !== u.hash) throw new Error('Current password is incorrect.');
  if (newPw.length < 8) throw new Error('New password must be at least 8 characters.');
  u.salt = rand(); u.hash = await hash(newPw, u.salt); wr(K.users, us);
}
// Demo reset: no email is sent. It only proves the flow; a real backend would verify by email link.
export async function resetPassword(email, newPw) {
  email = (email || '').trim().toLowerCase();
  const us = rd(K.users, {}), u = us[email];
  if (!u) throw new Error('No account found with this email.');
  if (newPw.length < 8) throw new Error('Password must be at least 8 characters.');
  u.salt = rand(); u.hash = await hash(newPw, u.salt); wr(K.users, us);
}
export function deleteAccount(email) {
  const us = rd(K.users, {}); delete us[email]; wr(K.users, us);
  localStorage.removeItem('fieldshift:data:' + email); logOut();
}
const DK = (e) => 'fieldshift:data:' + e, EMPTY = { farms: [], tasks: [], read: [] };
export const loadData = (email) => ({ ...EMPTY, ...rd(DK(email), {}) });
export const saveData = (email, d) => wr(DK(email), d);
export const exportData = (email) => ({ account: pub(rd(K.users, {})[email]), data: loadData(email) });
