# RiverWatch PRO — Mobile Simulator

A React Native / Expo mobile app that acts as a hardware simulator for the **RiverWatch PRO** ESP32 sensor kit.

## Features

- 📱 **Real phone sensors** — GPS, Barometer, Light Sensor (Android)
- 🌊 **Manual controls** — Water level, rain intensity, humidity sliders
- ⚡ **Auto-Simulation Engine** — 5-phase autonomous flood cycle (Calm → Developing → Active Storm → Peak Flood → Recession)
- 🚨 **Risk scoring** — TypeScript port of ESP32 risk engine with linear regression
- 📡 **Live transmitter** — POSTs to Railway/Render backend every N seconds
- 🔌 **Connection test** — Verify backend connectivity from Settings tab
- 💾 **Persistent settings** — Backend URL + API key stored in SecureStore
- 🎬 **5 scenario presets** — Clear Day / Light Rain / Heavy Storm / Active Flood / Flash Flood

## Setup

```bash
cd riverwatch-mobile
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS/Android).

## Configuration

In the **Settings** tab:
1. Set your backend URL (default: `https://riverwatch-pro.onrender.com`)
2. Enter API key if required
3. Set transmission interval (5s–60s)
4. Tap **Test Connection** to verify

## Payload Format

The app sends the same JSON as the ESP32 hardware, plus additive mobile fields:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "water": 45.2,
  "distance": 104.8,
  "temp": 22.1,
  "humidity": 68.0,
  "rainAnalog": 1800,
  "raining": 1,
  "light": 1,
  "dark": 0,
  "alert": "WARNING",
  "gpsStatus": 1,
  "lat": 37.7749,
  "lng": -122.4194,
  "sats": 7,
  "source": "mobile_simulator",
  "deviceId": "uuid-v4-string",
  "riskScore": 55
}
```

## Sensor Notes

| Sensor | iOS | Android | Fallback |
|--------|-----|---------|----------|
| GPS | ✅ | ✅ | null coords |
| Barometer | ✅ | ✅ | 22°C temp |
| Light | ❌ | ✅ | Night Mode toggle |
| Water Level | Slider | Slider | Default 12cm |
| Rain | Slider | Slider | ADC 3800 (dry) |

## Risk Engine

The app uses a weighted 4-factor risk scoring system (0–100):

- **Water Level** (50%) — primary driver
- **Rise Rate** (30%) — 30-sample linear regression  
- **Rain Intensity** (15%) — ADC inversion  
- **Temperature** (5%) — anomaly weighting  

Alert levels: `SAFE` (0–24) → `WATCH` (25–49) → `WARNING` (50–74) → `FLOOD` (75–89) → `CRITICAL` (90–100)
