# RiverWatch PRO — Dashboard Frontend

A React dashboard for real-time river/lake water monitoring.

## Prerequisites

- Node.js 18+
- The Flask backend running at `http://localhost:5000`

## Setup & Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Important Notes

### Leaflet CSS Import

The Leaflet CSS is imported in both `src/main.jsx` and `src/index.css`:

```js
// In main.jsx
import 'leaflet/dist/leaflet.css'

// In index.css
@import 'leaflet/dist/leaflet.css';
```

### Leaflet Default Marker Icon Fix

Vite/webpack breaks Leaflet's default marker icons due to asset handling.
This fix is already applied in `src/main.jsx`:

```js
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})
```

## Backend Connection

The app connects to `http://localhost:5000` via:
- **REST API**: `/api/history`, `/api/alerts`, `/api/latest`, `/api/stats`
- **WebSocket (Socket.IO)**: Real-time `reading` and `alert` events

If the backend is offline, the dashboard shows an "Backend offline" banner but remains fully rendered with `--` placeholders.

## Tech Stack

- **React + Vite** — Fast development
- **Recharts** — Water level & rain/humidity charts
- **React Leaflet** — GPS map with dark tile layer
- **Socket.IO Client** — Real-time WebSocket updates
- **Axios** — HTTP API calls
- **date-fns** — Timestamp formatting
