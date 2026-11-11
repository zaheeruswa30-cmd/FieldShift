// OFFLINE FALLBACK: synthetic monthly climate (2000-2025) built from region params with a warming/drying trend.
// It is NOT real observation data - the UI labels it "Sample data" whenever it is used.
const rng = (s) => () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646);
export function sampleClimate(p, seed = 7) {
  const r = rng(seed), rows = [];
  for (let y = 2000; y <= 2025; y++)
    for (let m = 1; m <= 12; m++) {
      const t = p.tMean + p.tAmp * Math.cos((2 * Math.PI * (m - p.tPeak)) / 12) + 0.045 * (y - 2000) + (r() - 0.5) * 1.6;
      const w = Math.max(0.03, 1 + p.rAmp * Math.cos((2 * Math.PI * (m - p.rPeak)) / 12));
      const pr = Math.max(0, (p.rain / 365) * w * (1 + (r() - 0.5) * 1.2) * (1 - 0.004 * (y - 2000)));
      rows.push({ y, m, t: +t.toFixed(2), p: +pr.toFixed(2) });
    }
  return rows;
}
