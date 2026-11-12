import { useState } from 'react';
import { Settings as Cog, User, SlidersHorizontal, Database, LogOut, Trash2, Download } from 'lucide-react';
import { REGIONS } from '../data/regions.js';
import { updateUser, changePassword, exportData } from '../services/auth.js';
import { Card } from '../components/Panels.jsx';

const Toggle = ({ label, hint, on, set }) => (
  <label className="tog"><span><b>{label}</b><small>{hint}</small></span><input type="checkbox" role="switch" checked={on} onChange={(e) => set(e.target.checked)} /></label>
);

export default function Settings({ user, setPref, app, onUser, onLogout, onDelete, onClear }) {
  const [tab, setTab] = useState('account');
  const [p, setP] = useState({ name: user.name, role: user.role, farm: user.farm || '' }), [pw, setPw] = useState({ old: '', n: '', c: '' }), [m, setM] = useState({});
  const pr = user.prefs || {};
  const saveProfile = (e) => { e.preventDefault(); if (!p.name.trim()) return setM({ err: 'Name cannot be empty.' }); onUser(updateUser(user.email, { name: p.name.trim(), role: p.role, farm: p.farm })); setM({ ok: 'Profile saved.' }); };
  const changePw = async (e) => { e.preventDefault(); try { if (pw.n !== pw.c) throw new Error('New passwords do not match.'); await changePassword(user.email, pw.old, pw.n); setPw({ old: '', n: '', c: '' }); setM({ ok: 'Password changed.' }); } catch (x) { setM({ err: x.message }); } };
  const exp = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(exportData(user.email), null, 2)], { type: 'application/json' })); a.download = 'fieldshift-my-data.json'; a.click(); };
  const tabs = [['account', User, 'Account'], ['prefs', SlidersHorizontal, 'Preferences'], ['data', Database, 'Data & privacy']];
  return (
    <div>
      <div className="tabs wide-tabs">{tabs.map(([id, Icon, l]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setM({}); }}><Icon size={15} /> {l}</button>)}</div>
      {m.ok && <p className="ok" role="status">{m.ok}</p>}{m.err && <p className="err" role="alert">{m.err}</p>}
      <div className="grid">
        {tab === 'account' && <>
          <Card title="Profile" icon={User}>
            <form className="stackf" onSubmit={saveProfile}>
              <label className="field">Full name<input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></label>
              <label className="field">Email<input value={user.email} disabled /></label>
              <div className="row2"><label className="field">Role<select value={p.role} onChange={(e) => setP({ ...p, role: e.target.value })}>{['Farmer', 'Extension officer', 'Student / researcher', 'Agri-business'].map((r) => <option key={r}>{r}</option>)}</select></label>
                <label className="field">Farm name<input value={p.farm} onChange={(e) => setP({ ...p, farm: e.target.value })} /></label></div>
              <button className="btn">Save profile</button>
            </form>
          </Card>
          <Card title="Password & session" icon={Cog}>
            <form className="stackf" onSubmit={changePw}>
              <label className="field">Current password<input type="password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} autoComplete="current-password" /></label>
              <label className="field">New password<input type="password" value={pw.n} onChange={(e) => setPw({ ...pw, n: e.target.value })} autoComplete="new-password" /></label>
              <label className="field">Confirm new password<input type="password" value={pw.c} onChange={(e) => setPw({ ...pw, c: e.target.value })} autoComplete="new-password" /></label>
              <button className="btn">Change password</button>
            </form>
            <button className="chip" onClick={onLogout}><LogOut size={14} /> Log out</button>
          </Card></>}
        {tab === 'prefs' && <>
          <Card title="Display" icon={SlidersHorizontal}>
            <label className="field">Language<select value={app.lang} onChange={(e) => setPref('lang', e.target.value)}><option value="en">English</option><option value="ur">اردو (Urdu)</option></select></label>
            <label className="field">Theme<select value={app.theme} onChange={(e) => setPref('theme', e.target.value)}><option value="dark">Dark</option><option value="light">Light</option></select></label>
            <label className="field">Default region<select value={pr.region || 'sindh'} onChange={(e) => setPref('region', e.target.value)}>{REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
          </Card>
          <Card title="Behaviour" icon={SlidersHorizontal}>
            <Toggle label="Farmer mode" hint="Bigger text, simpler dashboard" on={app.farmer} set={(v) => setPref('farmer', v)} />
            <Toggle label="Alert notifications" hint="Show unread alert badges" on={pr.notify !== false} set={(v) => setPref('notify', v)} />
            <Toggle label="Animations" hint="Turn off for a calmer, faster interface" on={pr.motion !== false} set={(v) => setPref('motion', v)} />
          </Card></>}
        {tab === 'data' && <>
          <Card title="Your data" icon={Database}>
            <p className="hint">Farms, plans and settings are stored in this browser for your account.</p>
            <button className="chip" onClick={exp}><Download size={14} /> Download my data (JSON)</button>
            <button className="chip" onClick={() => window.confirm('Remove all saved farms, tasks and alert history?') && onClear()}><Trash2 size={14} /> Clear saved farms & plans</button>
          </Card>
          <Card title="Danger zone" icon={Trash2}>
            <p className="hint">Deleting your account removes your profile and all saved data from this device.</p>
            <button className="chip danger" onClick={() => window.confirm('Delete your account permanently?') && onDelete()}><Trash2 size={14} /> Delete account</button>
          </Card></>}
      </div>
    </div>
  );
}
