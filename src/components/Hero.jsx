import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Satellite } from 'lucide-react';

// Lightweight canvas globe (no 3D library): 900 dots on a rotating sphere + an orbiting satellite.
function Globe() {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d'), W = (c.width = 640), H = (c.height = 640);
    const pts = Array.from({ length: 900 }, (_, i) => { const y = 1 - (2 * (i + 0.5)) / 900, r = Math.sqrt(1 - y * y), a = i * 2.399963; return [Math.cos(a) * r, y, Math.sin(a) * r]; });
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let t = 0, raf;
    const draw = () => {
      t += still ? 0 : 0.004; ctx.clearRect(0, 0, W, H);
      const R = 220, cx = W / 2, cy = H / 2, tilt = -0.45;
      ctx.strokeStyle = 'rgba(232,176,74,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.45, R * 0.5, tilt, 0, 6.29); ctx.stroke();
      for (const [x, y, z] of pts) {
        const X = x * Math.cos(t) + z * Math.sin(t), Z = -x * Math.sin(t) + z * Math.cos(t);
        if (Z < -0.05) continue;
        ctx.fillStyle = `rgba(${y > 0.1 ? '120,220,160' : '60,195,176'},${0.25 + 0.75 * Z})`;
        ctx.beginPath(); ctx.arc(cx + X * R, cy - y * R, 1.7, 0, 6.29); ctx.fill();
      }
      const s = t * 3, px = Math.cos(s) * R * 1.45, py = Math.sin(s) * R * 0.5;
      const sx = cx + px * Math.cos(tilt) - py * Math.sin(tilt), sy = cy + px * Math.sin(tilt) + py * Math.cos(tilt);
      ctx.fillStyle = '#e8b04a'; ctx.shadowColor = '#e8b04a'; ctx.shadowBlur = 18; ctx.fillRect(sx - 5, sy - 3, 10, 6); ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="globe" aria-hidden="true" />;
}

export default function Hero({ onLaunch, label }) {
  return (
    <div className="hero">
      <Globe />
      <motion.div className="hero-copy" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
        <p className="tag"><Satellite size={16} /> NASA Space Apps Challenge 2026</p>
        <h1>The fields haven’t moved.<br />The climate has.</h1>
        <p className="lede">FieldShift reads 25 years of NASA satellite and climate records for your farm and shows what has already changed, which crops still fit, and when to sow, irrigate and protect.</p>
        <button className="btn" onClick={onLaunch}>{label}</button>
      </motion.div>
    </div>
  );
}
