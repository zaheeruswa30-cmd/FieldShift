import { useState } from 'react';
import { ListChecks, Trash2, Download, Plus } from 'lucide-react';
import { Card } from '../components/Panels.jsx';

const doyToDate = (d) => { const n = new Date(), y = n.getFullYear(); let dt = new Date(y, 0, 1 + Math.round(d)); if (dt < n) dt = new Date(y + 1, 0, 1 + Math.round(d)); return dt.toLocaleDateString('en-CA'); };
const today = () => new Date().toLocaleDateString('en-CA');
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };

export default function Planner({ ud, save, A }) {
  const [f, setF] = useState({ title: '', date: today() });
  const add = (title, date) => save((d) => ({ ...d, tasks: [...d.tasks, { id: String(Date.now() + Math.random()), title, date, done: false }] }));
  const tasks = [...ud.tasks].sort((a, b) => a.date.localeCompare(b.date));
  const done = tasks.filter((t) => t.done).length;
  const sugg = A ? [...A.calendar.slice(0, 3).map((c) => ({ title: `Sow ${c.name} (adapted window)`, date: doyToDate(c.adapt[0]) })), { title: 'Check soil moisture and irrigation', date: addDays(3) }, { title: 'Review NASA alerts', date: addDays(7) }] : [];
  const exportIcs = () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const body = tasks.map((t) => `BEGIN:VEVENT\r\nUID:${t.id}@fieldshift\r\nDTSTAMP:${stamp}\r\nDTSTART;VALUE=DATE:${t.date.replace(/-/g, '')}\r\nSUMMARY:${t.title}\r\nEND:VEVENT\r\n`).join('');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//FieldShift//EN\r\n${body}END:VCALENDAR`], { type: 'text/calendar' })); a.download = 'fieldshift-plan.ics'; a.click();
  };
  return (
    <div className="grid">
      <Card title="Add a task" icon={Plus}>
        <form className="stackf" onSubmit={(e) => { e.preventDefault(); if (f.title.trim()) { add(f.title.trim(), f.date); setF({ ...f, title: '' }); } }}>
          <label className="field">Task<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Prepare seedbed" /></label>
          <label className="field">Date<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <button className="btn">Add task</button>
        </form>
        {sugg.length > 0 && <><p className="hint">Suggested from your analysis:</p>
          <div className="sugg">{sugg.map((s) => <button key={s.title} className="chip" onClick={() => add(s.title, s.date)}><Plus size={13} /> {s.title} · {s.date}</button>)}</div></>}
      </Card>
      <Card title={`Farm plan (${done}/${tasks.length} done)`} icon={ListChecks}>
        <div className="prog"><i style={{ width: tasks.length ? (done / tasks.length) * 100 + '%' : 0 }} /></div>
        {tasks.length === 0 && <p className="hint">No tasks yet. Add one or tap a suggestion.</p>}
        <div className="list">{tasks.map((t) => (
          <div key={t.id} className={'li' + (t.done ? ' read' : '')}>
            <label className="chk"><input type="checkbox" checked={t.done} onChange={() => save((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) }))} /><span><b>{t.title}</b><small>{t.date}{!t.done && t.date < today() ? ' · overdue' : ''}</small></span></label>
            <button className="icon" aria-label="Delete task" onClick={() => save((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== t.id) }))}><Trash2 size={14} /></button></div>))}</div>
        {tasks.length > 0 && <button className="chip" onClick={exportIcs}><Download size={14} /> Add to my calendar (.ics)</button>}
      </Card>
    </div>
  );
}
