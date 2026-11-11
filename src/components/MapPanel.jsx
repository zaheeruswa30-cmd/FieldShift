import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Play, Pause } from 'lucide-react';
import { LAYERS, gibsUrl } from '../services/nasa.js';

export default function MapPanel({ region, onPick, heatHigh }) {
  const el = useRef(), map = useRef(), gibs = useRef(), mark = useRef(), pickRef = useRef(onPick);
  const [lid, setLid] = useState(LAYERS[0].id), [op, setOp] = useState(0.85), [off, setOff] = useState(8), [play, setPlay] = useState(false);
  pickRef.current = onPick;
  const layer = LAYERS.find((l) => l.id === lid);
  const date = new Date(Date.now() - (off + 4) * 864e5).toISOString().slice(0, 10);

  useEffect(() => {
    map.current = L.map(el.current).setView([region.lat, region.lon], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap © CARTO', maxZoom: 12 }).addTo(map.current);
    map.current.on('click', (e) => pickRef.current(e.latlng.lat, e.latlng.lng));
    return () => map.current.remove();
  }, []);
  useEffect(() => {
    map.current.flyTo([region.lat, region.lon], map.current.getZoom(), { duration: 1.2 });
    mark.current?.remove();
    mark.current = L.circleMarker([region.lat, region.lon], { radius: 9, color: '#e8b04a', weight: 3, fillColor: '#e8b04a', fillOpacity: 0.35 }).addTo(map.current);
  }, [region]);
  useEffect(() => {
    gibs.current?.remove();
    gibs.current = L.tileLayer(gibsUrl(layer, date), { maxNativeZoom: layer.z, maxZoom: 12, opacity: op, attribution: 'NASA GIBS' }).addTo(map.current);
  }, [lid, off]);
  useEffect(() => { gibs.current?.setOpacity(op); }, [op]);
  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setOff((o) => (o + 3) % 60), 1100);
    return () => clearInterval(id);
  }, [play]);

  return (
    <div className="mapwrap">
      <div className="maptools">
        <select value={lid} onChange={(e) => setLid(e.target.value)} aria-label="Satellite layer">{LAYERS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
        <label>Opacity <input type="range" min=".2" max="1" step=".05" value={op} onChange={(e) => setOp(+e.target.value)} /></label>
        <button className="icon" onClick={() => setPlay(!play)} aria-label={play ? 'Pause' : 'Play'}>{play ? <Pause size={16} /> : <Play size={16} />}</button>
        <label>Date {date} <input type="range" min="0" max="59" value={off} onChange={(e) => setOff(+e.target.value)} /></label>
      </div>
      <div ref={el} className="map" />
      {heatHigh && <div className="shimmer" aria-hidden="true" />}
      <p className="hint">Click anywhere to analyse that location. If a layer looks blank for a date, move the slider (some layers update every 8 days).</p>
    </div>
  );
}
