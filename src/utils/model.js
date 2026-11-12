import { CROPS } from '../data/crops.js';
// All numbers here are transparent, simplified estimates - see the Methodology page.
const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const avg = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const erf = (x) => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-x * x)); };
const phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

export function climatology(rows, y0, y1) {
  const o = Array.from({ length: 12 }, () => ({ t: [], p: [] }));
  rows.filter((r) => r.y >= y0 && r.y <= y1).forEach((r) => { o[r.m - 1].t.push(r.t); o[r.m - 1].p.push(r.p); });
  return o.map((x, i) => ({ m: i + 1, t: avg(x.t), p: avg(x.p) * DAYS[i] })); // p = mm/month
}
const et0 = (t) => Math.max(0, 0.16 * t); // simplified temperature-based ET0, mm/day
export const scenario = (clim, dT, dR) => clim.map((c, i) => ({ ...c, t: c.t + dT, p: c.p * (1 + dR / 100), et: et0(c.t + dT) * DAYS[i] }));
// Estimated heat-stress days/yr: daily Tmax ~ N(monthly mean + 6, 3.5); count days above 35°C.
const heatIn = (clim) => clim.reduce((s, c, i) => s + DAYS[i] * (1 - phi((35 - (c.t + 6)) / 3.5)), 0);
const trap = (x, a, b, c, d) => (x <= a || x >= d ? 0 : x < b ? (x - a) / (b - a) : x <= c ? 1 : (d - x) / (d - c));

export function cropScore(crop, clim) {
  const idx = Array.from({ length: crop.len }, (_, i) => (crop.sow - 1 + i) % 12);
  const sea = idx.map((i) => clim[i]);
  const tm = avg(sea.map((c) => c.t)), rain = sum(sea, 'p');
  const heat = idx.reduce((s, i) => s + DAYS[i] * (1 - phi((35 - (clim[i].t + 6)) / 3.5)), 0);
  const T = trap(tm, crop.range[0], crop.opt[0], crop.opt[1], crop.range[1]);
  const W = Math.min(1, rain / crop.need), H = clamp(1 - heat / (crop.heatTol * 2.5), 0, 1);
  return { score: Math.round(100 * (0.4 * T + 0.25 * W + 0.35 * H)), parts: { temp: Math.round(40 * T), water: Math.round(25 * W), heat: Math.round(35 * H) }, rain: Math.round(rain), gap: Math.round(Math.max(0, crop.need - rain)), tm: +tm.toFixed(1), heat: Math.round(heat) };
}

function annual(rows) {
  const by = {};
  rows.forEach((r) => { (by[r.y] ||= []).push(r); });
  return Object.entries(by).filter(([, v]) => v.length === 12)
    .map(([y, v]) => ({ y: +y, t: +avg(v.map((r) => r.t)).toFixed(2), rain: Math.round(v.reduce((s, r) => s + r.p * DAYS[r.m - 1], 0)) }));
}

