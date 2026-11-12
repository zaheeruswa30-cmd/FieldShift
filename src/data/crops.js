// Crop rules. sow = sowing month (1-12), len = season months, opt = ideal mean temp band, range = survivable band,
// need = seasonal rainfall need (mm), heatTol = heat-stress days (>35°C) the crop tolerates, type = which way warming shifts sowing.
// EDIT HERE to add crops. Sowing months assume Northern-Hemisphere subtropics.
export const CROPS = [
  { id: 'wheat', name: 'Wheat', emoji: '🌾', sow: 11, len: 5, opt: [12, 22], range: [4, 30], need: 350, heatTol: 8, type: 'winter' },
  { id: 'chickpea', name: 'Chickpea', emoji: '🫘', sow: 10, len: 5, opt: [15, 25], range: [8, 32], need: 250, heatTol: 10, type: 'winter' },
  { id: 'rice', name: 'Rice', emoji: '🍚', sow: 6, len: 5, opt: [22, 31], range: [18, 36], need: 1100, heatTol: 30, type: 'summer' },
  { id: 'cotton', name: 'Cotton', emoji: '☁️', sow: 4, len: 7, opt: [24, 33], range: [18, 38], need: 700, heatTol: 45, type: 'summer' },
  { id: 'maize', name: 'Maize', emoji: '🌽', sow: 7, len: 4, opt: [20, 29], range: [12, 35], need: 500, heatTol: 20, type: 'summer' },
];
