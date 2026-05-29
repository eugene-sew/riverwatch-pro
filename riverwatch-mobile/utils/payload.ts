/**
 * Payload builder — constructs the exact JSON contract the backend expects.
 *
 * The payload is byte-for-byte compatible with the ESP32 RiverWatch_PRO telemetry.
 * Extra fields (source, deviceId) are additive and ignored by existing parsers.
 */

import { AlertLevel } from '../constants/alertLevels';

export interface SensorState {
  // Phone sensors
  lat: number | null;
  lng: number | null;
  gpsStatus: number;   // 1 = fix, 0 = no fix
  sats: number;
  temp: number;        // °C (barometer or default)
  humidity: number;    // % (simulated)
  light: number;       // lux → mapped to 0/1
  dark: number;        // 1 if dark, 0 if light

  // Simulated sensors
  water: number;       // cm
  distance: number;    // cm (HC-SR04 equivalent: water = depth, distance = gap)
  rainAnalog: number;  // ADC 0-4095
  raining: number;     // 0 or 1
}

export interface RiskState {
  alert: AlertLevel;
  score: number;
}

export interface DeviceInfo {
  deviceId: string;  // UUID stored in SecureStore
}

export interface ESP32Payload {
  // Core sensor fields (ESP32 contract)
  timestamp: string;
  water: number;
  distance: number;
  temp: number;
  humidity: number;
  rainAnalog: number;
  raining: number;
  light: number;
  dark: number;
  alert: AlertLevel;
  gpsStatus: number;
  lat: number | null;
  lng: number | null;
  sats: number;

  // Mobile-only additive fields
  source: 'mobile_simulator';
  deviceId: string;
  riskScore: number;
}

/**
 * Build the payload from current sensor and risk state.
 */
export function buildPayload(
  sensors: SensorState,
  risk: RiskState,
  device: DeviceInfo,
): ESP32Payload {
  const now = new Date();
  const ts =
    now.toISOString().replace('T', 'T').split('.')[0] +
    '.' +
    String(now.getMilliseconds()).padStart(3, '0') +
    'Z';

  return {
    timestamp: ts,
    water: round(sensors.water, 2),
    distance: round(sensors.distance, 2),
    temp: round(sensors.temp, 1),
    humidity: round(sensors.humidity, 1),
    rainAnalog: Math.round(sensors.rainAnalog),
    raining: sensors.raining,
    light: sensors.light,
    dark: sensors.dark,
    alert: risk.alert,
    gpsStatus: sensors.gpsStatus,
    lat: sensors.lat !== null ? round(sensors.lat, 6) : null,
    lng: sensors.lng !== null ? round(sensors.lng, 6) : null,
    sats: sensors.sats,

    source: 'mobile_simulator',
    deviceId: device.deviceId,
    riskScore: risk.score,
  };
}

function round(n: number, dp: number): number {
  const factor = Math.pow(10, dp);
  return Math.round(n * factor) / factor;
}

/** Map barometer pressure to approximate altitude */
export function pressureToAltitude(hPa: number): number {
  // Hypsometric formula approximation
  return Math.round(44330 * (1 - Math.pow(hPa / 1013.25, 0.1903)));
}

/** Map lux to ESP32 light/dark boolean encoding */
export function luxToLightDark(lux: number | null): { light: number; dark: number } {
  if (lux === null) return { light: 1, dark: 0 };
  return {
    light: lux > 50 ? 1 : 0,
    dark: lux <= 50 ? 1 : 0,
  };
}

/** Map water level (cm) to HC-SR04 distance reading */
export function waterToDistance(water: number, maxDepth = 150): number {
  // Sensor mounted above water; distance = maxDepth - water
  return Math.max(0, maxDepth - water);
}

/** Map rain ADC to raining boolean (1/0) */
export function rainAnalogToBoolean(adc: number, threshold = 2500): number {
  return adc < threshold ? 1 : 0;
}

/** Generate a stable UUID v4 for device identification */
export function generateDeviceId(): string {
  // Simple UUID v4 generator (no crypto dependency needed)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
