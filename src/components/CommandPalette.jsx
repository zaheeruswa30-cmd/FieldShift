import { useEffect, useRef, useState } from 'react';
import { REGIONS } from '../data/regions.js';

export default function CommandPalette({ open, onClose, onPick, placeholder }) {
  const [q, setQ] = useState(''), ref = useRef();
  useEffect(() => { if (open) { setQ(''); setTimeout(() => ref.current?.focus(), 30); } }, [open]);
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', h); return () => removeEventListener('keydown', h); }, []);
  if (!open) return null;
  const m = q.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  const list = REGIONS.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
  const go = (fn) => { fn(); onClose(); };
  return (
    <div className="cmd-bg" onClick={onClose}>
      <div className="cmd" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search locations">
        <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
        {m && <button onClick={() => go(() => onPick(+m[1], +m[3]))}>Analyse {m[1]}, {m[3]}</button>}
        {list.map((r) => <button key={r.id} onClick={() => go(() => onPick(r.lat, r.lon, r.name, r))}>{r.name}</button>)}
      </div>
    </div>
  );
}
