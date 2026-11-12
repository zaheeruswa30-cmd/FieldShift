import { useEffect, useRef, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { Card } from '../components/Panels.jsx';

// Rule-based helper: answers come from the same numbers shown on the dashboard (no external AI service).
function answer(q, A, region) {
  const s = q.toLowerCase(), has = (...w) => w.some((x) => s.includes(x)), top = A.crops[0], place = region.name.split(' –')[0];
  if (has('crop', 'plant', 'grow', 'fasal', 'ugao', 'ugana')) return `Best fit for ${place} under the current scenario: ${A.crops.slice(0, 3).map((c) => `${c.emoji} ${c.name} (${c.score}/100)`).join(', ')}. ${top.name} scores highest because its season matches the temperature band best.`;
  if (has('sow', 'when', 'kab', 'date', 'calendar')) { const c = A.calendar.find((x) => x.id === top.id); return `For ${top.name}, the traditional window starts around day ${Math.round(c.trad[0])} of the year. With this scenario the adapted start moves by ${c.shift > 0 ? '+' : ''}${c.shift} days. See the Planting calendar for the full picture.`; }
  if (has('water', 'irrigat', 'pani', 'paani', 'rain', 'barish')) return `Rain covers about ${Math.round((A.rain / Math.max(A.et, 1)) * 100)}% of estimated crop water demand (${Math.round(A.rain)} mm rain vs ${Math.round(A.et)} mm demand per year). For ${top.name}, plan roughly ${top.gap} mm of supplemental irrigation per season.`;
  if (has('heat', 'hot', 'garmi', 'temperature')) return `Expect about ${Math.round(A.heat)} heat-stress days (above 35°C) per year here. Do field work at dawn or dusk and consider mulch and shade nets.`;
  if (has('risk', 'alert', 'khatra', 'danger')) return A.risks.map((r) => `${r.title}: ${r.level} (${r.value})`).join('. ') + '.';
  if (has('health', 'score')) return `The farm health score is ${A.health}/100. It combines top-3 crop suitability (40%), water supply vs demand (30%) and low heat stress (30%).`;
  if (has('change', 'warm', 'climate', 'shift')) return `Recent years at ${place} ran ${A.kpis[1].v.toFixed(1)}°C warmer than 2000–09 in the current scenario. Open Climate shift for the yearly chart.`;
  return 'I can help with crops, sowing dates, water, heat, risks, the health score and climate change here. Try one of the suggestions below.';
}
const CHIPS = ['Which crop should I grow?', 'When should I sow?', 'How much water do I need?', 'What are the biggest risks?'];

export default function Assistant({ A, region }) {
  const [msgs, setMsgs] = useState([{ me: false, t: 'Hi! Ask me about your farm conditions. I use the same NASA-based numbers as the dashboard.' }]), [q, setQ] = useState(''), end = useRef();
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [msgs]);
  if (!A) return <p className="hint">Loading NASA data…</p>;
  const ask = (text) => { if (!text.trim()) return; setMsgs((m) => [...m, { me: true, t: text }]); setQ(''); setTimeout(() => setMsgs((m) => [...m, { me: false, t: answer(text, A, region) }]), 450); };
  return (
    <Card title="Farm assistant" icon={Bot} wide>
      <div className="chat">{msgs.map((m, i) => <div key={i} className={'bub ' + (m.me ? 'me' : '')}>{m.t}</div>)}<div ref={end} /></div>
      <div className="sugg">{CHIPS.map((c) => <button key={c} className="chip" onClick={() => ask(c)}>{c}</button>)}</div>
      <form className="chat-in" onSubmit={(e) => { e.preventDefault(); ask(q); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about crops, sowing, water, heat…" aria-label="Your question" /><button className="btn"><Send size={16} /></button></form>
      <p className="hint">Rule-based helper, not a general AI. Answers come from the dashboard model.</p>
    </Card>
  );
}
