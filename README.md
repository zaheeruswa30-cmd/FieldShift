# 🌾 FieldShift – Adapting Farms With NASA Data
NASA Space Apps Challenge 2026 · "Field Shift: Adapting Farms With NASA Data"

A farm decision dashboard: it reads 25 years of NASA climate records for a location, shows what has shifted, ranks crops, moves planting windows, plans water, flags risks, and lets you test "what if it gets +2°C and 20% less rain?".

## Run it (VS Code)
1. Unzip and open the `fieldshift` folder in VS Code (File → Open Folder).
2. Open the terminal: **Ctrl + `** (backtick).
3. `npm install`
4. `npm run dev` → opens http://localhost:5173
5. Build for deployment: `npm run build` (output in `dist/`, preview with `npm run preview`). Requires Node.js 18+.

## Using the app
- **Ctrl K**: search a preset region or type `lat, lon`. You can also click anywhere on the map.
- **What-if scenario** bar (top): warming 0–4°C, rainfall −30…+30%. Everything updates live.
- **Farmer mode**: big, simple view. **اردو/EN**: language. ☀/🌙: theme. 🖨: print / save as PDF report.
- The badge shows data status: *Live NASA data*, *cached*, or *Sample data (offline)*.

## Edit things
| What | File |
|---|---|
| Regions & coordinates | `src/data/regions.js` |
| Crops, seasons, thresholds | `src/data/crops.js` |
| Scoring / risk / recommendation logic | `src/utils/model.js` |
| NASA API calls & map layers | `src/services/nasa.js` |
| Offline sample data generator | `src/services/sample.js` |
| Translations | `src/i18n.js` |
| Colours & look | `src/styles.css` (CSS variables at the top) |

## Data & honesty
- **NASA POWER** (monthly T2M, PRECTOTCORR) and **NASA GIBS** (MODIS, IMERG tiles); no API key needed.
- If NASA is unreachable, **clearly labelled synthetic sample data** is used so the demo never breaks.
- Water demand, heat-stress days and crop scores are simplified estimates (see in-app Methodology).
- Optional keys (SMAP/AppEEARS etc.) go in `.env` (copy `.env.example`); not required.
