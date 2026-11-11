import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Eye, EyeOff, ArrowLeft, ShieldCheck, Satellite, Wheat, Bell } from 'lucide-react';
import { signUp, logIn, resetPassword, knownAccounts } from '../services/auth.js';

const strength = (p) => [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
const TITLES = { login: 'Welcome back', signup: 'Create your account', reset: 'Reset your password' };

export default function AuthPage({ onAuth, onBack, prefill = '', startMode = 'login' }) {
  const [mode, setMode] = useState(startMode);
  const [f, setF] = useState({ name: '', email: prefill, password: '', confirm: '', role: 'Farmer', farm: '' });
  const [show, setShow] = useState(false), [err, setErr] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const accts = knownAccounts(), st = strength(f.password);
  const go = (m) => { setMode(m); setErr(''); setMsg(''); };

  async function submit(e) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try {
      if (mode === 'signup') { if (f.password !== f.confirm) throw new Error('Passwords do not match.'); onAuth(await signUp(f)); }
      else if (mode === 'login') onAuth(await logIn(f.email, f.password));
      else {
        if (f.password !== f.confirm) throw new Error('Passwords do not match.');
        await resetPassword(f.email, f.password); setF({ ...f, password: '', confirm: '' }); setMode('login'); setMsg('Password updated. Log in with your new password.');
      }
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  async function demo() {
    setBusy(true);
    try { onAuth(await logIn('demo@fieldshift.app', 'demo12345')); }
    catch { try { onAuth(await signUp({ name: 'Demo Farmer', email: 'demo@fieldshift.app', password: 'demo12345', role: 'Farmer', farm: 'Demo farm' })); } catch (x) { setErr(x.message); } }
    setBusy(false);
  }

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
        <h2>{TITLES[mode]}</h2>
        {accts.length > 0 && mode === 'login' && (
          <div className="acct-list"><small>Accounts on this device</small>
            {accts.map((a) => <button type="button" key={a.email} className="acct" onClick={() => setF({ ...f, email: a.email })}><i style={{ background: a.color }}>{a.name[0]}</i>{a.name}<em>{a.email}</em></button>)}</div>
        )}
        <AnimatePresence initial={false}>
          {mode === 'signup' && (
            <motion.div key="su" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="fields">
              <label className="field">Full name<input value={f.name} onChange={set('name')} autoComplete="name" /></label>
              <div className="row2">
                <label className="field">I am a<select value={f.role} onChange={set('role')}>{['Farmer', 'Extension officer', 'Student / researcher', 'Agri-business'].map((r) => <option key={r}>{r}</option>)}</select></label>
                <label className="field">Farm name (optional)<input value={f.farm} onChange={set('farm')} /></label>
              </div>
            </motion.div>)}
        </AnimatePresence>
        <label className="field">Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
        <label className="field">{mode === 'reset' ? 'New password' : 'Password'}
          <span className="pw"><input type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            <button type="button" className="icon" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
        {mode !== 'login' && <>
          <div className="meter" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={i < st ? 'on s' + st : ''} />)}</div>
          <label className="field">Confirm password<input type={show ? 'text' : 'password'} value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /></label></>}
        {err && <p className="err" role="alert">{err}</p>}{msg && <p className="ok" role="status">{msg}</p>}
        <button className="btn full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Update password'}</button>
        <div className="alt">
          {mode === 'login' && <><button type="button" onClick={() => go('reset')}>Forgot password?</button><button type="button" onClick={() => go('signup')}>New here? Create account</button></>}
          {mode === 'signup' && <button type="button" onClick={() => go('login')}>Already have an account? Log in</button>}
          {mode === 'reset' && <button type="button" onClick={() => go('login')}>Back to log in</button>}
        </div>
        {mode !== 'reset' && <button type="button" className="chip demo" onClick={demo} disabled={busy}>Try the demo account</button>}
      </motion.form>
    </div>
  );
}
