import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Play, Pause, LocateFixed } from 'lucide-react';
import { LAYERS, gibsUrl, BASEMAPS, BASE_ORDER } from '../services/nasa.js';

export default function MapPanel({ region, onPick, heatHigh }) {
  const el = useRef(), map = useRef(), gibs = useRef(), base = useRef(), lbl = useRef(), bfail = useRef({ ok: 0, bad: 0 }), mark = useRef(), pickRef = useRef(onPick), fails = useRef({ ok: 0, bad: 0 });
  const [lid, setLid] = useState(LAYERS[0].id), [op, setOp] = useState(0.85), [off, setOff] = useState(8), [play, setPlay] = useState(false), [bm, setBm] = useState('dark'), [warn, setWarn] = useState('');
  pickRef.current = onPick;
  const layer = LAYERS.find((l) => l.id === lid);
  const date = new Date(Date.now() - (off + 4) * 864e5).toISOString().slice(0, 10);

  useEffect(() => {
    map.current = L.map(el.current).setView([region.lat, region.lon], 6);
    map.current.on('click', (e) => pickRef.current(e.latlng.lat, e.latlng.lng));
    return () => map.current.remove();
  }, []);
  useEffect(() => {
    base.current?.remove(); lbl.current?.remove(); bfail.current = { ok: 0, bad: 0 };
    const b = BASEMAPS[bm]; if (!b) return;
    const t = L.tileLayer(b.url, { attribution: b.attr, maxZoom: 12, maxNativeZoom: b.z });
    t.on('tileload', () => { bfail.current.ok++; });
    t.on('tileerror', () => { // basemap blocked/offline: move to the next keyless basemap instead of showing blank tiles
      if (++bfail.current.bad === 8 && bfail.current.ok === 0) {
        const nx = BASE_ORDER[(BASE_ORDER.indexOf(bm) + 1) % BASE_ORDER.length];
        setWarn(`"${b.label}" could not load, switched to "${BASEMAPS[nx].label}".`); setBm(nx);
      }
    });
    base.current = t.addTo(map.current); t.bringToBack();
    if (b.labels) { // place names above the NASA layer so they stay readable
      if (!map.current.getPane('labels')) { map.current.createPane('labels'); map.current.getPane('labels').style.zIndex = 450; map.current.getPane('labels').style.pointerEvents = 'none'; }
      lbl.current = L.tileLayer(b.labels, { pane: 'labels', maxZoom: 12, maxNativeZoom: b.z }).addTo(map.current);
    }
  }, [bm]);
  useEffect(() => {
    map.current.flyTo([region.lat, region.lon], map.current.getZoom(), { duration: 1.2 });
    mark.current?.remove();
    mark.current = L.circleMarker([region.lat, region.lon], { radius: 9, className: 'pulse-marker', color: '#e8b04a', weight: 3, fillColor: '#e8b04a', fillOpacity: 0.35 }).addTo(map.current);
  }, [region]);
  useEffect(() => {
    gibs.current?.remove(); fails.current = { ok: 0, bad: 0 }; setWarn('');
    const g = L.tileLayer(gibsUrl(layer, date), { maxNativeZoom: layer.z, maxZoom: 12, opacity: op, attribution: 'NASA GIBS', className: 'gibs-fade' });
    g.on('tileload', () => { fails.current.ok++; setWarn(''); });
    g.on('tileerror', () => { // some dates have no imagery: step back a few days automatically, then explain
      if (++fails.current.bad === 12 && fails.current.ok === 0) setWarn('No imagery for this date/layer yet. Move the date slider back a few days or pick another layer.');
    });
    gibs.current = g.addTo(map.current);
  }, [lid, off]);
  useEffect(() => { gibs.current?.setOpacity(op); }, [op]);
  const locate = () => {
    if (!navigator.geolocation) return setWarn('Your browser cannot share location.');
    navigator.geolocation.getCurrentPosition((p) => pickRef.current(+p.coords.latitude.toFixed(3), +p.coords.longitude.toFixed(3)), () => setWarn('Location permission was denied. Click the map instead.'), { timeout: 8000 });
  };
  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setOff((o) => (o + 3) % 60), 1100);
    return () => clearInterval(id);
  }, [play]);

  return (
    <div className="mapwrap">
      <div className="maptools">
        <select value={lid} onChange={(e) => setLid(e.target.value)} aria-label="Satellite layer">{LAYERS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
        <select value={bm} onChange={(e) => setBm(e.target.value)} aria-label="Basemap">{Object.entries(BASEMAPS).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}</select>
        <label>Opacity <input type="range" min=".2" max="1" step=".05" value={op} onChange={(e) => setOp(+e.target.value)} /></label>
        <button className="icon" onClick={locate} aria-label="Use my location" title="Use my location"><LocateFixed size={16} /></button>
        <button className="icon" onClick={() => setPlay(!play)} aria-label={play ? 'Pause' : 'Play'}>{play ? <Pause size={16} /> : <Play size={16} />}</button>
        <label>Date {date} <input type="range" min="0" max="59" value={off} onChange={(e) => setOff(+e.target.value)} /></label>
      </div>
      <div ref={el} className="map" />
      {heatHigh && <div className="shimmer" aria-hidden="true" />}
      {layer.legend && <div className="legend" aria-label="Legend"><span>{layer.legend[0]}</span><i style={{ background: layer.legend[2] }} /><span>{layer.legend[1]}</span></div>}
      {warn && <p className="maperr" role="status">{warn}</p>}
      <p className="hint">Click anywhere to analyse that location. NASA GIBS imagery needs no API key. If a layer looks blank, move the date slider (some layers update every 8 days).</p>
    </div>
  );
}
