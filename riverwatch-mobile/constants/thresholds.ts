// Sensor thresholds and risk engine weights
// These are ported from the ESP32 C++ firmware

/** Water level threshold in cm */
export const WATER_THRESHOLDS = {
  SAFE: 0,
  WATCH: 30,
  WARNING: 60,
  FLOOD: 80,
  CRITICAL: 95,
} as const;

/** Rise rate thresholds in cm/min */
export const RISE_RATE_THRESHOLDS = {
  NORMAL: 0,
  ELEVATED: 0.5,
  RAPID: 2.0,
  EXTREME: 5.0,
} as const;

/** Temperature thresholds in °C for risk contribution */
export const TEMP_THRESHOLDS = {
  COLD: 5,
  HOT: 35,
} as const;

/** Rain ADC thresholds (0-4095, lower = wetter) */
export const RAIN_ADC_THRESHOLDS = {
  DRY: 3500,
  LIGHT: 2500,
  MODERATE: 1500,
  HEAVY: 800,
  EXTREME: 400,
} as const;

/** Risk engine weights — must sum to 1.0 */
export const RISK_WEIGHTS = {
  waterLevel: 0.50,    // 50% — primary driver
  riseRate: 0.30,      // 30% — trend is critical
  rainIntensity: 0.15, // 15% — precipitation input
  temperature: 0.05,   // 5%  — indirect factor
} as const;

/** Number of readings to hold in rolling buffer for trend analysis */
export const RISK_BUFFER_SIZE = 30;

/** Default transmission interval in milliseconds */
export const DEFAULT_TX_INTERVAL_MS = 10_000;

/** Forwarder / backend endpoint */
export const DEFAULT_BACKEND_URL = 'https://riverwatch-pro.onrender.com';
export const DEFAULT_INGEST_PATH = '/api/ingest';
export const DEFAULT_API_KEY = 'riverwatch-demo';

/** Scenario presets */
export interface ScenarioPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  water: number;
  rainAnalog: number;
  humidity: number;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'calm',
    name: 'Clear Day',
    icon: '☀️',
    description: 'Normal dry conditions',
    water: 10,
    rainAnalog: 3800,
    humidity: 45,
  },
  {
    id: 'light_rain',
    name: 'Light Rain',
    icon: '🌦️',
    description: 'Mild precipitation, low risk',
    water: 28,
    rainAnalog: 2400,
    humidity: 75,
  },
  {
    id: 'storm',
    name: 'Heavy Storm',
    icon: '⛈️',
    description: 'Active storm, rising water',
    water: 62,
    rainAnalog: 900,
    humidity: 95,
  },
  {
    id: 'flood',
    name: 'Active Flood',
    icon: '🌊',
    description: 'Flooding in progress',
    water: 84,
    rainAnalog: 350,
    humidity: 99,
  },
  {
    id: 'critical',
    name: 'Flash Flood',
    icon: '🚨',
    description: 'Extreme flash flood event',
    water: 97,
    rainAnalog: 150,
    humidity: 100,
  },
];

/** Auto-simulation phases */
export interface SimPhase {
  name: string;
  durationMs: number;
  targetWater: number;
  targetRainAnalog: number;
  targetHumidity: number;
}

export const AUTO_SIM_PHASES: SimPhase[] = [
  {
    name: 'Calm',
    durationMs: 20_000,
    targetWater: 12,
    targetRainAnalog: 3800,
    targetHumidity: 48,
  },
  {
    name: 'Developing',
    durationMs: 25_000,
    targetWater: 35,
    targetRainAnalog: 2200,
    targetHumidity: 72,
  },
  {
    name: 'Active Storm',
    durationMs: 30_000,
    targetWater: 68,
    targetRainAnalog: 800,
    targetHumidity: 93,
  },
  {
    name: 'Peak Flood',
    durationMs: 20_000,
    targetWater: 92,
    targetRainAnalog: 180,
    targetHumidity: 99,
  },
  {
    name: 'Recession',
    durationMs: 25_000,
    targetWater: 22,
    targetRainAnalog: 3200,
    targetHumidity: 60,
  },
];
