import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Tractor, LogOut, UserPlus, Repeat } from 'lucide-react';

export default function UserMenu({ user, accounts, onNav, onSwitch, onAdd, onLogout }) {
  const [open, setOpen] = useState(false), ref = useRef();
  useEffect(() => { const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); }; addEventListener('mousedown', h); return () => removeEventListener('mousedown', h); }, []);
  const ini = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const run = (fn) => () => { setOpen(false); fn(); };
  const others = accounts.filter((a) => a.email !== user.email);
  return (
    <div className="um" ref={ref}>
      <button className="avatar" style={{ background: user.color }} onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} title={user.name}>{ini(user.name)}</button>
      <AnimatePresence>
        {open && (
          <motion.div className="menu" role="menu" initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}>
            <div className="menu-h"><b>{user.name}</b><small>{user.email}</small><small>{user.role}{user.farm ? ` · ${user.farm}` : ''}</small></div>
            <button role="menuitem" onClick={run(() => onNav('settings'))}><Settings size={15} /> Profile & settings</button>
            <button role="menuitem" onClick={run(() => onNav('farms'))}><Tractor size={15} /> My farms</button>
            {others.length > 0 && <div className="menu-s"><small>Switch account</small>
              {others.map((a) => <button key={a.email} role="menuitem" onClick={run(() => onSwitch(a.email))}><i style={{ background: a.color }}>{a.name[0]}</i>{a.name}</button>)}</div>}
            <button role="menuitem" onClick={run(onAdd)}><UserPlus size={15} /> Add another account</button>
            <button role="menuitem" className="danger" onClick={run(onLogout)}><LogOut size={15} /> Log out</button>
          </motion.div>)}
      </AnimatePresence>
    </div>
  );
}
