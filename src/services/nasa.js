import { nearest } from '../data/regions.js';
import { sampleClimate } from './sample.js';

// NASA POWER monthly point API (no key). T2M = mean air temp (°C), PRECTOTCORR = rainfall (mm/day).
// Returns { rows:[{y,m,t,p}], source:'live'|'cache'|'sample' }
export async function loadClimate(region) {
  const key = `fieldshift:${region.lat.toFixed(2)},${region.lon.toFixed(2)}`;
  try {
    const c = JSON.parse(localStorage.getItem(key) || 'null');
    if (c && Date.now() - c.at < 7 * 864e5) return { rows: c.rows, source: 'cache' };
  } catch { /* ignore */ }
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR&community=AG&longitude=${region.lon}&latitude=${region.lat}&start=2000&end=2025&format=JSON`;
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const par = (await res.json()).properties.parameter;
    const rows = [];
    for (const k of Object.keys(par.T2M)) {
      const m = +k.slice(4), t = par.T2M[k], p = par.PRECTOTCORR[k];
      if (m < 1 || m > 12 || t < -900 || p < -900) continue; // skip annual (13) and fill values
      rows.push({ y: +k.slice(0, 4), m, t, p });
    }
    if (rows.length < 120) throw new Error('incomplete');
    try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), rows })); } catch { /* quota */ }
    return { rows, source: 'live' };
  } catch (e) {
    console.warn('NASA POWER unavailable, using sample data:', e.message);
    return { rows: sampleClimate(region.params || nearest(region.lat, region.lon).params), source: 'sample' };
  }
}

// NASA GIBS WMTS layers (no key). z = max native zoom level of the layer.
export const LAYERS = [
  { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', label: 'True colour', ext: 'jpg', z: 9, legend: null },
  { id: 'MODIS_Terra_NDVI_8Day', label: 'Vegetation (NDVI)', ext: 'png', z: 9, legend: ['Bare / dry', 'Dense crops', 'linear-gradient(90deg,#8c5a2b,#d9c36a,#5fd39a,#1f7a3a)'] },
  { id: 'MODIS_Terra_Land_Surface_Temp_Day', label: 'Land surface temp', ext: 'png', z: 7, legend: ['Cool', 'Hot', 'linear-gradient(90deg,#3b4cc0,#8fd3e8,#f5e663,#e0644f,#8b1a1a)'] },
  { id: 'IMERG_Precipitation_Rate', label: 'Rain rate (IMERG)', ext: 'png', z: 6, legend: ['Light', 'Heavy', 'linear-gradient(90deg,#a6e3ff,#3c8dff,#7a3cff,#d43cff)'] },
];
export const gibsUrl = (l, date) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${l.id}/default/${date}/GoogleMapsCompatible_Level${l.z}/{z}/{y}/{x}.${l.ext}`;

// Basemaps. CARTO raster tiles now stamp "API KEY REQUIRED" on keyless requests (since Aug 2026), so they are NOT used
// unless you add VITE_CARTO_KEY to .env. Defaults are Esri + OpenStreetMap, which need no key.
const CARTO_KEY = import.meta.env.VITE_CARTO_KEY;
export const BASEMAPS = {
  ...(CARTO_KEY ? { carto: { label: 'Dark (CARTO)', url: `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_KEY}`, attr: '© OpenStreetMap © CARTO', z: 18 } } : {}),
  dark: { label: 'Dark map', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri', z: 16,
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}' },
  sat: { label: 'Satellite (Esri)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri', z: 18 },
  osm: { label: 'Street map', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap', z: 19 },
};
export const BASE_ORDER = Object.keys(BASEMAPS); // fallback order if a basemap fails to load
