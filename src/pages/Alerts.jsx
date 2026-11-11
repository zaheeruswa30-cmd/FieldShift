import { Bell, CheckCheck } from 'lucide-react';
import { Card } from '../components/Panels.jsx';

export const buildAlerts = (A, region, src) => {
  if (!A) return [];
  const out = A.risks.filter((r) => r.level !== 'low').map((r) => ({ id: `${region.name}|${r.id}|${r.level}`, level: r.level, title: `${r.title} · ${region.name.split(' –')[0]}`, text: `${r.value}. ${r.tip}` }));
  if (A.health < 35) out.push({ id: `${region.name}|health`, level: 'high', title: 'Low farm health score', text: `Score is ${A.health}/100. Review the recommended actions on the dashboard.` });
  if (src === 'sample') out.push({ id: 'sample-data', level: 'info', title: 'Showing sample data', text: 'NASA could not be reached, so the figures are synthetic. Check your connection.' });
  return out;
};

export default function Alerts({ alerts, read, save, notify }) {
  const markAll = () => save((d) => ({ ...d, read: [...new Set([...d.read, ...alerts.map((a) => a.id)])] }));
  return (
    <Card title="Alerts for your current location" icon={Bell} wide>
      {!notify && <p className="hint">Notifications are switched off in Settings. Alerts are still listed here.</p>}
      <button className="chip" onClick={markAll}><CheckCheck size={14} /> Mark all as read</button>
      {alerts.length === 0 && <p className="hint">No active alerts. Conditions look steady for this scenario.</p>}
      <div className="list">{alerts.map((a) => (
        <div key={a.id} className={'li al ' + a.level + (read.includes(a.id) ? ' read' : '')}>
          <div><b>{a.title}</b><small>{a.text}</small></div>
          {!read.includes(a.id) && <button className="chip" onClick={() => save((d) => ({ ...d, read: [...d.read, a.id] }))}>Mark read</button>}
        </div>))}</div>
    </Card>
  );
}
