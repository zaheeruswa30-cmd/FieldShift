import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { GitCompare } from 'lucide-react';
import { REGIONS, nearest } from '../data/regions.js';
import { loadClimate } from '../services/nasa.js';
import { analyze } from '../utils/model.js';
import { Card } from '../components/Panels.jsx';

export default function Compare({ farms, dT, dR }) {
  const all = useMemo(() => [...REGIONS, ...farms.map((f) => ({ id: f.id, name: f.name + ' (my farm)', lat: f.lat, lon: f.lon, params: nearest(f.lat, f.lon).params }))], [farms]);
  const [sel, setSel] = useState(REGIONS.slice(0, 3).map((r) => r.id)), [res, setRes] = useState({}), [busy, setBusy] = useState(true);
  useEffect(() => {
    let ok = true; setBusy(true);
    Promise.all(all.filter((r) => sel.includes(r.id)).map(async (r) => { const d = await loadClimate(r); return [r.id, { src: d.source, ...analyze(d.rows, dT, dR) }]; }))
      .then((es) => { if (ok) { setRes(Object.fromEntries(es)); setBusy(false); } });
    return () => { ok = false; };
  }, [sel, dT, dR, all]);
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 4 ? [...s, id] : s));
  const rows = all.filter((r) => res[r.id] && sel.includes(r.id)).map((r) => ({ ...r, ...res[r.id] }));
  const colour = (h) => (h > 60 ? '#5fd39a' : h > 35 ? '#e8b04a' : '#e0644f');
  return (
    <div className="grid">
      <Card title="Choose up to 4 places" icon={GitCompare} wide>
        <div className="picks">{all.map((r) => <label key={r.id} className={'pick' + (sel.includes(r.id) ? ' on' : '')}><input type="checkbox" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} />{r.name}</label>)}</div>
        <p className="hint">Uses the warming / rainfall values from the what-if bar on the dashboard (currently +{dT}°C, {dR > 0 ? '+' : ''}{dR}% rain).</p>
      </Card>
      <Card title="Farm health score" icon={GitCompare}>
        {busy ? <p className="hint">Fetching NASA data…</p> : <div className="chart"><ResponsiveContainer><BarChart data={rows.map((r) => ({ n: r.name.split(' –')[0].split(',')[0], h: r.health }))}>
          <CartesianGrid stroke="#ffffff14" /><XAxis dataKey="n" stroke="#9db3a6" /><YAxis domain={[0, 100]} stroke="#9db3a6" /><Tooltip contentStyle={{ background: '#10201a', border: '1px solid #2c4a3d' }} />
          <Bar dataKey="h" name="Health" radius={[8, 8, 0, 0]}>{rows.map((r) => <Cell key={r.id} fill={colour(r.health)} />)}</Bar></BarChart></ResponsiveContainer></div>}
      </Card>
      <Card title="Side by side" icon={GitCompare}>
        <div className="tbl-w"><table className="tbl"><thead><tr><th>Place</th><th>Warming</th><th>Rain mm</th><th>Hot days</th><th>Best crop</th><th>Data</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td>{r.name.split(' –')[0]}</td><td>+{r.kpis[1].v.toFixed(1)}°C</td><td>{Math.round(r.rain)}</td><td>{Math.round(r.heat)}</td><td>{r.crops[0].emoji} {r.crops[0].name}</td><td>{r.src === 'sample' ? 'sample' : 'NASA'}</td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
