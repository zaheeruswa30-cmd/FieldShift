import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Eye, EyeOff, ArrowLeft, ShieldCheck, Satellite, Wheat, Bell } from 'lucide-react';
import { signUp, logIn, resetPassword, knownAccounts, validEmail, sendOtp, verifyOtp, otpLogin, googleSignIn, verifyGoogleToken, setPasswordFor } from '../services/auth.js';

const GID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const strength = (p) => [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
const TITLES = { login: 'Welcome back', signup: 'Create your account', reset: 'Reset your password', code: 'Log in with a code' };

export default function AuthPage({ onAuth, onBack, prefill = '', startMode = 'login' }) {
  const [mode, setMode] = useState(startMode), [step, setStep] = useState('form'); // form | otp | gpass | gdemo
  const [f, setF] = useState({ name: '', email: prefill, password: '', confirm: '', role: 'Farmer', farm: '' });
  const [show, setShow] = useState(false), [err, setErr] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const [code, setCode] = useState(''), [dev, setDev] = useState(''), [gUser, setGUser] = useState(null), [health, setHealth] = useState(null), gref = useRef();
  const [cool, setCool] = useState(0);
  useEffect(() => { if (cool <= 0) return; const id = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(id); }, [cool]);
  useEffect(() => { fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => setHealth(false)); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const accts = knownAccounts(), st = strength(f.password);
  const go = (m) => { setMode(m); setStep('form'); setErr(''); setMsg(''); setCode(''); setDev(''); };
  const pwStep = mode === 'login' || (mode === 'signup' && step === 'form') || (mode === 'reset' && step === 'otp') || step === 'gpass';
  const confirmStep = (mode !== 'login' && pwStep) || step === 'gpass';

  async function finishGoogle(p) {
    const u = await googleSignIn(p);
    if (u.noPassword) { setGUser(u); setF((x) => ({ ...x, password: '', confirm: '' })); setStep('gpass'); setErr(''); setMsg(`Signed in with Google as ${u.email}. Set a password so you can also log in with email.`); }
    else onAuth(u);
  }
  useEffect(() => {
    if (!GID || step !== 'form' || mode === 'reset' || mode === 'code') return;
    const init = () => {
      if (!window.google || !gref.current) return;
      window.google.accounts.id.initialize({ client_id: GID, callback: async (r) => { try { await finishGoogle(await verifyGoogleToken(r.credential)); } catch (x) { setErr(x.message); } } });
      window.google.accounts.id.renderButton(gref.current, { theme: 'filled_black', size: 'large', width: 340, text: 'continue_with' });
    };
    if (window.google) init();
    else { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init; document.head.appendChild(s); }
  }, [mode, step]);

  async function ask() {
    if (!validEmail(f.email.trim())) throw new Error('Enter a valid email address.');
    if (mode === 'reset' && !accts.some((a) => a.email === f.email.trim().toLowerCase())) throw new Error('No account with this email on this device. Use "Create account" or "Email me a login code".');
    const r = await sendOtp(f.email.trim(), mode);
    setDev(r.devCode || ''); setCode(''); setCool(30); setStep('otp'); setMsg(r.sent ? `We emailed a 6-digit code to ${f.email.trim()}.` : '');
  }
  async function submit(e) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try {
      if (step === 'gpass') { if (f.password !== f.confirm) throw new Error('Passwords do not match.'); onAuth(await setPasswordFor(gUser.email, f.password)); return; }
      if (step === 'gdemo') { await finishGoogle({ name: f.name.trim(), email: f.email }); return; }
      if (mode === 'login') { onAuth(await logIn(f.email, f.password)); return; }
      if (step === 'form') {
        if (mode === 'signup') {
          if (!f.name.trim()) throw new Error('Enter your name.');
          if (f.password.length < 8) throw new Error('Password must be at least 8 characters.');
          if (f.password !== f.confirm) throw new Error('Passwords do not match.');
        }
        await ask(); return;
      }
      if (reset_needs_pw() && f.password !== f.confirm) throw new Error('Passwords do not match.');
      await verifyOtp(f.email, code, mode);
      if (mode === 'signup') onAuth(await signUp(f));
      else if (mode === 'code') onAuth(await otpLogin(f.email));
      else { await resetPassword(f.email, f.password); setF({ ...f, password: '', confirm: '' }); go('login'); setMsg('Password updated. Log in with your new password.'); }
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  const reset_needs_pw = () => mode === 'reset';
  async function resend() { setErr(''); setBusy(true); try { await ask(); setMsg('A new code was sent.'); } catch (x) { setErr(x.message); } setBusy(false); }
  async function demo() {
    setBusy(true);
    try { onAuth(await logIn('demo@fieldshift.app', 'demo12345')); }
    catch { try { onAuth(await signUp({ name: 'Demo Farmer', email: 'demo@fieldshift.app', password: 'demo12345', role: 'Farmer', farm: 'Demo farm' })); } catch (x) { setErr(x.message); } }
    setBusy(false);
  }
  const label = step === 'gpass' ? 'Save password' : step === 'gdemo' ? 'Continue' : step === 'otp' ? (mode === 'reset' ? 'Update password' : 'Verify & continue') : mode === 'login' ? 'Log in' : mode === 'signup' ? 'Send verification code' : 'Send me a code';
  const title = step === 'gpass' ? 'Set a password (optional)' : step === 'gdemo' ? 'Choose a Google account' : TITLES[mode];

  return (
    <div className="auth">
      <aside className="auth-side">
        <button className="chip" onClick={onBack}><ArrowLeft size={15} /> Home</button>
        <div><p className="brand"><Sprout size={26} /> FieldShift</p>
          <h1>Your farm’s climate, read from space.</h1>
          <ul className="perks">
            <li><Satellite size={18} /> 25 years of NASA climate records for your exact location</li>
            <li><Wheat size={18} /> Crop choices and sowing dates adapted to the shift</li>
            <li><Bell size={18} /> Heat, drought and flood alerts saved to your account</li>
            <li><ShieldCheck size={18} /> Your farms, plans and settings stay in your account</li>
          </ul></div>
        <small>Demo build: accounts are stored in this browser only.</small>
      </aside>
      <motion.form className="auth-card" onSubmit={submit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} noValidate>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'on' : ''} onClick={() => go('login')}>Log in</button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => go('signup')}>Create account</button>
        </div>
        <h2>{title}</h2>
        {accts.length > 0 && mode === 'login' && step === 'form' && (
          <div className="acct-list"><small>Accounts on this device</small>
            {accts.map((a) => <button type="button" key={a.email} className="acct" onClick={() => setF({ ...f, email: a.email })}><i style={{ background: a.color }}>{a.name[0]}</i>{a.name}<em>{a.email}</em></button>)}</div>
        )}
        <AnimatePresence initial={false}>
          {mode === 'signup' && step === 'form' && (
            <motion.div key="su" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="fields">
              <label className="field">Full name<input value={f.name} onChange={set('name')} autoComplete="name" /></label>
              <div className="row2">
                <label className="field">I am a<select value={f.role} onChange={set('role')}>{['Farmer', 'Extension officer', 'Student / researcher', 'Agri-business'].map((r) => <option key={r}>{r}</option>)}</select></label>
                <label className="field">Farm name (optional)<input value={f.farm} onChange={set('farm')} /></label>
              </div>
            </motion.div>)}
        </AnimatePresence>
        {step === 'gdemo' && <label className="field">Google name<input value={f.name} onChange={set('name')} /></label>}
        {step !== 'gpass' && <label className="field">Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" disabled={step === 'otp'} /></label>}
        {step === 'otp' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <label className="field">6-digit code<input className="otp" inputMode="numeric" maxLength={6} autoFocus autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" /></label>
            {dev && <p className="devbox">📬 Dev inbox: your code is <b>{dev}</b><small>Email sending is not set up yet, so this code is shown here for testing. To get real emails: stop the app, run <b>npm run setup:mail</b> (Gmail + App Password), then start <b>npm run dev</b> again.</small></p>}
            <div className="alt"><button type="button" onClick={resend} disabled={busy || cool > 0}>{cool > 0 ? `Resend in ${cool}s` : 'Resend code'}</button><button type="button" onClick={() => { setStep('form'); setMsg(''); setDev(''); }}>Change email</button></div>
          </motion.div>)}
        {pwStep && (
          <label className="field">{mode === 'reset' ? 'New password' : 'Password'}
            <span className="pw"><input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" className="icon" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>)}
        {confirmStep && <>
          <div className="meter" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={i < st ? 'on s' + st : ''} />)}</div>
          <label className="field">Confirm password<input type={show ? 'text' : 'password'} value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /></label></>}
        {err && <p className="err" role="alert">{err}</p>}{msg && <p className="ok" role="status">{msg}</p>}
        <button className="btn full" disabled={busy || (step === 'otp' && code.length < 6)}>{busy ? 'Please wait…' : label}</button>
        {step === 'gpass' && <button type="button" className="chip demo" onClick={() => onAuth(gUser)}>Skip for now</button>}
        {step === 'gdemo' && <button type="button" className="chip demo" onClick={() => go(mode)}>Cancel</button>}
        <div className="alt">
          {mode === 'login' && step === 'form' && <><button type="button" onClick={() => go('reset')}>Forgot password?</button><button type="button" onClick={() => go('code')}>Email me a login code</button></>}
          {mode === 'signup' && step === 'form' && <button type="button" onClick={() => go('login')}>Already have an account? Log in</button>}
          {(mode === 'reset' || mode === 'code') && <button type="button" onClick={() => go('login')}>Back to log in</button>}
        </div>
        {step === 'form' && (mode === 'login' || mode === 'signup') && <>
          <div className="or"><span>or</span></div>
          {GID ? <div ref={gref} className="gbtn" /> : <button type="button" className="gdemo" onClick={() => { setStep('gdemo'); setErr(''); setMsg(''); }}><b>G</b> Continue with Google</button>}
          {!GID && <small className="gnote">This is a demo Google chooser (no real Google login yet). For real Google sign-in: stop the app, run <b>npm run setup:google</b>, then start <b>npm run dev</b> again.</small>}
          {GID && health === false && <small className="gnote warn">Server is not running. Stop and run <b>npm run dev</b> again.</small>}
          {GID && health && !health.google && <small className="gnote warn">Server has no Google ID yet. Stop the app and start <b>npm run dev</b> again after saving .env.</small>}
          {GID && <small className="gnote">If the Google button shows an error, add <b>{window.location.origin}</b> (and <b>http://localhost</b>) under Authorised JavaScript origins in Google Cloud Console.</small>}
        </>}
        {mode === 'login' && step === 'form' && <button type="button" className="chip demo" onClick={demo} disabled={busy}>Try the demo account</button>}
      </motion.form>
    </div>
  );
}
