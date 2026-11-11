import { useState } from 'react';
import { Trash2, Plus, ExternalLink, Tractor } from 'lucide-react';
import { CROPS } from '../data/crops.js';
import { Card } from '../components/Panels.jsx';

export default function Farms({ ud, save, region, onOpen }) {
  const [f, setF] = useState({ name: '', crop: 'wheat', area: '' });
  const add = (e) => {
    e.preventDefault(); if (!f.name.trim()) return;
    save((d) => ({ ...d, farms: [...d.farms, { id: String(Date.now()), name: f.name.trim(), crop: f.crop, area: +f.area || 0, lat: region.lat, lon: region.lon, place: region.name }] }));
    setF({ name: '', crop: 'wheat', area: '' });
  };
  return (
    <div className="grid">
      <Card title="Add a farm" icon={Plus}>
        <form className="stackf" onSubmit={add}>
          <label className="field">Farm name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. North field" /></label>
          <div className="row2">
            <label className="field">Main crop<select value={f.crop} onChange={(e) => setF({ ...f, crop: e.target.value })}>{CROPS.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}</select></label>
            <label className="field">Area (hectares)<input type="number" min="0" step="0.1" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} /></label>
          </div>
          <p className="hint">Location saved: <b>{region.name}</b> ({region.lat.toFixed(2)}, {region.lon.toFixed(2)}). Pick a location on the dashboard map first.</p>
          <button className="btn">Save farm</button>
        </form>
      </Card>
      <Card title={`My farms (${ud.farms.length})`} icon={Tractor}>
        {ud.farms.length === 0 && <p className="hint">No farms yet. Save one to jump back to it with one click.</p>}
        <div className="list">{ud.farms.map((x) => {
          const c = CROPS.find((k) => k.id === x.crop);
          return (
            <div className="li" key={x.id}><div><b>{c?.emoji} {x.name}</b><small>{c?.name}{x.area ? ` · ${x.area} ha` : ''} · {x.place}</small></div>
              <div className="li-a"><button className="chip" onClick={() => onOpen(x)}><ExternalLink size={14} /> Open</button>
                <button className="icon" aria-label={`Delete ${x.name}`} onClick={() => save((d) => ({ ...d, farms: d.farms.filter((y) => y.id !== x.id) }))}><Trash2 size={14} /></button></div></div>);
        })}</div>
      </Card>
    </div>
  );
}
