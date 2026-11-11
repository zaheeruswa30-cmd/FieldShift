export default function About() {
  return (
    <div className="about">
      <h2>Methodology & honest limits</h2>
      <h3>Problem</h3><p>Farm calendars and crop choices were set for a climate that no longer exists. Small changes in temperature and rain shift which crops work and when.</p>
      <h3>NASA data used</h3>
      <ul><li><b>NASA POWER</b> – monthly air temperature (T2M) and rainfall (PRECTOTCORR), 2000–2025, for any point.</li><li><b>NASA GIBS</b> – MODIS true colour, NDVI, land surface temperature and IMERG rain-rate imagery on the map.</li></ul>
      <h3>How the numbers are made</h3>
      <ul>
        <li><b>Climate shift:</b> 2021–25 averages are compared with a 2000–09 baseline.</li>
        <li><b>Water demand (ET₀):</b> simplified, 0.16 × mean temperature mm/day. A rough proxy, not Penman–Monteith.</li>
        <li><b>Heat-stress days:</b> daily maximum assumed ≈ monthly mean + 6°C with 3.5°C spread; days above 35°C are counted.</li>
        <li><b>Crop score (0–100):</b> 40% temperature fit + 25% rainfall vs crop need + 35% heat tolerance during the sowing-to-harvest season.</li>
        <li><b>Scenario:</b> adds the chosen warming and rainfall change to the 2021–25 climate; sowing shifts ≈ 5 days/°C (winter crops later) and 4 days/°C (summer crops earlier).</li>
        <li><b>Farm health:</b> 40% top-3 crop suitability, 30% water supply/demand, 30% low heat stress.</li>
      </ul>
      <h3>Limits</h3>
      <ul><li>Monthly data hides extreme single days; crop rules are generic, not variety- or soil-specific.</li><li>Irrigation, soil, pests and markets are not modelled. Treat results as decision support, not a forecast.</li><li>When NASA is unreachable the app shows clearly labelled <b>sample data</b> (synthetic), never presented as real.</li></ul>
    </div>
  );
}
