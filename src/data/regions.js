// Preset farming regions. EDIT HERE to add your own.
// params are only used to build the offline SAMPLE data (tMean/tAmp in °C, rain in mm/yr, tPeak/rPeak = hottest/wettest month).
export const REGIONS = [
  { id: 'sindh', name: 'Sindh – Indus plains, Pakistan', lat: 25.4, lon: 68.4, params: { tMean: 27, tAmp: 8.5, tPeak: 6, rain: 180, rAmp: 1.6, rPeak: 7 } },
  { id: 'punjab', name: 'Punjab – Central plains, Pakistan', lat: 31.4, lon: 73.1, params: { tMean: 24, tAmp: 11, tPeak: 6, rain: 450, rAmp: 1.4, rPeak: 7 } },
  { id: 'nile', name: 'Nile Delta, Egypt', lat: 30.8, lon: 31.0, params: { tMean: 22, tAmp: 7.5, tPeak: 7, rain: 100, rAmp: 1.3, rPeak: 1 } },
  { id: 'deccan', name: 'Maharashtra – Deccan plateau, India', lat: 18.5, lon: 75.0, params: { tMean: 26.5, tAmp: 4.5, tPeak: 5, rain: 650, rAmp: 1.8, rPeak: 7 } },
];
export const nearest = (lat, lon) =>
  REGIONS.reduce((b, r) => ((r.lat - lat) ** 2 + (r.lon - lon) ** 2 < (b.lat - lat) ** 2 + (b.lon - lon) ** 2 ? r : b));
