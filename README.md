# RiverWatch PRO 🌊

Real-time river and lake water monitoring system with ESP32 Bluetooth telemetry, Flask backend, and React dashboard.

## Architecture

```
ESP32 (RiverWatch_PRO)
  │  Bluetooth SPP (Classic BT)
  ▼
Flask + SocketIO Backend (:9100)
  │  REST API + WebSocket
  ▼
React Dashboard (Vite)
```

## Repository Structure

```
LakeAware/
├── riverwatch-backend/      # Flask + SocketIO backend
│   ├── app.py               # Main server, REST API, WebSocket
│   ├── bluetooth_reader.py  # BT SPP serial reader (daemon thread)
│   ├── database.py          # SQLite helpers (readings + alerts)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── riverwatch-dashboard/    # React + Vite frontend
│   ├── src/
│   │   ├── components/      # AlertBanner, SensorCards, Charts, Map…
│   │   ├── hooks/           # useSocket, useHistory
│   │   └── utils/           # alertColors
│   ├── vercel.json
│   └── .env.example
└── docker-compose.yml       # Backend containerised on port 9100
```

## Alert Levels (v2)

| Level    | Water  | Color  |
|----------|--------|--------|
| SAFE     | < 20cm | 🟢 Green |
| WATCH    | > 20cm | 🟡 Amber |
| WARNING  | > 40cm | 🟠 Orange |
| DANGER   | > 60cm | 🔴 Red |
| CRITICAL | > 75cm | 🚨 Dark Red (pulsing) |

---

## Local Development

### Backend

```bash
cd riverwatch-backend
python -m venv venv && source venv/bin/activate   # macOS/Linux
# Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set BT_PORT to your device's serial port
python app.py
# → http://localhost:9100
```

**macOS BT port:** `/dev/cu.RiverWatch_PRO`  
**Linux BT port:** `/dev/rfcomm0`  
**Windows BT port:** `COM6` (check Device Manager)

### Frontend

```bash
cd riverwatch-dashboard
npm install
cp .env.example .env       # set VITE_API_URL=http://localhost:9100
npm run dev
# → http://localhost:5173
```

---

## 🐳 Docker Deployment (Backend)

> **Note:** Bluetooth serial passthrough works on Linux hosts only.  
> On macOS, run the backend natively (Docker Desktop doesn't support BT/serial).

### 1. Configure environment

```bash
cp riverwatch-backend/.env.example riverwatch-backend/.env
# Set BT_PORT, BT_BAUD as needed
```

### 2. Build and start

```bash
docker compose up -d
docker compose logs -f riverwatch-backend
```

Backend runs on **port 9100**.

### 3. Enable Bluetooth passthrough (Linux)

In `docker-compose.yml`, uncomment the `devices` block:

```yaml
devices:
  - "/dev/rfcomm0:/dev/rfcomm0"
```

Bind the device first if needed:
```bash
sudo rfcomm bind /dev/rfcomm0 <ESP32_MAC_ADDRESS>
```

### Health check

```bash
curl http://localhost:9100/api/status
```

---

## ▲ Vercel Deployment (Frontend)

1. Import the repo into [Vercel](https://vercel.com)
2. Set **Root Directory** to `riverwatch-dashboard`
3. Add environment variable:
   ```
   VITE_API_URL = http://your-server-ip:9100
   ```
4. Deploy — Vercel auto-detects Vite and builds `dist/`

The `vercel.json` handles SPA routing rewrites automatically.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | BT connection status |
| GET | `/api/latest` | Most recent reading |
| GET | `/api/history?limit=100` | Reading history (max 500) |
| GET | `/api/alerts?limit=50` | Alert event log |
| GET | `/api/stats` | 24h aggregates |

**WebSocket events:** `reading` (every ~2s), `alert` (on non-SAFE levels)

---

## ESP32 Firmware

The device sends one JSON line every 2 seconds over Classic Bluetooth SPP:

```json
{
  "water": 12.3, "riseRate": 0.12, "eta": 45.0, "risk": 32,
  "temp": 28.5, "humidity": 65, "rainAnalog": 890, "raining": 0,
  "light": 2100, "dark": 0, "alert": "SAFE",
  "gpsStatus": 2, "lat": 5.614818, "lng": 0.205874, "sats": 6,
  "btPaired": 1
}
```