export function analyze(rows, dT, dR) {
  const baseC = scenario(climatology(rows, 2000, 2009), 0, 0), nowC = scenario(climatology(rows, 2021, 2025), 0, 0), scn = scenario(climatology(rows, 2021, 2025), dT, dR);
  const ann = annual(rows), bm = avg(ann.filter((a) => a.y <= 2009).map((a) => a.t));
  const annualOut = ann.map((a) => ({ ...a, anom: +(a.t - bm).toFixed(2) }));
  const meanT = avg(scn.map((c) => c.t)), rain = sum(scn, 'p'), et = sum(scn, 'et'), aridity = rain / Math.max(et, 1), heat = heatIn(scn);
  const warming = meanT - avg(baseC.map((c) => c.t));
  const crops = CROPS.map((c) => ({ ...c, ...cropScore(c, scn), now: cropScore(c, nowC).score, base: cropScore(c, baseC).score })).sort((a, b) => b.score - a.score);

  const lvl = (v, hi, md) => (v >= hi ? 'high' : v >= md ? 'medium' : 'low');
  const maxRain = Math.max(...scn.map((c) => c.p)), minT = Math.min(...scn.map((c) => c.t));
  const risks = [
    { id: 'heat', title: 'Heatwave', level: lvl(heat, 60, 25), value: `${Math.round(heat)} days >35°C / yr`, tip: 'Irrigate at night, mulch, use heat-tolerant varieties.' },
    { id: 'drought', title: 'Drought / water deficit', level: aridity < 0.25 ? 'high' : aridity < 0.5 ? 'medium' : 'low', value: `Rain covers ${Math.round(aridity * 100)}% of crop water demand`, tip: 'Plan supplemental irrigation, drip systems, soil moisture conservation.' },
    { id: 'flood', title: 'Heavy rain / flood', level: lvl(maxRain, 250, 150), value: `Wettest month ≈ ${Math.round(maxRain)} mm`, tip: 'Clear drainage channels before the wet season; raise seedbeds.' },
    { id: 'frost', title: 'Cold snap / frost', level: minT < 4 ? 'high' : minT < 8 ? 'medium' : 'low', value: `Coldest month ≈ ${minT.toFixed(1)}°C`, tip: 'Delay sowing of frost-sensitive crops; use protective cover.' },
  ];

  const top = crops[0], worst = [...crops].sort((a, b) => (b.base - b.score) - (a.base - a.score))[0];
  const recs = [{ title: `Prioritise ${top.name}`, detail: `Highest suitability (${top.score}/100) under this scenario.`, impact: 'High' }];
  if (worst.base - worst.score >= 8) recs.push({ title: `Rethink ${worst.name}`, detail: `Suitability fell ${worst.base - worst.score} points vs 2000–09. Consider heat-tolerant varieties or an alternative crop.`, impact: 'High' });
  if (top.gap > 0) recs.push({ title: `Budget ~${top.gap} mm of irrigation`, detail: `Seasonal rain (${top.rain} mm) is below ${top.name}'s need.`, impact: top.gap > 300 ? 'High' : 'Medium' });
  if (dT > 0) recs.push({ title: 'Shift sowing dates', detail: `Winter crops ~${Math.round(dT * 5)} days later, summer crops ~${Math.round(dT * 4)} days earlier at +${dT}°C.`, impact: 'Medium' });
  if (heat > 25) recs.push({ title: 'Cut heat exposure', detail: 'Do field work at dawn/dusk, use mulch and shade nets, time irrigation to the afternoon peak.', impact: 'Medium' });

  const calendar = crops.map((c) => {
    const shift = c.type === 'winter' ? Math.round(dT * 5) : -Math.round(dT * 4), s0 = (c.sow - 1) * 30.4, len = c.len * 30.4;
    return { id: c.id, name: c.name, emoji: c.emoji, shift, trad: [s0, len], adapt: [(s0 + shift + 365) % 365, len] };
  });

  const top3 = avg(crops.slice(0, 3).map((c) => c.score));
  const health = Math.round(0.4 * top3 + 0.3 * clamp((aridity / 0.65) * 100, 0, 100) + 0.3 * (100 - clamp(heat / 1.2, 0, 100)));
  const kpis = [
    { label: 'Mean temperature', v: meanT, d: 1, suffix: '°C' }, { label: 'Warming vs 2000–09', v: warming, d: 1, suffix: '°C' },
    { label: 'Annual rainfall', v: rain, d: 0, suffix: ' mm' }, { label: 'Water supply / demand', v: aridity * 100, d: 0, suffix: '%' },
    { label: 'Heat-stress days / yr', v: heat, d: 0, suffix: '' }, { label: 'Water-deficit risk', text: risks[1].level },
  ];
  return { annual: annualOut, clim: scn, crops, risks, recs, calendar, health, kpis, et, rain, heat };
}
