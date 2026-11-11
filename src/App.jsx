import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sprout, MapPin, TrendingUp, CalendarDays, Droplets, Flame, Lightbulb, SlidersHorizontal, Printer, Search, Moon, Sun, Info, Wheat, Languages, HeartPulse, Leaf } from 'lucide-react';
import { REGIONS, nearest } from './data/regions.js';
import { I18N } from './i18n.js';
import { loadClimate } from './services/nasa.js';
import { analyze } from './utils/model.js';
import Hero from './components/Hero.jsx';
import MapPanel from './components/MapPanel.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import About from './components/About.jsx';
import { Card, Gauge, Kpis, ShiftChart, WaterChart, Crops, CalendarView, Risks, Actions, CountUp } from './components/Panels.jsx';

const SRC = { live: 'Live NASA data', cache: 'NASA data (cached)', sample: 'Sample data (offline)' };

export default function App() {
  const [view, setView] = useState('hero');
  const [region, setRegion] = useState(REGIONS[0]);
  const [data, setData] = useState({ rows: [], source: '', loading: true });
  const [dT, setDT] = useState(0), [dR, setDR] = useState(0);
  const [lang, setLang] = useState('en'), [theme, setTheme] = useState('dark'), [farmer, setFarmer] = useState(false), [cmd, setCmd] = useState(false);
  const t = (k) => I18N[lang][k] || I18N.en[k] || k;

  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'; }, [theme, lang]);
  useEffect(() => { let ok = true; setData((d) => ({ ...d, loading: true })); loadClimate(region).then((r) => ok && setData({ ...r, loading: false })); return () => { ok = false; }; }, [region]);
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(true); } };
    addEventListener('keydown', h); return () => removeEventListener('keydown', h);
  }, []);

  const pick = (lat, lon, name, preset) => setRegion(preset || { id: 'custom', name: name || `Custom point ${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon, params: nearest(lat, lon).params });
  const A = useMemo(() => (data.rows.length ? analyze(data.rows, dT, dR) : null), [data.rows, dT, dR]);
  const nav = [['overview', Sprout], ['map', MapPin], ['shift', TrendingUp], ['crops', Wheat], ['calendar', CalendarDays], ['water', Droplets], ['risks', Flame], ['actions', Lightbulb], ['impact', Leaf]];

  if (view === 'hero') return <Hero onLaunch={() => setView('dash')} label={t('launch')} />;
  return (
    <div className={'app' + (farmer ? ' farmer' : '')}>
      <aside className="side">
        <div className="brand" onClick={() => setView('hero')}><Sprout size={22} /> FieldShift</div>
        <nav>{nav.map(([id, Icon]) => <a key={id} href={'#' + id} onClick={() => setView('dash')}><Icon size={17} /><span>{t(id)}</span></a>)}
          <a href="#about" onClick={(e) => { e.preventDefault(); setView(view === 'about' ? 'dash' : 'about'); }}><Info size={17} /><span>{t('about')}</span></a></nav>
      </aside>
      <main>
        <header className="top">
          <button className="chip" onClick={() => setCmd(true)}><Search size={15} /> {region.name} <kbd>Ctrl K</kbd></button>
          <span className={'badge ' + data.source}>{data.loading ? 'Loading NASA data…' : SRC[data.source]}</span>
          <div className="tools">
            <button className="icon" title={t('farmer')} aria-pressed={farmer} onClick={() => setFarmer(!farmer)}><Sprout size={16} /> {farmer ? '✓' : ''}</button>
            <button className="icon" title="Language" onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}><Languages size={16} /> {lang === 'en' ? 'اردو' : 'EN'}</button>
            <button className="icon" title="Theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button className="icon" title={t('print')} onClick={() => window.print()}><Printer size={16} /></button>
          </div>
        </header>

        <div className="sim" id="scenario">
          <b><SlidersHorizontal size={16} /> {t('scenario')}</b>
          <label>{t('temp')}: <em>+{dT.toFixed(1)}°C</em><input type="range" min="0" max="4" step="0.5" value={dT} onChange={(e) => setDT(+e.target.value)} /></label>
          <label>{t('rain')}: <em>{dR > 0 ? '+' : ''}{dR}%</em><input type="range" min="-30" max="30" step="5" value={dR} onChange={(e) => setDR(+e.target.value)} /></label>
          {(dT !== 0 || dR !== 0) && <button className="chip" onClick={() => { setDT(0); setDR(0); }}>Reset</button>}
        </div>

        <AnimatePresence mode="wait">
          {view === 'about' ? <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><About /></motion.div>
            : !A ? <div className="skeleton">Fetching NASA climate records…</div>
            : <motion.div key="grid" className="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card id="overview" title={t('health')} icon={HeartPulse}>
                <div className="overview"><Gauge value={A.health} /><Kpis kpis={A.kpis} /></div>
              </Card>
              {farmer ? null : <Card id="map" title={t('map')} icon={MapPin} wide><MapPanel region={region} onPick={pick} heatHigh={A.risks[0].level === 'high'} /></Card>}
              {farmer ? null : <Card id="shift" title={t('shift')} icon={TrendingUp} wide><ShiftChart data={A.annual} />
                <p className="note">Last 5 years ran {(A.annual.slice(-5).reduce((s, a) => s + a.anom, 0) / 5).toFixed(1)}°C warmer than 2000–09 at this location.</p></Card>}
              <Card id="crops" title={t('crops')} icon={Wheat}><Crops crops={A.crops} /></Card>
              <Card id="actions" title={t('actions')} icon={Lightbulb}><Actions recs={A.recs} /></Card>
              <Card id="risks" title={t('risks')} icon={Flame} wide><Risks risks={A.risks} /></Card>
              {farmer ? null : <Card id="calendar" title={t('calendar')} icon={CalendarDays} wide><CalendarView cal={A.calendar} /></Card>}
              {farmer ? null : <Card id="water" title={t('water')} icon={Droplets} wide><WaterChart clim={A.clim} />
                <p className="note">Rain covers {Math.round((A.rain / Math.max(A.et, 1)) * 100)}% of estimated crop water demand ({Math.round(A.rain)} mm vs {Math.round(A.et)} mm per year).</p></Card>}
              <Card id="impact" title={t('impact')} icon={Leaf} wide>
                <div className="impact">
                  <div><b><CountUp v={Math.round(A.crops[0].gap * 10)} /> m³/ha</b><span>supplemental water to plan for the best-fit crop (1 mm = 10 m³/ha)</span></div>
                  <div><b>{A.crops[0].emoji} {A.crops[0].name}</b><span>most climate-resilient choice here — protects food security</span></div>
                  <div><b>{A.recs.length} actions</b><span>concrete changes to sowing, crop mix and irrigation</span></div>
                </div>
              </Card>
            </motion.div>}
        </AnimatePresence>
        <footer>Data: NASA POWER (climate), NASA GIBS (imagery). Estimates for decision support, not forecasts.</footer>
      </main>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} onPick={pick} placeholder={t('search')} />
    </div>
  );
}
