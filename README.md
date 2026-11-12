# 🌾 FieldShift – Adapting Farms With NASA Data
NASA Space Apps Challenge 2026 · "Field Shift: Adapting Farms With NASA Data"

A farm decision dashboard: it reads 25 years of NASA climate records for a location, shows what has shifted, ranks crops, moves planting windows, plans water, flags risks, and lets you test "what if it gets +2°C and 20% less rain?".

## Run it (VS Code)
1. Unzip and open the `fieldshift` folder in VS Code (File → Open Folder).
2. Open the terminal: **Ctrl + `** (backtick).
3. `npm install`
4. `cp .env.example .env` (optional, see below)
5. `npm run dev` → starts the app (http://localhost:5173) AND the mail/Google server (port 3001)
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

## Accounts & extra pages (added)
- Landing → **Launch dashboard** → **Create account / Log in** (also: forgot password, "Try the demo account").
- After login, the original dashboard is unchanged. New sidebar pages: **My farms, Compare regions, Alerts, Farm planner (+ .ics export), Assistant, Settings**.
- Top-right avatar menu: profile & settings, **Switch account**, **Add another account**, **Log out**. Settings: profile, password, language, theme, default region, Farmer mode, notifications, animations, download/clear data, delete account.
- ⚠️ Demo auth: accounts and data live only in this browser's localStorage (passwords are salted + hashed but there is no server). Replace `src/services/auth.js` with a real backend (Firebase/Supabase) for production.

## v2 additions
- **Login options**: email + password, **Continue with Google**, **Email me a login code**, **Forgot password** (code sent to email, then new password). Sign-up verifies the email with a 6-digit OTP. After Google sign-in you can set a password (optional).
- **OTP emails**: with empty SMTP in `.env` the code appears in the app ("Dev inbox") and in the terminal. Fill `SMTP_USER`/`SMTP_PASS` (Gmail App Password) to send real emails. Code: `server/index.js`.
- **Google**: set `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` in `.env` (Authorised origin `http://localhost:5173`). Without it a demo account chooser is shown.
- **NASA map**: no API key needed. Added basemap switch (dark / Esri satellite / street), blank-tile warning, pulsing marker.
- **Animations**: aurora background, staggered card entrance, hover lift, live-data ping, shimmer skeleton (`src/enhance.css`; respects Settings > Animations).

## v3 fixes
- **"API KEY REQUIRED" on the map**: it came from the CARTO dark basemap (CARTO started watermarking keyless raster tiles in Aug 2026), not from NASA. Default basemaps are now Esri Dark Gray / Esri Satellite / OpenStreetMap (no key). If a basemap fails, the map switches to the next one automatically. Optional: set `VITE_CARTO_KEY` to bring CARTO back.
- **Log in with a code**: no more "No account found". After the emailed code is verified, the account is created on this device if it does not exist yet.
- **Google**: server accepts `GOOGLE_CLIENT_ID` or `VITE_GOOGLE_CLIENT_ID`; the login page now tells you if the server is off, if the ID is missing on the server, and which origin to authorise (`http://localhost:5173`).
- **Alignment**: auth card, password field, buttons, links and map toolbar re-aligned (`src/enhance.css`, bottom).
- **New**: "Use my location" button and colour legends on the map; 30 s resend countdown on codes.

## Real Google sign-in (one-time, about 5 minutes)
The note "Demo Google chooser" means no Google Client ID is set. It is a free Google Cloud setting; nobody can create it for you.
1. https://console.cloud.google.com/ > create a project.
2. APIs & Services > OAuth consent screen > External > app name + your email > Save. Add your Gmail under **Test users**.
3. Credentials > Create credentials > OAuth client ID > **Web application**.
4. Authorised JavaScript origins: add `http://localhost:5173` **and** `http://localhost`.
5. Copy the Client ID, then run `npm run setup:google` and paste it (or put it in `.env` as `GOOGLE_CLIENT_ID=`; one line is enough).
6. Stop and restart `npm run dev`, open http://localhost:5173, press Ctrl+Shift+R.
Check: http://localhost:3001/api/health shows `"google": true`.

## Real OTP emails (one-time, 2 minutes)
The banner "No SMTP set in .env ... email is simulated" means `SMTP_USER` / `SMTP_PASS` are empty in `.env`.
1. Google Account > Security > turn ON **2-Step Verification**.
2. Open https://myaccount.google.com/apppasswords and create an app password named FieldShift (16 letters).
3. In the terminal run: `npm run setup:mail` (choose Gmail, enter email + the 16 letters). It sends a test email and fills `.env` for you.
   Or edit `.env` by hand: `SMTP_USER=you@gmail.com`, `SMTP_PASS=xxxxxxxxxxxxxxxx`.
4. **Stop and restart** the app (`Ctrl+C`, then `npm run dev`). `.env` is only read at start.
5. Check anytime: `npm run test:mail` or open http://localhost:3001/api/health (`"mail": true` = working).

Notes: Gmail needs the App Password, not your normal password. If port 587 is blocked by your network, the server automatically retries on port 465. Outlook and Brevo are also supported in `npm run setup:mail`.
