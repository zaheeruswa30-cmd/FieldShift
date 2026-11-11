import { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts';

export function CountUp({ v, d = 0, suffix = '' }) {
  const [x, setX] = useState(0);
  useEffect(() => { const c = animate(x, v, { duration: 0.9, onUpdate: setX }); return () => c.stop(); }, [v]);
  return <>{x.toFixed(d)}{suffix}</>;
}
export function Card({ id, title, icon: Icon, wide, children }) {
  return <section id={id} className={'card' + (wide ? ' wide' : '')}><h2>{Icon && <Icon size={18} />}{title}</h2>{children}</section>;
}
export function Gauge({ value }) {
  const r = 70, c = 2 * Math.PI * r, col = value > 60 ? '#5fd39a' : value > 35 ? '#e8b04a' : '#e0644f';
  return (
    <div className="gauge">
      <svg viewBox="0 0 180 180" role="img" aria-label={`Farm health ${value} out of 100`}>
        <circle cx="90" cy="90" r={r} className="g-bg" />
        <motion.circle cx="90" cy="90" r={r} className="g-fg" stroke={col} strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 1.1, ease: 'easeOut' }} transform="rotate(-90 90 90)" />
      </svg>
      <div className="g-num"><CountUp v={value} /><small>/100</small></div>
    </div>
  );
}
export const Kpis = ({ kpis }) => (
  <div className="kpis">{kpis.map((k) => (
    <div className="kpi" key={k.label}><span>{k.label}</span><b className={k.text ? 'lvl ' + k.text : ''}>{k.text ? k.text : <CountUp v={k.v} d={k.d} suffix={k.suffix} />}</b></div>
  ))}</div>
);

const tip = { contentStyle: { background: '#10201a', border: '1px solid #2c4a3d', borderRadius: 8 } };
export function ShiftChart({ data }) {
  return (
    <>
      <div className="chart"><ResponsiveContainer>
        <ComposedChart data={data}><CartesianGrid stroke="#ffffff14" /><XAxis dataKey="y" stroke="#9db3a6" /><YAxis yAxisId="l" stroke="#e8b04a" domain={['auto', 'auto']} unit="°" /><YAxis yAxisId="r" orientation="right" stroke="#3cc3b0" />
          <Tooltip {...tip} /><Legend />
          <Bar yAxisId="r" dataKey="rain" name="Rain (mm/yr)" fill="#3cc3b0" opacity={0.45} />
          <Line yAxisId="l" dataKey="t" name="Mean temp (°C)" stroke="#e8b04a" strokeWidth={3} dot={false} />
        </ComposedChart></ResponsiveContainer></div>
      <div className="chart small"><ResponsiveContainer>
        <ComposedChart data={data}><CartesianGrid stroke="#ffffff14" /><XAxis dataKey="y" stroke="#9db3a6" /><YAxis stroke="#9db3a6" unit="°" /><Tooltip {...tip} />
          <Bar dataKey="anom" name="Temp anomaly vs 2000–09 (°C)">{data.map((d) => <Cell key={d.y} fill={d.anom >= 0 ? '#e0644f' : '#3cc3b0'} />)}</Bar>
        </ComposedChart></ResponsiveContainer></div>
    </>
  );
}
export function WaterChart({ clim }) {
  const M = 'JFMAMJJASOND', data = clim.map((c, i) => ({ m: M[i] + (i > 9 ? '' : ''), rain: Math.round(c.p), et: Math.round(c.et), gap: Math.round(c.p - c.et) }));
  return (
    <div className="chart"><ResponsiveContainer>
      <ComposedChart data={data}><CartesianGrid stroke="#ffffff14" /><XAxis dataKey="m" stroke="#9db3a6" /><YAxis stroke="#9db3a6" unit=" mm" /><Tooltip {...tip} /><Legend />
        <Bar dataKey="rain" name="Rain" fill="#3cc3b0" /><Bar dataKey="et" name="Crop water demand (ET₀)" fill="#e8b04a" />
        <Line dataKey="gap" name="Surplus / deficit" stroke="#e0644f" strokeWidth={2} dot={false} />
      </ComposedChart></ResponsiveContainer></div>
  );
}
export const Crops = ({ crops }) => (
  <div className="crops">{crops.map((c, i) => (
    <motion.div layout key={c.id} className="crop" transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
      <div className="crop-h"><span>{c.emoji} {c.name}</span><b><CountUp v={c.score} /></b></div>
      <div className="stack" title={`Temperature ${c.parts.temp}/40 · Water ${c.parts.water}/25 · Heat ${c.parts.heat}/35`}>
        <motion.i className="s-t" animate={{ width: c.parts.temp + '%' }} /><motion.i className="s-w" animate={{ width: c.parts.water + '%' }} /><motion.i className="s-h" animate={{ width: c.parts.heat + '%' }} />
      </div>
      <small>2000–09: {c.base} → 2021–25: {c.now} → scenario: {c.score}{i === 0 ? ' · best fit' : ''} · season {c.tm}°C, {c.rain} mm rain, ~{c.heat} hot days</small>
    </motion.div>
  ))}
    <p className="legend"><i className="s-t" /> temperature (max 40) <i className="s-w" /> water (max 25) <i className="s-h" /> heat tolerance (max 35)</p>
  </div>
);
const segs = ([s, l]) => (s + l <= 365 ? [[s, l]] : [[s, 365 - s], [0, s + l - 365]]);
export function CalendarView({ cal }) {
  const M = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const bar = (b, cls) => segs(b).map(([s, l], k) => <motion.i key={k} className={'bar ' + cls} initial={{ width: 0 }} animate={{ left: (s / 365) * 100 + '%', width: (l / 365) * 100 + '%' }} />);
  return (
    <div className="cal">
      <div className="months">{M.map((m, i) => <span key={i}>{m}</span>)}</div>
      {cal.map((c) => (
        <div className="cal-row" key={c.id}><span className="cal-n">{c.emoji} {c.name} <small>{c.shift === 0 ? '' : `${c.shift > 0 ? '+' : ''}${c.shift} d`}</small></span>
          <div className="cal-t"><div className="track">{bar(c.trad, 'trad')}</div><div className="track">{bar(c.adapt, 'adapt')}</div></div></div>
      ))}
      <p className="legend"><i className="bar trad" /> traditional season <i className="bar adapt" /> adapted season</p>
    </div>
  );
}
export const Risks = ({ risks }) => (
  <div className="risks">{risks.map((r) => (
    <div key={r.id} className={'risk ' + r.level}><b>{r.title}</b><span className="lvl">{r.level}</span><p>{r.value}</p><small>{r.tip}</small></div>
  ))}</div>
);
export const Actions = ({ recs }) => (
  <ol className="actions">{recs.map((r, i) => (
    <motion.li key={r.title} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}><b>{r.title}</b><span className={'pill ' + r.impact}>{r.impact} impact</span><p>{r.detail}</p></motion.li>
  ))}</ol>
);
